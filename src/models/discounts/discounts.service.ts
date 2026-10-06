import { HTTPException } from "hono/http-exception";
import { PrismaClient } from "../../generated/prisma/client";
import {
    CreateDiscountType,
    UpdateDiscountType,
    DiscountQueryType,
} from "./discounts.validator";

// Helper function
const slugify = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};


export const createDiscount = async (data: CreateDiscountType, prisma: PrismaClient) => {
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);

    if (!slug) {
        throw new HTTPException(400, { message: "Invalid discount name or slug" });
    }

    if (data.type === "percentage" && data.discount > 100) {
        throw new HTTPException(400, {
            message: "Percentage discount cannot exceed 100%",
        });
    }

    const existing = await prisma.discounts.findFirst({
        where: {
            OR: [{ name: data.name }, { slug }],
        },
    });

    if (existing) {
        if (existing.name.toLowerCase() === data.name.toLowerCase()) {
            throw new HTTPException(409, {
                message: `A discount with name '${data.name}' already exists`,
            });
        }
        throw new HTTPException(409, {
            message: `A discount with slug '${slug}' already exists`,
        });
    }

    return await prisma.discounts.create({
        data: {
            ...data,
            slug,
        },
    });
};

export const getDiscounts = async (query: DiscountQueryType, prisma: PrismaClient) => {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.type) {
        where.type = query.type;
    }

    if (query.activeOnly === "true") {
        const now = new Date();
        where.startDate = { lte: now };
        where.endDate = { gte: now };
    }

    if (query.search && query.search.trim()) {
        const search = query.search.trim();
        where.OR = [
            { name: { contains: search } },
            { slug: { contains: search } },
            { description: { contains: search } },
        ];
    }

    // Parallel count and fetch
    const [total, discounts] = await Promise.all([
        prisma.discounts.count({ where }),
        prisma.discounts.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
    ]);

    return {
        discounts,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};


export const getDiscountById = async (id: number, prisma: PrismaClient) => {
    const discount = await prisma.discounts.findUnique({
        where: { id },
    });

    if (!discount) {
        throw new HTTPException(404, { message: "Discount not found" });
    }

    return discount;
};


export const getDiscountBySlug = async (slug: string, prisma: PrismaClient) => {
    const discount = await prisma.discounts.findUnique({
        where: { slug },
    });

    if (!discount) {
        throw new HTTPException(404, { message: `Discount with slug '${slug}' not found` });
    }

    return discount;
};

export const updateDiscount = async (
    data: UpdateDiscountType & { id: number },
    prisma: PrismaClient
) => {
    const existing = await prisma.discounts.findUnique({
        where: { id: data.id },
    });

    if (!existing) {
        throw new HTTPException(404, { message: "Discount not found" });
    }

    const { id, name, slug, ...rest } = data;

    // Validate percentage discount
    const targetType = rest.type ?? existing.type;
    const targetDiscount = rest.discount ?? existing.discount;
    if (targetType === "percentage" && targetDiscount > 100) {
        throw new HTTPException(400, {
            message: "Percentage discount cannot exceed 100%",
        });
    }

    // Validate dates
    const effectiveStart = rest.startDate ?? existing.startDate;
    const effectiveEnd = rest.endDate ?? existing.endDate;
    if (effectiveEnd <= effectiveStart) {
        throw new HTTPException(400, {
            message: "End date must be after start date",
        });
    }

    // Resolve slug
    const nextSlug = slug ? slugify(slug) : name ? slugify(name) : undefined;

    // Verify uniqueness if name or slug changed
    if ((name && name !== existing.name) || (nextSlug && nextSlug !== existing.slug)) {
        const duplicate = await prisma.discounts.findFirst({
            where: {
                id: { not: id },
                OR: [
                    ...(name ? [{ name }] : []),
                    ...(nextSlug ? [{ slug: nextSlug }] : []),
                ],
            },
        });

        if (duplicate) {
            throw new HTTPException(409, {
                message: duplicate.name === name
                    ? `A discount with name '${name}' already exists`
                    : `A discount with slug '${nextSlug}' already exists`,
            });
        }
    }

    return await prisma.discounts.update({
        where: { id },
        data: {
            ...rest,
            ...(name !== undefined && { name }),
            ...(nextSlug !== undefined && { slug: nextSlug }),
        },
    });
};


export const deleteDiscount = async (id: number, prisma: PrismaClient) => {
    try {
        return await prisma.discounts.delete({
            where: { id },
        });
    } catch (err) {
        if (err instanceof Error && "code" in err && err.code === "P2025") {
            throw new HTTPException(404, { message: "Discount not found" });
        }
        throw err;
    }
};

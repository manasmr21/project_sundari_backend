import { HTTPException } from "hono/http-exception";
import { PrismaClient } from "../../generated/prisma/client";
import {
    CreateBrandType,
    UpdateBrandType,
    BrandQueryType,
} from "./brands.validator";

// Helper function
const slugify = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

/**
 * Creates a new brand with a unique slug and name.
 */
export const createBrand = async (data: CreateBrandType, prisma: PrismaClient) => {
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);

    if (!slug) {
        throw new HTTPException(400, { message: "Invalid brand name or slug" });
    }

    const existing = await prisma.brands.findUnique({
        where: { slug },
    });

    if (existing) {
        throw new HTTPException(409, {
            message: `A brand with slug '${slug}' already exists`,
        });
    }

    return await prisma.brands.create({
        data: {
            name: data.name,
            slug,
            description: data.description,
            logo: data.logo,
        },
    });
};

/**
 * Retrieves brands with optional search filtering and pagination.
 */
export const getBrands = async (query: BrandQueryType, prisma: PrismaClient) => {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search && query.search.trim()) {
        const search = query.search.trim();
        where.OR = [
            { name: { contains: search } },
            { slug: { contains: search } },
            { description: { contains: search } },
        ];
    }

    // Parallel count and fetch
    const [total, brands] = await Promise.all([
        prisma.brands.count({ where }),
        prisma.brands.findMany({
            where,
            skip,
            take: limit,
            include: {
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
            orderBy: { name: "asc" },
        }),
    ]);

    return {
        brands,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

/**
 * Retrieves a brand by ID.
 */
export const getBrandById = async (id: number, prisma: PrismaClient) => {
    const brand = await prisma.brands.findUnique({
        where: { id },
    });

    if (!brand) {
        throw new HTTPException(404, { message: "Brand not found" });
    }

    return brand;
};

/**
 * Retrieves a brand by slug.
 */
export const getBrandBySlug = async (slug: string, prisma: PrismaClient) => {
    const brand = await prisma.brands.findUnique({
        where: { slug },
    });

    if (!brand) {
        throw new HTTPException(404, { message: `Brand with slug '${slug}' not found` });
    }

    return brand;
};

/**
 * Updates a brand by ID.
 */
export const updateBrand = async (
    data: UpdateBrandType & { id: number },
    prisma: PrismaClient
) => {
    const existing = await prisma.brands.findUnique({
        where: { id: data.id },
    });

    if (!existing) {
        throw new HTTPException(404, { message: "Brand not found" });
    }

    const updateData: any = {};

    if (data.name !== undefined) {
        updateData.name = data.name;
    }

    if (data.slug !== undefined) {
        updateData.slug = slugify(data.slug);
    } else if (data.name !== undefined) {
        updateData.slug = slugify(data.name);
    }

    if (data.description !== undefined) {
        updateData.description = data.description;
    }

    if (data.logo !== undefined) {
        updateData.logo = data.logo;
    }

    // Check for duplicates if slug is being updated
    if (updateData.slug && updateData.slug !== existing.slug) {
        const duplicate = await prisma.brands.findUnique({
            where: { slug: updateData.slug },
        });

        if (duplicate) {
            throw new HTTPException(409, {
                message: `A brand with slug '${updateData.slug}' already exists`,
            });
        }
    }

    return await prisma.brands.update({
        where: { id: data.id },
        data: updateData,
    });
};

/**
 * Deletes a brand by ID.
 */
export const deleteBrand = async (id: number, prisma: PrismaClient) => {
    try {
        return await prisma.brands.delete({
            where: { id },
        });
    } catch (err) {
        if (err instanceof Error && "code" in err && err.code === "P2025") {
            throw new HTTPException(404, { message: "Brand not found" });
        }
        throw err;
    }
};

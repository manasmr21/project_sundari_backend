import { HTTPException } from "hono/http-exception";
import { PrismaClient } from "../../generated/prisma/client";
import {
    CreateCategoryType,
    UpdateCategoryType,
    CategoryQueryType,
} from "./categories.validator";


//Helper function
export const slugify = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

export const createCategory = async (data: CreateCategoryType, prisma: PrismaClient) => {
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);

    if (!slug) {
        throw new HTTPException(400, { message: "Invalid category name or slug" });
    }

    // Check if category with same name or slug already exists
    const existing = await prisma.categories.findFirst({
        where: {
            OR: [{ name: data.name }, { slug }],
        },
    });

    if (existing) {
        if (existing.name.toLowerCase() === data.name.toLowerCase()) {
            throw new HTTPException(409, {
                message: `A category with name '${data.name}' already exists`,
            });
        }
        throw new HTTPException(409, {
            message: `A category with slug '${slug}' already exists`,
        });
    }

    return await prisma.categories.create({
        data: {
            name: data.name,
            slug,
            description: data.description,
            image: data.image,
        },
    });
};


export const getCategories = async (query: CategoryQueryType, prisma: PrismaClient) => {
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

    // Fetch total count and category records in parallel
    const [total, categories] = await Promise.all([
        prisma.categories.count({ where }),
        prisma.categories.findMany({
            where,
            skip,
            take: limit,
            include: {
                _count: {
                    select: {
                        subCategories: true,
                        products: true,
                    },
                },
            },
            orderBy: { name: "asc" },
        }),
    ]);

    return {
        categories,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};


export const getCategoryById = async (id: number, prisma: PrismaClient) => {
    const category = await prisma.categories.findUnique({
        where: { id },
        include: {
            subCategories: true,
        },
    });

    if (!category) {
        throw new HTTPException(404, { message: "Category not found" });
    }

    return category;
};

export const getCategoryBySlug = async (slug: string, prisma: PrismaClient) => {
    const category = await prisma.categories.findUnique({
        where: { slug },
        include: {
            subCategories: true,
        },
    });

    if (!category) {
        throw new HTTPException(404, { message: `Category with slug '${slug}' not found` });
    }

    return category;
};


export const updateCategory = async (
    data: UpdateCategoryType & { id: number },
    prisma: PrismaClient
) => {
    const existing = await prisma.categories.findUnique({
        where: { id: data.id },
    });

    if (!existing) {
        throw new HTTPException(404, { message: "Category not found" });
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

    if (data.image !== undefined) {
        updateData.image = data.image;
    }

    // Verify uniqueness if name or slug is being updated
    if (updateData.name || updateData.slug) {
        const duplicate = await prisma.categories.findFirst({
            where: {
                id: { not: data.id },
                OR: [
                    ...(updateData.name ? [{ name: updateData.name }] : []),
                    ...(updateData.slug ? [{ slug: updateData.slug }] : []),
                ],
            },
        });

        if (duplicate) {
            if (duplicate.name === updateData.name) {
                throw new HTTPException(409, {
                    message: `A category with name '${updateData.name}' already exists`,
                });
            }
            throw new HTTPException(409, {
                message: `A category with slug '${updateData.slug}' already exists`,
            });
        }
    }

    return await prisma.categories.update({
        where: { id: data.id },
        data: updateData,
    });
};

export const deleteCategory = async (id: number, prisma: PrismaClient) => {
    try {
        return await prisma.categories.delete({
            where: { id },
        });
    } catch (err) {
        if (err instanceof Error && "code" in err && err.code === "P2025") {
            throw new HTTPException(404, { message: "Category not found" });
        }
        throw err;
    }
};

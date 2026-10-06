import { HTTPException } from "hono/http-exception";
import { PrismaClient } from "../../generated/prisma/client";
import {
    CreateSubCategoryType,
    UpdateSubCategoryType,
    SubCategoryQueryType,
} from "./subCategories.validator";

// Helper function
const slugify = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

export const createSubCategory = async (data: CreateSubCategoryType, prisma: PrismaClient) => {
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);

    if (!slug) {
        throw new HTTPException(400, { message: "Invalid sub-category name or slug" });
    }

    // Verify parent category exists and slug is unique in parallel
    const [categoryExists, existingSlug] = await Promise.all([
        prisma.categories.findUnique({ where: { id: data.categoryId } }),
        prisma.subCategories.findUnique({ where: { slug } }),
    ]);

    if (!categoryExists) {
        throw new HTTPException(404, {
            message: `Parent category with ID ${data.categoryId} not found`,
        });
    }

    if (existingSlug) {
        throw new HTTPException(409, {
            message: `A sub-category with slug '${slug}' already exists`,
        });
    }

    return await prisma.subCategories.create({
        data: {
            name: data.name,
            slug,
            categoryId: data.categoryId,
            description: data.description,
            image: data.image,
        },
        include: {
            category: true,
        },
    });
};

export const getSubCategories = async (query: SubCategoryQueryType, prisma: PrismaClient) => {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.categoryId) {
        where.categoryId = query.categoryId;
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
    const [total, subCategories] = await Promise.all([
        prisma.subCategories.count({ where }),
        prisma.subCategories.findMany({
            where,
            skip,
            take: limit,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
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
        subCategories,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

export const getSubCategoryById = async (id: number, prisma: PrismaClient) => {
    const subCategory = await prisma.subCategories.findUnique({
        where: { id },
        include: {
            category: true,
        },
    });

    if (!subCategory) {
        throw new HTTPException(404, { message: "Sub-category not found" });
    }

    return subCategory;
};


export const getSubCategoryBySlug = async (slug: string, prisma: PrismaClient) => {
    const subCategory = await prisma.subCategories.findUnique({
        where: { slug },
        include: {
            category: true,
        },
    });

    if (!subCategory) {
        throw new HTTPException(404, { message: `Sub-category with slug '${slug}' not found` });
    }

    return subCategory;
};

export const updateSubCategory = async (
    data: UpdateSubCategoryType & { id: number },
    prisma: PrismaClient
) => {
    const existing = await prisma.subCategories.findUnique({
        where: { id: data.id },
    });

    if (!existing) {
        throw new HTTPException(404, { message: "Sub-category not found" });
    }

    const { id, name, slug, ...rest } = data;

    // Resolve slug and verify changes
    const nextSlug = slug ? slugify(slug) : name ? slugify(name) : undefined;
    const isSlugChanged = nextSlug && nextSlug !== existing.slug;

    // Run category check and slug collision check concurrently
    const [categoryExists, duplicateSlug] = await Promise.all([
        rest.categoryId ? prisma.categories.findUnique({ where: { id: rest.categoryId } }) : Promise.resolve(true),
        isSlugChanged ? prisma.subCategories.findUnique({ where: { slug: nextSlug } }) : Promise.resolve(null),
    ]);

    if (rest.categoryId && !categoryExists) {
        throw new HTTPException(404, { message: `Category with ID ${rest.categoryId} not found` });
    }

    if (duplicateSlug) {
        throw new HTTPException(409, {
            message: `A sub-category with slug '${nextSlug}' already exists`,
        });
    }

    return await prisma.subCategories.update({
        where: { id },
        data: {
            ...rest,
            ...(name !== undefined && { name }),
            ...(nextSlug !== undefined && { slug: nextSlug }),
        },
        include: {
            category: true,
        },
    });
};

export const deleteSubCategory = async (id: number, prisma: PrismaClient) => {
    try {
        return await prisma.subCategories.delete({
            where: { id },
        });
    } catch (err) {
        if (err instanceof Error && "code" in err && err.code === "P2025") {
            throw new HTTPException(404, { message: "Sub-category not found" });
        }
        throw err;
    }
};

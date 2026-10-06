import { HTTPException } from "hono/http-exception";
import { PrismaClient } from "../../generated/prisma/client";
import {
    CreateProductType,
    UpdateProductType,
    ProductQueryType,
} from "./products.validator";

// Helper function
const slugify = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};


const formatProductResponse = (product: any) => {
    if (!product) return null;
    return product;
};


export const createProduct = async (data: CreateProductType, prisma: PrismaClient) => {
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);

    if (!slug) {
        throw new HTTPException(400, { message: "Invalid product name or slug" });
    }

    const discountPrice = data.discountPrice ?? data.discount_price ?? null;
    if (discountPrice !== null && discountPrice > data.price) {
        throw new HTTPException(400, {
            message: "Discount price cannot be higher than the regular price",
        });
    }

    // Parallel validation of relations and slug uniqueness
    const [existingSlug, categoryExists, subCategoryExists, brandExists] = await Promise.all([
        prisma.products.findUnique({ where: { slug } }),
        prisma.categories.findUnique({ where: { id: data.categoryId } }),
        data.subCategoryId ? prisma.subCategories.findUnique({ where: { id: data.subCategoryId } }) : Promise.resolve(null),
        data.brandId ? prisma.brands.findUnique({ where: { id: data.brandId } }) : Promise.resolve(null),
    ]);

    if (existingSlug) {
        throw new HTTPException(409, {
            message: `A product with slug '${slug}' already exists`,
        });
    }

    if (!categoryExists) {
        throw new HTTPException(404, {
            message: `Category with ID ${data.categoryId} not found`,
        });
    }

    if (data.subCategoryId && !subCategoryExists) {
        throw new HTTPException(404, {
            message: `Sub-category with ID ${data.subCategoryId} not found`,
        });
    }

    if (data.brandId && !brandExists) {
        throw new HTTPException(404, {
            message: `Brand with ID ${data.brandId} not found`,
        });
    }

    const imageUrls: string[] = data.images
        ? (Array.isArray(data.images) ? data.images : [data.images]).filter(Boolean)
        : [];

    const product = await prisma.products.create({
        data: {
            name: data.name,
            slug,
            description: data.description,
            price: data.price,
            discountPrice,
            categoryId: data.categoryId,
            subCategoryId: data.subCategoryId ?? null,
            brandId: data.brandId ?? null,
            images: imageUrls.length > 0
                ? {
                    create: imageUrls.map((url) => ({ url })),
                }
                : undefined,
            thumbnail: data.thumbnail ?? null,
            stock: data.stock ?? 0,
        },
        include: {
            category: true,
            subCategory: true,
            brand: true,
            images: true,
        },
    });

    return formatProductResponse(product);
};

export const getProducts = async (query: ProductQueryType, prisma: PrismaClient) => {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.categoryId) {
        where.categoryId = query.categoryId;
    }

    if (query.subCategoryId) {
        where.subCategoryId = query.subCategoryId;
    }

    if (query.brandId) {
        where.brandId = query.brandId;
    }

    if (query.inStock !== undefined) {
        where.stock = query.inStock === "true" ? { gt: 0 } : { equals: 0 };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        where.price = {};
        if (query.minPrice !== undefined) where.price.gte = query.minPrice;
        if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
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
    const [total, products] = await Promise.all([
        prisma.products.count({ where }),
        prisma.products.findMany({
            where,
            skip,
            take: limit,
            include: {
                category: {
                    select: { id: true, name: true, slug: true },
                },
                subCategory: {
                    select: { id: true, name: true, slug: true },
                },
                brand: {
                    select: { id: true, name: true, slug: true },
                },
                images: true,
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    return {
        products: products.map(formatProductResponse),
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};


export const getProductById = async (id: string, prisma: PrismaClient) => {
    const product = await prisma.products.findUnique({
        where: { id },
        include: {
            category: true,
            subCategory: true,
            brand: true,
            images: true,
        },
    });

    if (!product) {
        throw new HTTPException(404, { message: "Product not found" });
    }

    return formatProductResponse(product);
};

export const getProductBySlug = async (slug: string, prisma: PrismaClient) => {
    const product = await prisma.products.findUnique({
        where: { slug },
        include: {
            category: true,
            subCategory: true,
            brand: true,
            images: true,
        },
    });

    if (!product) {
        throw new HTTPException(404, { message: `Product with slug '${slug}' not found` });
    }

    return formatProductResponse(product);
};

export const updateProduct = async (
    data: UpdateProductType & { id: string },
    prisma: PrismaClient
) => {
    const existing = await prisma.products.findUnique({
        where: { id: data.id },
    });

    if (!existing) {
        throw new HTTPException(404, { message: "Product not found" });
    }

    const { id, name, slug, discountPrice, discount_price, images, ...rest } = data;

    // Validate effective price vs discount price
    const effectivePrice = rest.price ?? existing.price;
    const resolvedDiscountPrice = discountPrice ?? discount_price;
    if (resolvedDiscountPrice !== undefined && resolvedDiscountPrice !== null && resolvedDiscountPrice > effectivePrice) {
        throw new HTTPException(400, {
            message: "Discount price cannot be higher than the regular price",
        });
    }

    // Validate foreign keys in parallel
    const [categoryExists, subCategoryExists, brandExists] = await Promise.all([
        rest.categoryId ? prisma.categories.findUnique({ where: { id: rest.categoryId } }) : Promise.resolve(true),
        rest.subCategoryId ? prisma.subCategories.findUnique({ where: { id: rest.subCategoryId } }) : Promise.resolve(true),
        rest.brandId ? prisma.brands.findUnique({ where: { id: rest.brandId } }) : Promise.resolve(true),
    ]);

    if (rest.categoryId && !categoryExists) {
        throw new HTTPException(404, { message: `Category with ID ${rest.categoryId} not found` });
    }
    if (rest.subCategoryId && !subCategoryExists) {
        throw new HTTPException(404, { message: `Sub-category with ID ${rest.subCategoryId} not found` });
    }
    if (rest.brandId && !brandExists) {
        throw new HTTPException(404, { message: `Brand with ID ${rest.brandId} not found` });
    }

    // Resolve slug and verify uniqueness if changed
    const nextSlug = slug ? slugify(slug) : name ? slugify(name) : undefined;
    if (nextSlug && nextSlug !== existing.slug) {
        const duplicate = await prisma.products.findUnique({ where: { slug: nextSlug } });
        if (duplicate) {
            throw new HTTPException(409, {
                message: `A product with slug '${nextSlug}' already exists`,
            });
        }
    }

    // Resolve images relation update if provided
    let imageUpdate;
    if (images !== undefined) {
        const imageUrls = (Array.isArray(images) ? images : [images]).filter(Boolean);
        imageUpdate = {
            deleteMany: {},
            create: imageUrls.map((url) => ({ url })),
        };
    }

    const updated = await prisma.products.update({
        where: { id },
        data: {
            ...rest,
            ...(name !== undefined && { name }),
            ...(nextSlug !== undefined && { slug: nextSlug }),
            ...(resolvedDiscountPrice !== undefined && { discountPrice: resolvedDiscountPrice }),
            ...(imageUpdate && { images: imageUpdate }),
        },
        include: {
            category: true,
            subCategory: true,
            brand: true,
            images: true,
        },
    });

    return formatProductResponse(updated);
};

export const deleteProduct = async (id: string, prisma: PrismaClient) => {
    try {
        const deleted = await prisma.products.delete({
            where: { id },
            include: {
                category: true,
                subCategory: true,
                brand: true,
                images: true,
            },
        });

        return formatProductResponse(deleted);
    } catch (err) {
        if (err instanceof Error && "code" in err && err.code === "P2025") {
            throw new HTTPException(404, { message: "Product not found" });
        }
        throw err;
    }
};

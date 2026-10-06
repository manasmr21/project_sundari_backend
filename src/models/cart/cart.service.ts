import { HTTPException } from "hono/http-exception";
import { PrismaClient } from "../../generated/prisma/client";
import {
    AddToCartType,
    UpdateCartItemType,
    CartQueryType,
} from "./cart.validator";

/**
 * Adds an item to the user's cart.
 * If the item already exists in the cart, increments the quantity.
 */
export const addToCart = async (data: AddToCartType, prisma: PrismaClient) => {
    const [user, product] = await Promise.all([
        prisma.users.findUnique({ where: { id: data.userId } }),
        prisma.products.findUnique({ where: { id: data.productId } }),
    ]);

    if (!user) {
        throw new HTTPException(404, { message: `User not found` });
    }

    if (!product) {
        throw new HTTPException(404, { message: `Product not found` });
    }

    // Check if the item already exists in the cart
    const existing = await prisma.cart.findFirst({
        where: {
            userId: data.userId,
            productId: data.productId,
        },
    });

    const targetQuantity = existing ? existing.quantity + data.quantity : data.quantity;

    if (product.stock < targetQuantity) {
        throw new HTTPException(400, {
            message: `Requested quantity (${targetQuantity}) exceeds available stock (${product.stock})`,
        });
    }

    if (existing) {
        return await prisma.cart.update({
            where: { id: existing.id },
            data: {
                quantity: targetQuantity,
                isGift: data.isGift !== undefined ? data.isGift : existing.isGift,
                giftMessage: data.giftMessage !== undefined ? data.giftMessage : existing.giftMessage,
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        discountPrice: true,
                        thumbnail: true,
                        stock: true,
                    },
                },
            },
        });
    }

    return await prisma.cart.create({
        data: {
            userId: data.userId,
            productId: data.productId,
            quantity: data.quantity,
            isGift: data.isGift ?? false,
            giftMessage: data.giftMessage ?? null,
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    discountPrice: true,
                    thumbnail: true,
                    stock: true,
                },
            },
        },
    });
};


export const getCart = async (query: CartQueryType, prisma: PrismaClient) => {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.userId) {
        where.userId = query.userId;
    }

    const [total, items] = await Promise.all([
        prisma.cart.count({ where }),
        prisma.cart.findMany({
            where,
            skip,
            take: limit,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        discountPrice: true,
                        thumbnail: true,
                        stock: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    return {
        items,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};


export const getCartByUserId = async (userId: string, prisma: PrismaClient) => {
    const user = await prisma.users.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new HTTPException(404, { message: `User with ID '${userId}' not found` });
    }

    const items = await prisma.cart.findMany({
        where: { userId },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    discountPrice: true,
                    thumbnail: true,
                    stock: true,
                    category: { select: { id: true, name: true, slug: true } },
                    brand: { select: { id: true, name: true, slug: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    let totalItems = 0;
    let originalSubtotal = 0;
    let subtotal = 0;

    for (const item of items) {
        totalItems += item.quantity;
        const regPrice = item.product.price;
        const finalPrice = item.product.discountPrice ?? regPrice;
        originalSubtotal += regPrice * item.quantity;
        subtotal += finalPrice * item.quantity;
    }

    return {
        items,
        summary: {
            totalItems,
            itemCount: items.length,
            originalSubtotal: Math.round(originalSubtotal * 100) / 100,
            subtotal: Math.round(subtotal * 100) / 100,
            discountSavings: Math.round((originalSubtotal - subtotal) * 100) / 100,
        },
    };
};


export const getCartItemById = async (id: number, prisma: PrismaClient) => {
    const item = await prisma.cart.findUnique({
        where: { id },
        include: {
            product: true,
        },
    });

    if (!item) {
        throw new HTTPException(404, { message: "Cart item not found" });
    }

    return item;
};


export const updateCartItem = async (
    id: number,
    data: UpdateCartItemType,
    prisma: PrismaClient
) => {
    const item = await prisma.cart.findUnique({
        where: { id },
        include: { product: true },
    });

    if (!item) {
        throw new HTTPException(404, { message: "Cart item not found" });
    }

    if (data.quantity !== undefined) {
        if (item.product.stock < data.quantity) {
            throw new HTTPException(400, {
                message: `Requested quantity (${data.quantity}) exceeds available stock (${item.product.stock})`,
            });
        }
    }

    return await prisma.cart.update({
        where: { id },
        data,
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    discountPrice: true,
                    thumbnail: true,
                    stock: true,
                },
            },
        },
    });
};


export const removeCartItem = async (id: number, prisma: PrismaClient) => {
    try {
        return await prisma.cart.delete({
            where: { id },
        });
    } catch (err) {
        if (err instanceof Error && "code" in err && err.code === "P2025") {
            throw new HTTPException(404, { message: "Cart item not found" });
        }
        throw err;
    }
};


export const clearCart = async (userId: string, prisma: PrismaClient) => {
    const user = await prisma.users.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new HTTPException(404, { message: `User with ID '${userId}' not found` });
    }

    const result = await prisma.cart.deleteMany({
        where: { userId },
    });

    return {
        clearedCount: result.count,
    };
};

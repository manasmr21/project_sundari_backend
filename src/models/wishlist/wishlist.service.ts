import { HTTPException } from "hono/http-exception";
import { PrismaClient } from "../../generated/prisma/client";
import {
    ToggleWishlistType,
    WishlistQueryType,
} from "./wishlist.validator";

// Toggle product in wishlist (adds if absent, removes if present)
export const toggleWishlist = async (data: ToggleWishlistType, prisma: PrismaClient) => {
    const [user, product] = await Promise.all([
        prisma.users.findUnique({ where: { id: data.userId } }),
        prisma.products.findUnique({ where: { id: data.productId } }),
    ]);

    if (!user) {
        throw new HTTPException(404, { message: "User not found" });
    }

    if (!product) {
        throw new HTTPException(404, { message: "Product not found" });
    }

    const existing = await prisma.wishlist.findUnique({
        where: {
            userId_productId: {
                userId: data.userId,
                productId: data.productId,
            },
        },
    });

    if (existing) {
        await prisma.wishlist.delete({
            where: { id: existing.id },
        });
        return {
            inWishlist: false,
            message: "Product removed from wishlist",
            productId: data.productId,
        };
    }

    const created = await prisma.wishlist.create({
        data: {
            userId: data.userId,
            productId: data.productId,
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

    return {
        inWishlist: true,
        message: "Product added to wishlist",
        item: created,
    };
};


export const getWishlist = async (query: WishlistQueryType, prisma: PrismaClient) => {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.userId) {
        where.userId = query.userId;
    }

    const [total, items] = await Promise.all([
        prisma.wishlist.count({ where }),
        prisma.wishlist.findMany({
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


export const getWishlistByUserId = async (userId: string, prisma: PrismaClient) => {
    const user = await prisma.users.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new HTTPException(404, { message: `User with ID '${userId}' not found` });
    }

    const items = await prisma.wishlist.findMany({
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

    return {
        items,
        total: items.length,
        productIds: items.map((i) => i.productId),
    };
};


// export const getWishlistItemById = async (id: number, prisma: PrismaClient) => {
//     const item = await prisma.wishlist.findUnique({
//         where: { id },
//         include: {
//             product: true,
//         },
//     });

//     if (!item) {
//         throw new HTTPException(404, { message: "Wishlist item not found" });
//     }

//     return item;
// };


// export const removeWishlistItem = async (id: number, prisma: PrismaClient) => {
//     const item = await prisma.wishlist.findUnique({
//         where: { id },
//     });

//     if (!item) {
//         throw new HTTPException(404, { message: "Wishlist item not found" });
//     }

//     return await prisma.wishlist.delete({
//         where: { id },
//     });
// };


export const removeWishlistByUserAndProduct = async (
    userId: string,
    productId: string,
    prisma: PrismaClient
) => {
    try {
        return await prisma.wishlist.delete({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });
    } catch (err) {
        if (err instanceof Error && "code" in err && err.code === "P2025") {
            throw new HTTPException(404, { message: "Product is not in the user's wishlist" });
        }
        throw err;
    }
};


export const clearWishlist = async (userId: string, prisma: PrismaClient) => {
    const user = await prisma.users.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new HTTPException(404, { message: `User with ID '${userId}' not found` });
    }

    const result = await prisma.wishlist.deleteMany({
        where: { userId },
    });

    return {
        clearedCount: result.count,
    };
};

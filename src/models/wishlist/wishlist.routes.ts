import { Hono } from "hono";
import { Bindings } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { handleValidationError } from "../../utils/helpers/zod.helper";
import { createPrisma } from "../../lib/prisma";
import {
    validateToggleWishlist,
    validateWishlistUserIdParam,
    validateWishlistUserProductParam,
    validateWishlistQuery,
} from "./wishlist.validator";
import {
    toggleWishlist,
    getWishlist,
    getWishlistByUserId,
    // getWishlistItemById,
    // removeWishlistItem,
    removeWishlistByUserAndProduct,
    clearWishlist,
} from "./wishlist.service";

const wishlistRoutes = new Hono<{ Bindings: Bindings }>();

// 1. Toggle item in wishlist (add if absent, remove if present)
wishlistRoutes.post(
    "/",
    zValidator("json", validateToggleWishlist, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const data = c.req.valid("json");
        const result = await toggleWishlist(data, prisma);

        return c.json({
            success: true,
            message: result.message,
            inWishlist: result.inWishlist,
            data: result.item ?? null,
        }, result.inWishlist ? 201 : 200);
    }
);

wishlistRoutes.post(
    "/toggle",
    zValidator("json", validateToggleWishlist, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const data = c.req.valid("json");
        const result = await toggleWishlist(data, prisma);

        return c.json({
            success: true,
            message: result.message,
            inWishlist: result.inWishlist,
            data: result.item ?? null,
        }, result.inWishlist ? 201 : 200);
    }
);

// 3. Get all wishlist items (with optional query filter and pagination)
wishlistRoutes.get(
    "/",
    zValidator("query", validateWishlistQuery, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const query = c.req.valid("query");
        const result = await getWishlist(query, prisma);

        return c.json({
            success: true,
            message: "Wishlist items retrieved successfully",
            data: result.items,
            pagination: result.pagination,
        }, 200);
    }
);

// 4. Get all wishlist items for a specific user ID
wishlistRoutes.get(
    "/user/:userId",
    zValidator("param", validateWishlistUserIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { userId } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const wishlistData = await getWishlistByUserId(userId, prisma);

        return c.json({
            success: true,
            message: "User wishlist retrieved successfully",
            data: wishlistData.items,
            total: wishlistData.total,
            productIds: wishlistData.productIds,
        }, 200);
    }
);

// 5. Get single wishlist item by ID
// wishlistRoutes.get(
//     "/:id",
//     zValidator("param", validateWishlistIdParam, (result) => handleValidationError(result as any)),
//     async (c) => {
//         const { id } = c.req.valid("param");
//         const prisma = await createPrisma(c.env.DB);
//         const item = await getWishlistItemById(id, prisma);

//         return c.json({
//             success: true,
//             message: "Wishlist item retrieved successfully",
//             data: item,
//         }, 200);
//     }
// );

// 6. Delete a wishlist item by ID
// wishlistRoutes.delete(
//     "/:id",
//     zValidator("param", validateWishlistIdParam, (result) => handleValidationError(result as any)),
//     async (c) => {
//         const { id } = c.req.valid("param");
//         const prisma = await createPrisma(c.env.DB);
//         const item = await removeWishlistItem(id, prisma);

//         return c.json({
//             success: true,
//             message: "Item removed from wishlist successfully",
//             data: item,
//         }, 200);
//     }
// );

// 7. Delete a product from a user's wishlist by user ID and product ID
wishlistRoutes.delete(
    "/user/:userId/product/:productId",
    zValidator("param", validateWishlistUserProductParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { userId, productId } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const item = await removeWishlistByUserAndProduct(userId, productId, prisma);

        return c.json({
            success: true,
            message: "Product removed from wishlist successfully",
            data: item,
        }, 200);
    }
);

// 8. Clear all wishlist items for a user
wishlistRoutes.delete(
    "/user/:userId",
    zValidator("param", validateWishlistUserIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { userId } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const result = await clearWishlist(userId, prisma);

        return c.json({
            success: true,
            message: "User wishlist cleared successfully",
            data: result,
        }, 200);
    }
);

export default wishlistRoutes;

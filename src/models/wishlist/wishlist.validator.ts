import { z } from "zod";

export const validateToggleWishlist = z.object({
    userId: z.string().min(1, "User ID is required"),
    productId: z.string().min(1, "Product ID is required"),
});

export const validateAddToWishlist = validateToggleWishlist;

export const validateWishlistIdParam = z.object({
    id: z.coerce.number().int().positive("Invalid wishlist item ID"),
});

export const validateWishlistUserIdParam = z.object({
    userId: z.string().min(1, "User ID is required"),
});

export const validateWishlistUserProductParam = z.object({
    userId: z.string().min(1, "User ID is required"),
    productId: z.string().min(1, "Product ID is required"),
});

export const validateWishlistQuery = z.object({
    userId: z.string().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export type AddToWishlistType = z.infer<typeof validateAddToWishlist>;
export type ToggleWishlistType = z.infer<typeof validateToggleWishlist>;
export type WishlistIdParamType = z.infer<typeof validateWishlistIdParam>;
export type WishlistUserIdParamType = z.infer<typeof validateWishlistUserIdParam>;
export type WishlistUserProductParamType = z.infer<typeof validateWishlistUserProductParam>;
export type WishlistQueryType = z.infer<typeof validateWishlistQuery>;

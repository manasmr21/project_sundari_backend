import { z } from "zod";

export const validateAddToCart = z.object({
    userId: z.string().min(1, "User ID is required"),
    productId: z.string().min(1, "Product ID is required"),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").default(1),
    isGift: z.boolean().optional().default(false),
    giftMessage: z.string().max(500, "Gift message cannot exceed 500 characters").optional().nullable(),
});

export const validateUpdateCartItem = z.object({
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").optional(),
    isGift: z.boolean().optional(),
    giftMessage: z.string().max(500, "Gift message cannot exceed 500 characters").optional().nullable(),
});

export const validateCartIdParam = z.object({
    id: z.coerce.number().int().positive("Invalid cart item ID"),
});

export const validateCartUserIdParam = z.object({
    userId: z.string().min(1, "User ID is required"),
});

export const validateCartQuery = z.object({
    userId: z.string().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export type AddToCartType = z.infer<typeof validateAddToCart>;
export type UpdateCartItemType = z.infer<typeof validateUpdateCartItem>;
export type CartIdParamType = z.infer<typeof validateCartIdParam>;
export type CartUserIdParamType = z.infer<typeof validateCartUserIdParam>;
export type CartQueryType = z.infer<typeof validateCartQuery>;

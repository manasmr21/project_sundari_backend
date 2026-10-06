import { z } from "zod";

export const validateOrderItemInput = z.object({
    productId: z.string().min(1, "Product ID is required"),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
    price: z.coerce.number().min(0, "Price must be non-negative"),
    discount: z.coerce.number().min(0, "Discount must be non-negative").optional().default(0),
});

export const validateCreateOrder = z.object({
    orderId: z.string().optional(),
    userId: z.string().min(1, "User ID is required"),
    addressId: z.coerce.number().int().positive("Address ID is required"),
    products: z.array(validateOrderItemInput).min(1, "At least one product item is required"),
    discount: z.coerce.number().min(0, "Discount must be non-negative").optional().default(0),
    clearCart: z.boolean().optional().default(false),
    status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]).optional().default("pending"),
    paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional().default("pending"),
});

export const validateUpdateOrder = z.object({
    status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]).optional(),
    paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
    addressId: z.coerce.number().int().positive().optional(),
});

export const validateOrderIdParam = z.object({
    id: z.coerce.number().int().positive("Invalid order ID"),
});

export const validateOrderCodeParam = z.object({
    orderId: z.string().min(1, "Order code is required"),
});

export const validateOrderUserIdParam = z.object({
    userId: z.string().min(1, "User ID is required"),
});

export const validateOrderQuery = z.object({
    userId: z.string().optional(),
    status: z.string().optional(),
    paymentStatus: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type OrderItemInputType = z.infer<typeof validateOrderItemInput>;
export type CreateOrderType = z.infer<typeof validateCreateOrder>;
export type UpdateOrderType = z.infer<typeof validateUpdateOrder>;
export type OrderIdParamType = z.infer<typeof validateOrderIdParam>;
export type OrderCodeParamType = z.infer<typeof validateOrderCodeParam>;
export type OrderUserIdParamType = z.infer<typeof validateOrderUserIdParam>;
export type OrderQueryType = z.infer<typeof validateOrderQuery>;

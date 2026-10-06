import { z } from "zod";

export const validateDiscount = z.object({
    name: z.string().min(2, "Discount name must be at least 2 characters").max(100, "Discount name cannot exceed 100 characters"),
    slug: z
        .string()
        .min(2, "Slug must be at least 2 characters")
        .max(100, "Slug cannot exceed 100 characters")
        .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens")
        .optional(),
    description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
    type: z.enum(["percentage", "fixed"], {
        message: "Discount type must be either 'percentage' or 'fixed'",
    }),
    discount: z.coerce.number().positive("Discount value must be a positive number"),
    startDate: z.coerce.date({ message: "Start date is required" }),
    endDate: z.coerce.date({ message: "End date is required" }),
}).refine(
    (data) => (data.type === "percentage" ? data.discount <= 100 : true),
    {
        message: "Percentage discount cannot exceed 100%",
        path: ["discount"],
    }
).refine(
    (data) => data.endDate > data.startDate,
    {
        message: "End date must be after start date",
        path: ["endDate"],
    }
);

export const validateUpdateDiscount = z.object({
    name: z.string().min(2).max(100).optional(),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().max(500).optional(),
    type: z.enum(["percentage", "fixed"]).optional(),
    discount: z.coerce.number().positive().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
}).refine(
    (data) => (data.type === "percentage" && data.discount !== undefined ? data.discount <= 100 : true),
    {
        message: "Percentage discount cannot exceed 100%",
        path: ["discount"],
    }
).refine(
    (data) => {
        if (data.startDate && data.endDate) {
            return data.endDate > data.startDate;
        }
        return true;
    },
    {
        message: "End date must be after start date",
        path: ["endDate"],
    }
);

export const validateDiscountIdParam = z.object({
    id: z.coerce.number().int().positive("Invalid discount ID"),
});

export const validateDiscountSlugParam = z.object({
    slug: z.string().min(1, "Slug is required"),
});

export const validateDiscountQuery = z.object({
    search: z.string().optional(),
    type: z.enum(["percentage", "fixed"]).optional(),
    activeOnly: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateDiscountType = z.infer<typeof validateDiscount>;
export type UpdateDiscountType = z.infer<typeof validateUpdateDiscount>;
export type DiscountIdParamType = z.infer<typeof validateDiscountIdParam>;
export type DiscountSlugParamType = z.infer<typeof validateDiscountSlugParam>;
export type DiscountQueryType = z.infer<typeof validateDiscountQuery>;

import { z } from "zod";

export const validateCategory = z.object({
    name: z.string().min(2, "Category name must be at least 2 characters").max(100, "Category name cannot exceed 100 characters"),
    slug: z
        .string()
        .min(2, "Slug must be at least 2 characters")
        .max(100, "Slug cannot exceed 100 characters")
        .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens")
        .optional(),
    description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
    image: z.string().url("Invalid image URL").or(z.string().min(1, "Category image is required")),
});

export const validateUpdateCategory = validateCategory.partial();

export const validateCategoryIdParam = z.object({
    id: z.coerce.number().int().positive("Invalid category ID"),
});

export const validateCategorySlugParam = z.object({
    slug: z.string().min(1, "Slug is required"),
});

export const validateCategoryQuery = z.object({
    search: z.string().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateCategoryType = z.infer<typeof validateCategory>;
export type UpdateCategoryType = z.infer<typeof validateUpdateCategory>;
export type CategoryIdParamType = z.infer<typeof validateCategoryIdParam>;
export type CategorySlugParamType = z.infer<typeof validateCategorySlugParam>;
export type CategoryQueryType = z.infer<typeof validateCategoryQuery>;

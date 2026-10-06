import { z } from "zod";

export const validateSubCategory = z.object({
    name: z.string().min(2, "Sub-category name must be at least 2 characters").max(100, "Sub-category name cannot exceed 100 characters"),
    slug: z
        .string()
        .min(2, "Slug must be at least 2 characters")
        .max(100, "Slug cannot exceed 100 characters")
        .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens")
        .optional(),
    categoryId: z.coerce.number().int().positive("Invalid category ID"),
    description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
    image: z.string().url("Invalid image URL").or(z.string().optional())
});

export const validateUpdateSubCategory = validateSubCategory.partial();

export const validateSubCategoryIdParam = z.object({
    id: z.coerce.number().int().positive("Invalid sub-category ID"),
});

export const validateSubCategorySlugParam = z.object({
    slug: z.string().min(1, "Slug is required"),
});

export const validateSubCategoryQuery = z.object({
    categoryId: z.coerce.number().int().positive().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateSubCategoryType = z.infer<typeof validateSubCategory>;
export type UpdateSubCategoryType = z.infer<typeof validateUpdateSubCategory>;
export type SubCategoryIdParamType = z.infer<typeof validateSubCategoryIdParam>;
export type SubCategorySlugParamType = z.infer<typeof validateSubCategorySlugParam>;
export type SubCategoryQueryType = z.infer<typeof validateSubCategoryQuery>;

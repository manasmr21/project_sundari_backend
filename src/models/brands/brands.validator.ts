import { z } from "zod";

export const validateBrand = z.object({
    name: z.string().min(2, "Brand name must be at least 2 characters").max(100, "Brand name cannot exceed 100 characters"),
    slug: z
        .string()
        .min(2, "Slug must be at least 2 characters")
        .max(100, "Slug cannot exceed 100 characters")
        .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens")
        .optional(),
    description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
    logo: z.string().url("Invalid logo URL").or(z.string().min(1, "Brand logo is required")),
});

export const validateUpdateBrand = validateBrand.partial();

export const validateBrandIdParam = z.object({
    id: z.coerce.number().int().positive("Invalid brand ID"),
});

export const validateBrandSlugParam = z.object({
    slug: z.string().min(1, "Slug is required"),
});

export const validateBrandQuery = z.object({
    search: z.string().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateBrandType = z.infer<typeof validateBrand>;
export type UpdateBrandType = z.infer<typeof validateUpdateBrand>;
export type BrandIdParamType = z.infer<typeof validateBrandIdParam>;
export type BrandSlugParamType = z.infer<typeof validateBrandSlugParam>;
export type BrandQueryType = z.infer<typeof validateBrandQuery>;

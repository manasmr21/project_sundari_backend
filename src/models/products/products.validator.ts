import { z } from "zod";

export const validateProduct = z.object({
    name: z.string().min(2, "Product name must be at least 2 characters").max(200, "Product name cannot exceed 200 characters"),
    slug: z
        .string()
        .min(2, "Slug must be at least 2 characters")
        .max(200, "Slug cannot exceed 200 characters")
        .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens")
        .optional(),
    description: z.string().min(10, "Description must be at least 10 characters").max(5000, "Description cannot exceed 5000 characters"),
    price: z.coerce.number().positive("Price must be a positive number"),
    discountPrice: z.coerce.number().positive("Discount price must be a positive number").optional(),
    discount_price: z.coerce.number().positive("Discount price must be a positive number").optional(),
    categoryId: z.coerce.number().int().positive("Category ID is required"),
    subCategoryId: z.coerce.number().int().positive("Invalid sub-category ID").optional().nullable(),
    brandId: z.coerce.number().int().positive("Brand ID is required"),
    images: z.union([
        z.string().min(1, "Image URL is required"),
        z.array(z.string().min(1, "Image URL is required")).min(1, "At least one image is required")
    ], {
        message: "Product image(s) is required",
    }),
    thumbnail: z.string().min(1, "Thumbnail is required"),
    stock: z.coerce.number().int().nonnegative("Stock cannot be negative").default(0),
});

export const validateUpdateProduct = validateProduct.partial();

export const validateProductIdParam = z.object({
    id: z.string().uuid("Invalid product ID (must be a valid UUID)"),
});

export const validateProductSlugParam = z.object({
    slug: z.string().min(1, "Slug is required"),
});

export const validateProductQuery = z.object({
    search: z.string().optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    subCategoryId: z.coerce.number().int().positive().optional(),
    brandId: z.coerce.number().int().positive().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    inStock: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateProductType = z.infer<typeof validateProduct>;
export type UpdateProductType = z.infer<typeof validateUpdateProduct>;
export type ProductIdParamType = z.infer<typeof validateProductIdParam>;
export type ProductSlugParamType = z.infer<typeof validateProductSlugParam>;
export type ProductQueryType = z.infer<typeof validateProductQuery>;

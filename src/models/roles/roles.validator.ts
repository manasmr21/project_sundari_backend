import { z } from "zod";

export const validateRole = z.object({
    name: z.string().min(2, "Role name must be at least 2 characters").max(50, "Role name cannot exceed 50 characters"),
    slug: z
        .string()
        .min(2, "Slug must be at least 2 characters")
        .max(50, "Slug cannot exceed 50 characters")
        .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens")
        .optional(),
    description: z.string().max(255, "Description cannot exceed 255 characters").optional(),
});

export const validateUpdateRole = validateRole.partial();

export const validateRoleIdParam = z.object({
    id: z.coerce.number().int().positive("Invalid role ID"),
});

export const validateRoleSlugParam = z.object({
    slug: z.string().min(1, "Slug is required"),
});

export const validateRoleQuery = z.object({
    search: z.string().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateRoleType = z.infer<typeof validateRole>;
export type UpdateRoleType = z.infer<typeof validateUpdateRole>;
export type RoleIdParamType = z.infer<typeof validateRoleIdParam>;
export type RoleSlugParamType = z.infer<typeof validateRoleSlugParam>;
export type RoleQueryType = z.infer<typeof validateRoleQuery>;

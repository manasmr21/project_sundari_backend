import { z } from "zod";

export const validateMenus = z.object({
    name: z.string().min(1, "Name is required"),
    url: z.string().min(1, "URL is required"),
    type: z.string().min(1, "Type is required"),
    parentId: z.number().int().positive().nullable().optional(),
    position: z.string().min(1, "Position is required"),
});

export const validateUpdateMenus = validateMenus.partial();

export const validateMenuIdParam = z.object({
    id: z.coerce.number().int().positive(),
});

export type CreateMenuTypes = z.infer<typeof validateMenus>;
export type UpdateMenuTypes = z.infer<typeof validateUpdateMenus>;
export type MenuIdParamType = z.infer<typeof validateMenuIdParam>;
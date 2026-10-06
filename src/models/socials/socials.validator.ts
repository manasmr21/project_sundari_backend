import { z } from "zod";

export const validateSocials = z.object({
    platform: z.string().min(2, "Platform name must be at least 2 characters").max(50),
    url: z.string().url("Must be a valid URL"),
    icon: z.string().min(1, "Icon identifier is required").max(100),
});

export const validateUpdateSocials = validateSocials.partial();

export const validateSocialsIdParam = z.object({
    id: z.coerce.number().int().positive(),
});

export type SocialsType = z.infer<typeof validateSocials>;
export type UpdateSocialsType = z.infer<typeof validateUpdateSocials>;
export type SocialsIdParamType = z.infer<typeof validateSocialsIdParam>;
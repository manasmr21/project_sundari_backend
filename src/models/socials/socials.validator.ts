import { z } from "zod";

export const validateSocials = z.object({
    platform: z.string(),
    url: z.string(),
    icon: z.string()
});

export const validateUpdateSocials = validateSocials.partial();

export const validateSocialsIdParam = z.object({
    id: z.coerce.number().int().positive(),
});

export type SocialsType = z.infer<typeof validateSocials>;
export type UpdateSocialsType = z.infer<typeof validateUpdateSocials>;
export type SocialsIdParamType = z.infer<typeof validateSocialsIdParam>;
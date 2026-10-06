import { z } from "zod";

export const validateSiteData = z.object({
    siteName: z.string().min(1, "Site name is required"),
    logo: z.string().url("Invalid logo URL").or(z.string().min(1, "Logo is required")),
    ribbonText: z.string().min(1, "Ribbon text is required"),
    footerText: z.string().min(1, "Footer text is required"),
});

export const validateUpdateSiteData = validateSiteData.partial();

export const validateSiteDataIdParam = z.object({
    id: z.coerce.number().int().positive(),
});

export type SiteDataType = z.infer<typeof validateSiteData>;
export type UpdateSiteDataType = z.infer<typeof validateUpdateSiteData>;
export type SiteDataIdParamType = z.infer<typeof validateSiteDataIdParam>;
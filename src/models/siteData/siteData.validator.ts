import { z } from "zod";

export const validateSiteData = z.object({
    siteName: z.string().min(1, "Site name is required"),
    logo: z.string().min(1, "Logo is required"),
    ribbonText: z.string(),
    footerText: z.string(),
});

export const validateUpdateSiteData = validateSiteData.partial();

export const validateSiteDataIdParam = z.object({
    id: z.coerce.number().int().positive(),
});

export type SiteDataType = z.infer<typeof validateSiteData>;
export type UpdateSiteDataType = z.infer<typeof validateUpdateSiteData>;
export type SiteDataIdParamType = z.infer<typeof validateSiteDataIdParam>;
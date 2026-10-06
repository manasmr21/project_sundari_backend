import { Hono } from "hono";
import { Bindings } from "../../index";
import { zValidator } from "@hono/zod-validator";
import {
    validateSiteData,
    validateUpdateSiteData,
    validateSiteDataIdParam,
} from "./siteData.validator";
import { createPrisma } from "../../lib/prisma";
import {
    createSiteData,
    getSiteData,
    getSiteDataById,
    updateSiteData,
    deleteSiteData,
} from "./siteData.service";
import { handleValidationError } from "../../utils/helpers/zod.helper";
import { HTTPException } from "hono/http-exception";

const siteDataRoutes = new Hono<{ Bindings: Bindings }>();

// 1. Create site data
siteDataRoutes.post(
    "/",
    zValidator("json", validateSiteData, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const data = c.req.valid("json");

        const siteData = await createSiteData(data, prisma);

        return c.json({ success: true, message: "Site data created successfully", data: siteData }, 201);
    }
);

// 2. Get all site data
siteDataRoutes.get("/", async (c) => {
    const prisma = await createPrisma(c.env.DB);
    const siteData = await getSiteData(prisma);

    return c.json({ success: true, message: "Site data retrieved successfully", data: siteData }, 200);
});

// 3. Get single site data by ID
siteDataRoutes.get(
    "/:id",
    zValidator("param", validateSiteDataIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const siteData = await getSiteDataById(id, prisma);

        if (!siteData) {
            throw new HTTPException(404, { message: "Site data not found" });
        }

        return c.json({ success: true, message: "Site data retrieved successfully", data: siteData }, 200);
    }
);

// 4. Update site data by ID (supports PUT and PATCH)
siteDataRoutes.patch(
    "/:id",
    zValidator("param", validateSiteDataIdParam, (result) => handleValidationError(result as any)),
    zValidator("json", validateUpdateSiteData, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const data = c.req.valid("json");
        const prisma = await createPrisma(c.env.DB);

        try {
            const siteData = await updateSiteData({ id, ...data }, prisma);
            return c.json({ success: true, message: "Site data updated successfully", data: siteData }, 200);
        } catch (error) {
            if (error instanceof Error && "code" in error && error.code === "P2025") {
                throw new HTTPException(404, { message: "Site data not found" });
            }
            throw error;
        }
    }
);

// 5. Delete site data by ID
siteDataRoutes.delete(
    "/:id",
    zValidator("param", validateSiteDataIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);

        try {
            const siteData = await deleteSiteData({ id }, prisma);
            return c.json({ success: true, message: "Site data deleted successfully", data: siteData }, 200);
        } catch (error) {
            if (error instanceof Error && "code" in error && error.code === "P2025") {
                throw new HTTPException(404, { message: "Site data not found" });
            }
            throw error;
        }
    }
);

export default siteDataRoutes;
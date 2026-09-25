import { Hono } from "hono";
import { Bindings } from "../../index";
import { zValidator } from "@hono/zod-validator";
import {
    validateSocials,
    validateUpdateSocials,
    validateSocialsIdParam,
} from "./socials.validator";
import { createPrisma } from "../../lib/prisma";
import {
    createSocials,
    getSocials,
    getSocialsById,
    updateSocials,
    deleteSocials,
} from "./socials.service";
import { handleValidationError } from "../../utils/helpers/zod.helper";
import { HTTPException } from "hono/http-exception";

const socialsRoutes = new Hono<{ Bindings: Bindings }>();

// 1. Create social link
socialsRoutes.post(
    "/",
    zValidator("json", validateSocials, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const data = c.req.valid("json");

        const social = await createSocials(data, prisma);

        return c.json({ success: true, message: "Social created successfully", data: social }, 201);
    }
);

// 2. Get all socials
socialsRoutes.get("/", async (c) => {
    const prisma = await createPrisma(c.env.DB);
    const socials = await getSocials(prisma);

    return c.json({ success: true, message: "Socials retrieved successfully", data: socials }, 200);
});

// 3. Get single social by ID
socialsRoutes.get(
    "/:id",
    zValidator("param", validateSocialsIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const social = await getSocialsById(id, prisma);

        if (!social) {
            throw new HTTPException(404, { message: "Social not found" });
        }

        return c.json({ success: true, message: "Social retrieved successfully", data: social }, 200);
    }
);

// 4. Update social by ID
socialsRoutes.patch(
    "/:id",
    zValidator("param", validateSocialsIdParam, (result) => handleValidationError(result as any)),
    zValidator("json", validateUpdateSocials, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const data = c.req.valid("json");
        const prisma = await createPrisma(c.env.DB);

        try {
            const social = await updateSocials({ id, ...data }, prisma);
            return c.json({ success: true, message: "Social updated successfully", data: social }, 200);
        } catch (error: any) {
            if (error?.code === "P2025") {
                throw new HTTPException(404, { message: "Social not found" });
            }
            throw error;
        }
    }
);

// 5. Delete social by ID
socialsRoutes.delete(
    "/:id",
    zValidator("param", validateSocialsIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);

        try {
            const social = await deleteSocials({ id }, prisma);
            return c.json({ success: true, message: "Social deleted successfully", data: social }, 200);
        } catch (error: any) {
            if (error?.code === "P2025") {
                throw new HTTPException(404, { message: "Social not found" });
            }
            throw error;
        }
    }
);

export default socialsRoutes;

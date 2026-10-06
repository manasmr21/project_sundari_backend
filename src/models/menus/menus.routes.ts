import { Hono } from "hono";
import { Bindings } from "../../index";
import { zValidator } from "@hono/zod-validator";
import {
    validateMenus,
    validateUpdateMenus,
    validateMenuIdParam,
} from "./menu.validator";
import { createPrisma } from "../../lib/prisma";
import {
    createMenu,
    getMenus,
    getMenuById,
    updateMenu,
    deleteMenu,
} from "./menu.service";
import { handleValidationError } from "../../utils/helpers/zod.helper";
import { HTTPException } from "hono/http-exception";

const menusRoutes = new Hono<{ Bindings: Bindings }>();

// 1. Create menu item
menusRoutes.post(
    "/",
    zValidator("json", validateMenus, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const data = c.req.valid("json");

        const menu = await createMenu(data, prisma);

        return c.json({ success: true, message: "Menu created successfully", data: menu }, 201);
    }
);

// 2. Get all menu items
menusRoutes.get("/", async (c) => {
    const prisma = await createPrisma(c.env.DB);
    const menus = await getMenus(prisma);

    if (!menus) {
        throw new HTTPException(404, { message: "Menus not found" });
    }

    return c.json({ success: true, message: "Menus retrieved successfully", data: menus }, 200);
});

// 3. Get single menu item by ID 
menusRoutes.get(
    "/:id",
    zValidator("param", validateMenuIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const menu = await getMenuById(id, prisma);

        if (!menu) {
            throw new HTTPException(404, { message: "Menu not found" });
        }

        return c.json({ success: true, message: "Menu retrieved successfully", data: menu }, 200);
    }
);

// 4. Update menu item by ID
menusRoutes.patch(
    "/:id",
    zValidator("param", validateMenuIdParam, (result) => handleValidationError(result as any)),
    zValidator("json", validateUpdateMenus, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const data = c.req.valid("json");
        const prisma = await createPrisma(c.env.DB);

        try {
            const menu = await updateMenu({ id, ...data }, prisma);
            return c.json({ success: true, message: "Menu updated successfully", data: menu }, 200);
        } catch (error) {
            if (error instanceof Error && "code" in error && error.code === "P2025") {
                throw new HTTPException(404, { message: "Menu not found" });
            }
            throw error;
        }
    }
);

// 5. Delete menu item by ID
menusRoutes.delete(
    "/:id",
    zValidator("param", validateMenuIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);

        try {
            const menu = await deleteMenu({ id }, prisma);
            return c.json({ success: true, message: "Menu deleted successfully", data: menu }, 200);
        } catch (error) {
            if (error instanceof Error && "code" in error && error.code === "P2025") {
                throw new HTTPException(404, { message: "Menu not found" });
            }
            throw error;
        }
    }
);

export default menusRoutes;

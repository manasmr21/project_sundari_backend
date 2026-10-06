import { Hono } from "hono";
import { Bindings } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { handleValidationError } from "../../utils/helpers/zod.helper";
import { createPrisma } from "../../lib/prisma";
import {
    validateDiscount,
    validateUpdateDiscount,
    validateDiscountIdParam,
    validateDiscountSlugParam,
    validateDiscountQuery,
} from "./discounts.validator";
import {
    createDiscount,
    getDiscounts,
    getDiscountById,
    getDiscountBySlug,
    updateDiscount,
    deleteDiscount,
} from "./discounts.service";

const discountsRoutes = new Hono<{ Bindings: Bindings }>();

// 1. Create a new discount
discountsRoutes.post(
    "/",
    zValidator("json", validateDiscount, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const data = c.req.valid("json");
        const discount = await createDiscount(data, prisma);

        return c.json({ success: true, message: "Discount created successfully", data: discount }, 201);
    }
);

// 2. Get all discounts (with filters, search, and pagination)
discountsRoutes.get(
    "/",
    zValidator("query", validateDiscountQuery, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const query = c.req.valid("query");
        const result = await getDiscounts(query, prisma);

        return c.json({
            success: true,
            message: "Discounts retrieved successfully",
            data: result.discounts,
            pagination: result.pagination,
        }, 200);
    }
);

// 3. Get discount by slug
discountsRoutes.get(
    "/slug/:slug",
    zValidator("param", validateDiscountSlugParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { slug } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const discount = await getDiscountBySlug(slug, prisma);

        return c.json({
            success: true,
            message: "Discount retrieved successfully",
            data: discount,
        }, 200);
    }
);

// 4. Get single discount by ID
discountsRoutes.get(
    "/:id",
    zValidator("param", validateDiscountIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const discount = await getDiscountById(id, prisma);

        return c.json({
            success: true,
            message: "Discount retrieved successfully",
            data: discount,
        }, 200);
    }
);

// 5. Update discount by ID
discountsRoutes.patch(
    "/:id",
    zValidator("param", validateDiscountIdParam, (result) => handleValidationError(result as any)),
    zValidator("json", validateUpdateDiscount, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const data = c.req.valid("json");
        const prisma = await createPrisma(c.env.DB);
        const discount = await updateDiscount({ id, ...data }, prisma);

        return c.json({
            success: true,
            message: "Discount updated successfully",
            data: discount,
        }, 200);
    }
);

// 6. Delete discount by ID
discountsRoutes.delete(
    "/:id",
    zValidator("param", validateDiscountIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const discount = await deleteDiscount(id, prisma);

        return c.json({
            success: true,
            message: "Discount deleted successfully",
            data: discount,
        }, 200);
    }
);

export default discountsRoutes;

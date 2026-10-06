import { Hono } from "hono";
import { Bindings } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { handleValidationError } from "../../utils/helpers/zod.helper";
import { createPrisma } from "../../lib/prisma";
import {
    validateBrand,
    validateUpdateBrand,
    validateBrandIdParam,
    validateBrandSlugParam,
    validateBrandQuery,
} from "./brands.validator";
import {
    createBrand,
    getBrands,
    getBrandById,
    getBrandBySlug,
    updateBrand,
    deleteBrand,
} from "./brands.service";

const brandsRoutes = new Hono<{ Bindings: Bindings }>();

// 1. Create a new brand
brandsRoutes.post(
    "/",
    zValidator("json", validateBrand, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const data = c.req.valid("json");
        const brand = await createBrand(data, prisma);

        return c.json({ success: true, message: "Brand created successfully", data: brand }, 201);
    }
);

// 2. Get all brands (with optional search and pagination)
brandsRoutes.get(
    "/",
    zValidator("query", validateBrandQuery, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const query = c.req.valid("query");
        const result = await getBrands(query, prisma);

        return c.json({
            success: true,
            message: "Brands retrieved successfully",
            data: result.brands,
            pagination: result.pagination,
        }, 200);
    }
);

// 3. Get brand by slug
brandsRoutes.get(
    "/slug/:slug",
    zValidator("param", validateBrandSlugParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { slug } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const brand = await getBrandBySlug(slug, prisma);

        return c.json({
            success: true,
            message: "Brand retrieved successfully",
            data: brand,
        }, 200);
    }
);

// 4. Get single brand by ID
brandsRoutes.get(
    "/:id",
    zValidator("param", validateBrandIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const brand = await getBrandById(id, prisma);

        return c.json({
            success: true,
            message: "Brand retrieved successfully",
            data: brand,
        }, 200);
    }
);

// 5. Update brand by ID
brandsRoutes.patch(
    "/:id",
    zValidator("param", validateBrandIdParam, (result) => handleValidationError(result as any)),
    zValidator("json", validateUpdateBrand, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const data = c.req.valid("json");
        const prisma = await createPrisma(c.env.DB);
        const brand = await updateBrand({ id, ...data }, prisma);

        return c.json({
            success: true,
            message: "Brand updated successfully",
            data: brand,
        }, 200);
    }
);

// 6. Delete brand by ID
brandsRoutes.delete(
    "/:id",
    zValidator("param", validateBrandIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const brand = await deleteBrand(id, prisma);

        return c.json({
            success: true,
            message: "Brand deleted successfully",
            data: brand,
        }, 200);
    }
);

export default brandsRoutes;

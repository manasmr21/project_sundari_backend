import { Hono } from "hono";
import { Bindings } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { handleValidationError } from "../../utils/helpers/zod.helper";
import { createPrisma } from "../../lib/prisma";
import {
    validateSubCategory,
    validateUpdateSubCategory,
    validateSubCategoryIdParam,
    validateSubCategorySlugParam,
    validateSubCategoryQuery,
} from "./subCategories.validator";
import {
    createSubCategory,
    getSubCategories,
    getSubCategoryById,
    getSubCategoryBySlug,
    updateSubCategory,
    deleteSubCategory,
} from "./subCategories.service";

const subCategoriesRoutes = new Hono<{ Bindings: Bindings }>();

// 1. Create a new sub-category
subCategoriesRoutes.post(
    "/",
    zValidator("json", validateSubCategory, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const data = c.req.valid("json");
        const subCategory = await createSubCategory(data, prisma);

        return c.json({ success: true, message: "Sub-category created successfully", data: subCategory }, 201);
    }
);

// 2. Get all sub-categories (with optional category filter, search, and pagination)
subCategoriesRoutes.get(
    "/",
    zValidator("query", validateSubCategoryQuery, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const query = c.req.valid("query");
        const result = await getSubCategories(query, prisma);

        return c.json({
            success: true,
            message: "Sub-categories retrieved successfully",
            data: result.subCategories,
            pagination: result.pagination,
        }, 200);
    }
);

// 3. Get sub-category by slug
subCategoriesRoutes.get(
    "/slug/:slug",
    zValidator("param", validateSubCategorySlugParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { slug } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const subCategory = await getSubCategoryBySlug(slug, prisma);

        return c.json({
            success: true,
            message: "Sub-category retrieved successfully",
            data: subCategory,
        }, 200);
    }
);

// 4. Get single sub-category by ID
subCategoriesRoutes.get(
    "/:id",
    zValidator("param", validateSubCategoryIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const subCategory = await getSubCategoryById(id, prisma);

        return c.json({
            success: true,
            message: "Sub-category retrieved successfully",
            data: subCategory,
        }, 200);
    }
);

// 5. Update sub-category by ID
subCategoriesRoutes.patch(
    "/:id",
    zValidator("param", validateSubCategoryIdParam, (result) => handleValidationError(result as any)),
    zValidator("json", validateUpdateSubCategory, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const data = c.req.valid("json");
        const prisma = await createPrisma(c.env.DB);
        const subCategory = await updateSubCategory({ id, ...data }, prisma);

        return c.json({
            success: true,
            message: "Sub-category updated successfully",
            data: subCategory,
        }, 200);
    }
);

// 6. Delete sub-category by ID
subCategoriesRoutes.delete(
    "/:id",
    zValidator("param", validateSubCategoryIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const subCategory = await deleteSubCategory(id, prisma);

        return c.json({
            success: true,
            message: "Sub-category deleted successfully",
            data: subCategory,
        }, 200);
    }
);

export default subCategoriesRoutes;

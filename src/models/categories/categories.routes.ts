import { Hono } from "hono";
import { Bindings } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { handleValidationError } from "../../utils/helpers/zod.helper";
import { createPrisma } from "../../lib/prisma";
import {
    validateCategory,
    validateUpdateCategory,
    validateCategoryIdParam,
    validateCategorySlugParam,
    validateCategoryQuery,
} from "./categories.validator";
import {
    createCategory,
    getCategories,
    getCategoryById,
    getCategoryBySlug,
    updateCategory,
    deleteCategory,
} from "./categories.service";

const categoriesRoutes = new Hono<{ Bindings: Bindings }>();

// 1. Create a new category
categoriesRoutes.post(
    "/",
    zValidator("json", validateCategory, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const data = c.req.valid("json");
        const category = await createCategory(data, prisma);

        return c.json({ success: true, message: "Category created successfully", data: category }, 201);
    }
);

// 2. Get all categories (with optional search and pagination)
categoriesRoutes.get(
    "/",
    zValidator("query", validateCategoryQuery, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const query = c.req.valid("query");
        const result = await getCategories(query, prisma);

        return c.json({
            success: true,
            message: "Categories retrieved successfully",
            data: result.categories,
            pagination: result.pagination,
        }, 200);
    }
);

// 3. Get category by slug
categoriesRoutes.get(
    "/slug/:slug",
    zValidator("param", validateCategorySlugParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { slug } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const category = await getCategoryBySlug(slug, prisma);

        return c.json({
            success: true,
            message: "Category retrieved successfully",
            data: category,
        }, 200);
    }
);

// 4. Get single category by ID
categoriesRoutes.get(
    "/:id",
    zValidator("param", validateCategoryIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const category = await getCategoryById(id, prisma);

        return c.json({
            success: true,
            message: "Category retrieved successfully",
            data: category,
        }, 200);
    }
);

// 5. Update category by ID
categoriesRoutes.patch(
    "/:id",
    zValidator("param", validateCategoryIdParam, (result) => handleValidationError(result as any)),
    zValidator("json", validateUpdateCategory, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const data = c.req.valid("json");
        const prisma = await createPrisma(c.env.DB);
        const category = await updateCategory({ id, ...data }, prisma);

        return c.json({
            success: true,
            message: "Category updated successfully",
            data: category,
        }, 200);
    }
);

// 6. Delete category by ID
categoriesRoutes.delete(
    "/:id",
    zValidator("param", validateCategoryIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const category = await deleteCategory(id, prisma);

        return c.json({
            success: true,
            message: "Category deleted successfully",
            data: category,
        }, 200);
    }
);

export default categoriesRoutes;

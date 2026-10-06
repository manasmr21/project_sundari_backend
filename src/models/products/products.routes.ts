import { Hono } from "hono";
import { Bindings } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { handleValidationError } from "../../utils/helpers/zod.helper";
import { createPrisma } from "../../lib/prisma";
import {
    validateProduct,
    validateUpdateProduct,
    validateProductIdParam,
    validateProductSlugParam,
    validateProductQuery,
} from "./products.validator";
import {
    createProduct,
    getProducts,
    getProductById,
    getProductBySlug,
    updateProduct,
    deleteProduct,
} from "./products.service";

const productsRoutes = new Hono<{ Bindings: Bindings }>();

// 1. Create a new product
productsRoutes.post(
    "/",
    zValidator("json", validateProduct, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const data = c.req.valid("json");
        const product = await createProduct(data, prisma);

        return c.json({ success: true, message: "Product created successfully", data: product }, 201);
    }
);

// 2. Get all products (with faceted filters, search, and pagination)
productsRoutes.get(
    "/",
    zValidator("query", validateProductQuery, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const query = c.req.valid("query");
        const result = await getProducts(query, prisma);

        return c.json({
            success: true,
            message: "Products retrieved successfully",
            data: result.products,
            pagination: result.pagination,
        }, 200);
    }
);

// 3. Get product by slug
productsRoutes.get(
    "/slug/:slug",
    zValidator("param", validateProductSlugParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { slug } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const product = await getProductBySlug(slug, prisma);

        return c.json({
            success: true,
            message: "Product retrieved successfully",
            data: product,
        }, 200);
    }
);

// 4. Get single product by UUID
productsRoutes.get(
    "/:id",
    zValidator("param", validateProductIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const product = await getProductById(id, prisma);

        return c.json({
            success: true,
            message: "Product retrieved successfully",
            data: product,
        }, 200);
    }
);

// 5. Update product by UUID
productsRoutes.patch(
    "/:id",
    zValidator("param", validateProductIdParam, (result) => handleValidationError(result as any)),
    zValidator("json", validateUpdateProduct, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const data = c.req.valid("json");
        const prisma = await createPrisma(c.env.DB);
        const product = await updateProduct({ id, ...data }, prisma);

        return c.json({
            success: true,
            message: "Product updated successfully",
            data: product,
        }, 200);
    }
);

// 6. Delete product by UUID
productsRoutes.delete(
    "/:id",
    zValidator("param", validateProductIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const product = await deleteProduct(id, prisma);

        return c.json({
            success: true,
            message: "Product deleted successfully",
            data: product,
        }, 200);
    }
);

export default productsRoutes;

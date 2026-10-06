import { Hono } from "hono";
import { Bindings } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { handleValidationError } from "../../utils/helpers/zod.helper";
import { createPrisma } from "../../lib/prisma";
import {
    validateAddToCart,
    validateUpdateCartItem,
    validateCartIdParam,
    validateCartUserIdParam,
    validateCartQuery,
} from "./cart.validator";
import {
    addToCart,
    getCart,
    getCartByUserId,
    getCartItemById,
    updateCartItem,
    removeCartItem,
    clearCart,
} from "./cart.service";

const cartRoutes = new Hono<{ Bindings: Bindings }>();

// 1. Add item to cart
cartRoutes.post(
    "/",
    zValidator("json", validateAddToCart, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const data = c.req.valid("json");
        const item = await addToCart(data, prisma);

        return c.json({ success: true, message: "Item added to cart successfully", data: item }, 201);
    }
);

// 2. Get all cart items (with optional query filters and pagination)
cartRoutes.get(
    "/",
    zValidator("query", validateCartQuery, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const query = c.req.valid("query");
        const result = await getCart(query, prisma);

        return c.json({
            success: true,
            message: "Cart items retrieved successfully",
            data: result.items,
            pagination: result.pagination,
        }, 200);
    }
);

// 3. Get all cart items and summary for a specific user ID
cartRoutes.get(
    "/user/:userId",
    zValidator("param", validateCartUserIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { userId } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const cartData = await getCartByUserId(userId, prisma);

        return c.json({
            success: true,
            message: "User cart retrieved successfully",
            data: cartData.items,
            summary: cartData.summary,
        }, 200);
    }
);

// 4. Get a single cart item by ID
cartRoutes.get(
    "/:id",
    zValidator("param", validateCartIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const item = await getCartItemById(id, prisma);

        return c.json({
            success: true,
            message: "Cart item retrieved successfully",
            data: item,
        }, 200);
    }
);

// 5. Update a cart item (quantity, gift options)
cartRoutes.patch(
    "/:id",
    zValidator("param", validateCartIdParam, (result) => handleValidationError(result as any)),
    zValidator("json", validateUpdateCartItem, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const data = c.req.valid("json");
        const prisma = await createPrisma(c.env.DB);
        const item = await updateCartItem(id, data, prisma);

        return c.json({
            success: true,
            message: "Cart item updated successfully",
            data: item,
        }, 200);
    }
);

// 6. Delete a single item from the cart
cartRoutes.delete(
    "/:id",
    zValidator("param", validateCartIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const item = await removeCartItem(id, prisma);

        return c.json({
            success: true,
            message: "Item removed from cart successfully",
            data: item,
        }, 200);
    }
);

// 7. Clear all cart items for a user
cartRoutes.delete(
    "/user/:userId",
    zValidator("param", validateCartUserIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { userId } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const result = await clearCart(userId, prisma);

        return c.json({
            success: true,
            message: "User cart cleared successfully",
            data: result,
        }, 200);
    }
);

export default cartRoutes;

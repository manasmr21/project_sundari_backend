import { Hono } from "hono";
import { Bindings } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { handleValidationError } from "../../utils/helpers/zod.helper";
import { createPrisma } from "../../lib/prisma";
import {
    validateCreateOrder,
    validateUpdateOrder,
    validateOrderIdParam,
    validateOrderCodeParam,
    validateOrderUserIdParam,
    validateOrderQuery,
} from "./orders.validator";
import {
    createOrder,
    getOrders,
    getOrderByCode,
    getOrderById,
    getOrdersByUserId,
    updateOrder,
    deleteOrder,
} from "./orders.service";

const ordersRoutes = new Hono<{ Bindings: Bindings }>();

// 1. Create a new order
ordersRoutes.post(
    "/",
    zValidator("json", validateCreateOrder, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const data = c.req.valid("json");
        const order = await createOrder(data, prisma);

        return c.json({ success: true, message: "Order created successfully", data: order }, 201);
    }
);

// 2. Get all orders (with optional user, status, search, and pagination)
ordersRoutes.get(
    "/",
    zValidator("query", validateOrderQuery, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const query = c.req.valid("query");
        const result = await getOrders(query, prisma);

        return c.json({
            success: true,
            message: "Orders retrieved successfully",
            data: result.orders,
            pagination: result.pagination,
        }, 200);
    }
);

// 3. Get all orders for a specific user ID
ordersRoutes.get(
    "/user/:userId",
    zValidator("param", validateOrderUserIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { userId } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const orders = await getOrdersByUserId(userId, prisma);

        return c.json({
            success: true,
            message: "User orders retrieved successfully",
            data: orders,
        }, 200);
    }
);

// 4. Get order by public order code (e.g. /code/ORD-12345)
ordersRoutes.get(
    "/code/:orderId",
    zValidator("param", validateOrderCodeParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { orderId } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const order = await getOrderByCode(orderId, prisma);

        return c.json({
            success: true,
            message: "Order retrieved successfully",
            data: order,
        }, 200);
    }
);

// 5. Get order by internal numeric ID
ordersRoutes.get(
    "/:id",
    zValidator("param", validateOrderIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const order = await getOrderById(id, prisma);

        return c.json({
            success: true,
            message: "Order retrieved successfully",
            data: order,
        }, 200);
    }
);

// 6. Update order status or details by ID
ordersRoutes.patch(
    "/:id",
    zValidator("param", validateOrderIdParam, (result) => handleValidationError(result as any)),
    zValidator("json", validateUpdateOrder, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const data = c.req.valid("json");
        const prisma = await createPrisma(c.env.DB);
        const order = await updateOrder(id, data, prisma);

        return c.json({
            success: true,
            message: "Order updated successfully",
            data: order,
        }, 200);
    }
);

// 7. Delete order by ID
ordersRoutes.delete(
    "/:id",
    zValidator("param", validateOrderIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const order = await deleteOrder(id, prisma);

        return c.json({
            success: true,
            message: "Order deleted successfully",
            data: order,
        }, 200);
    }
);

export default ordersRoutes;

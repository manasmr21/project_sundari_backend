import { Hono } from "hono";
import { Bindings } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { handleValidationError } from "../../utils/helpers/zod.helper";
import { createPrisma } from "../../lib/prisma";
import {
    validateCreateAddress,
    validateUpdateAddress,
    validateAddressIdParam,
    validateAddressUserIdParam,
    validateAddressQuery,
} from "./address.validator";
import {
    createAddress,
    getAddresses,
    getAddressById,
    getAddressesByUserId,
    updateAddress,
    deleteAddress,
} from "./address.service";

const addressRoutes = new Hono<{ Bindings: Bindings }>();

// 1. Create a new address
addressRoutes.post(
    "/",
    zValidator("json", validateCreateAddress, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const data = c.req.valid("json");
        const address = await createAddress(data, prisma);

        return c.json({ success: true, message: "Address created successfully", data: address }, 201);
    }
);

// 2. Get all addresses (with optional userId filter, search, and pagination)
addressRoutes.get(
    "/",
    zValidator("query", validateAddressQuery, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const query = c.req.valid("query");
        const result = await getAddresses(query, prisma);

        return c.json({
            success: true,
            message: "Addresses retrieved successfully",
            data: result.addresses,
            pagination: result.pagination,
        }, 200);
    }
);

// 3. Get all addresses for a specific user ID
addressRoutes.get(
    "/user/:userId",
    zValidator("param", validateAddressUserIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { userId } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const addresses = await getAddressesByUserId(userId, prisma);

        return c.json({
            success: true,
            message: "User addresses retrieved successfully",
            data: addresses,
        }, 200);
    }
);

// 4. Get a single address by ID
addressRoutes.get(
    "/:id",
    zValidator("param", validateAddressIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const address = await getAddressById(id, prisma);

        return c.json({
            success: true,
            message: "Address retrieved successfully",
            data: address,
        }, 200);
    }
);

// 5. Update an address by ID
addressRoutes.patch(
    "/:id",
    zValidator("param", validateAddressIdParam, (result) => handleValidationError(result as any)),
    zValidator("json", validateUpdateAddress, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const data = c.req.valid("json");
        const prisma = await createPrisma(c.env.DB);
        const address = await updateAddress({ id, ...data }, prisma);

        return c.json({
            success: true,
            message: "Address updated successfully",
            data: address,
        }, 200);
    }
);

// 6. Delete an address by ID
addressRoutes.delete(
    "/:id",
    zValidator("param", validateAddressIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const address = await deleteAddress(id, prisma);

        return c.json({
            success: true,
            message: "Address deleted successfully",
            data: address,
        }, 200);
    }
);

export default addressRoutes;

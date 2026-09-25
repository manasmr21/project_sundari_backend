import { Hono } from "hono";
import { Bindings } from "../../index";
import { zValidator } from "@hono/zod-validator";
import { handleValidationError } from "../../utils/helpers/zod.helper";
import { createPrisma } from "../../lib/prisma";
import {
    validateRole,
    validateUpdateRole,
    validateRoleIdParam,
    validateRoleSlugParam,
    validateRoleQuery,
} from "./roles.validator";
import {
    createRole,
    getRoles,
    getRoleById,
    getRoleBySlug,
    updateRole,
    deleteRole,
} from "./roles.service";

const rolesRoutes = new Hono<{ Bindings: Bindings }>();

// 1. Create a new role
rolesRoutes.post(
    "/",
    zValidator("json", validateRole, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const data = c.req.valid("json");
        const role = await createRole(data, prisma);

        return c.json({ success: true, message: "Role created successfully", data: role }, 201);
    }
);

// 2. Get all roles (with optional search and pagination)
rolesRoutes.get(
    "/",
    zValidator("query", validateRoleQuery, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const query = c.req.valid("query");
        const result = await getRoles(query, prisma);

        return c.json({
            success: true,
            message: "Roles retrieved successfully",
            data: result.roles,
            pagination: result.pagination,
        }, 200);
    }
);

// 3. Get role by slug
rolesRoutes.get(
    "/slug/:slug",
    zValidator("param", validateRoleSlugParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { slug } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const role = await getRoleBySlug(slug, prisma);

        return c.json({
            success: true,
            message: "Role retrieved successfully",
            data: role,
        }, 200);
    }
);

// 4. Get single role by ID
rolesRoutes.get(
    "/:id",
    zValidator("param", validateRoleIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const role = await getRoleById(id, prisma);

        return c.json({
            success: true,
            message: "Role retrieved successfully",
            data: role,
        }, 200);
    }
);

// 5. Update role by ID
rolesRoutes.patch(
    "/:id",
    zValidator("param", validateRoleIdParam, (result) => handleValidationError(result as any)),
    zValidator("json", validateUpdateRole, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const data = c.req.valid("json");
        const prisma = await createPrisma(c.env.DB);
        const role = await updateRole({ id, ...data }, prisma);

        return c.json({
            success: true,
            message: "Role updated successfully",
            data: role,
        }, 200);
    }
);

// 6. Delete role by ID
rolesRoutes.delete(
    "/:id",
    zValidator("param", validateRoleIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);
        const role = await deleteRole(id, prisma);

        return c.json({
            success: true,
            message: "Role deleted successfully",
            data: role,
        }, 200);
    }
);

export default rolesRoutes;

import { Hono } from "hono";
import { Bindings } from "../../index";
import { zValidator } from "@hono/zod-validator";
import {
    validateUsers,
    validateUpdateUsers,
    validateUserIdParam,
    validatePassword,
    validateLogin,
} from "./users.validator";
import { createPrisma } from "../../lib/prisma";
import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    loginUser,
} from "./users.service";
import { handleValidationError } from "../../utils/helpers/zod.helper";
import { HTTPException } from "hono/http-exception";
import { jwtMiddleware } from "../../middlewear/auth.middlewear";

const usersRoutes = new Hono<{ Bindings: Bindings }>();

// 1. Create user
usersRoutes.post(
    "/",
    zValidator("json", validateUsers, (result) => handleValidationError(result as any)),
    async (c) => {
        const prisma = await createPrisma(c.env.DB);
        const data = c.req.valid("json");

        try {
            const user = await createUser(data, prisma);
            return c.json({ success: true, message: "User created successfully", data: user }, 201);
        } catch (error) {
            if (error instanceof Error && "code" in error && error.code === "P2002") {
                throw new HTTPException(409, { message: "A user with this email already exists" });
            }
            throw error;
        }
    }
);

// 2. Get all users
usersRoutes.get("/", async (c) => {
    const prisma = await createPrisma(c.env.DB);
    const users = await getUsers(prisma);

    return c.json({ success: true, message: "Users retrieved successfully", data: users }, 200);
});

//Login the user
usersRoutes.post(
    "/login",
    zValidator("json", validateLogin, (result) => handleValidationError(result as any)),
    async (c) => {
        // const prisma = await createPrisma(c.env.DB);
        const data = c.req.valid("json");

        try {
            await loginUser(data, c);
            return c.json({ success: true, message: "User logged in successfully" }, 200);
        } catch (error) {
            throw error;
        }
    }
)

// 3. Get single user by ID
usersRoutes.get(
    "/me",
    jwtMiddleware,
    async (c) => {
        const jwtPayload = c.get("user");
        const prisma = await createPrisma(c.env.DB);
        const user = await getUserById(jwtPayload.id, prisma);

        if (!user) {
            throw new HTTPException(404, { message: "User not found" });
        }

        return c.json({ success: true, message: "User retrieved successfully", data: user }, 200);
    }
);

// 4. Update user by ID
usersRoutes.patch(
    "/:id",
    zValidator("param", validateUserIdParam, (result) => handleValidationError(result as any)),
    zValidator("json", validateUpdateUsers, (result) => handleValidationError(result as any)),
    zValidator("json", validatePassword, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const data = c.req.valid("json");
        const prisma = await createPrisma(c.env.DB);

        try {
            const user = await updateUser({ id, ...data }, prisma);
            return c.json({ success: true, message: "User updated successfully", data: user }, 200);
        } catch (error) {
            if (error instanceof Error && "code" in error) {
                if (error.code === "P2025") {
                    throw new HTTPException(404, { message: "User not found" });
                }
                if (error.code === "P2002") {
                    throw new HTTPException(409, { message: "A user with this email already exists" });
                }
            }
            throw error;
        }
    }
);

// 5. Delete user by ID
usersRoutes.delete(
    "/:id",
    zValidator("param", validateUserIdParam, (result) => handleValidationError(result as any)),
    async (c) => {
        const { id } = c.req.valid("param");
        const prisma = await createPrisma(c.env.DB);

        try {
            const user = await deleteUser({ id }, prisma);
            return c.json({ success: true, message: "User deleted successfully", data: user }, 200);
        } catch (error) {
            if (error instanceof Error && "code" in error && error.code === "P2025") {
                throw new HTTPException(404, { message: "User not found" });
            }
            throw error;
        }
    }
);

export default usersRoutes;

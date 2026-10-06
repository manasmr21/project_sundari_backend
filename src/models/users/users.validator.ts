import { z } from "zod";

export const validateUsers = z.object({
    fullname: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string()
});

export const validateUpdateUsers = validateUsers.partial();
export const validatePassword = validateUsers.omit({ password: true }).partial();

export const validateLogin = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export const validateUserIdParam = z.object({
    id: z.string().uuid("Invalid user ID (must be a valid UUID)"),
});

export type CreateUserTypes = z.infer<typeof validateUsers>;
export type UpdateUserTypes = z.infer<typeof validateUpdateUsers>;
export type LoginUserTypes = z.infer<typeof validateLogin>;
export type UserIdParamType = z.infer<typeof validateUserIdParam>;

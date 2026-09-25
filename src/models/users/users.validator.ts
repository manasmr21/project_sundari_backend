import { z } from "zod";

export const validateUsers = z.object({
    fullname: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const validateUpdateUsers = validateUsers.partial();

export const validateUserIdParam = z.object({
    id: z.string().min(1, "User ID is required"),
});

export type CreateUserTypes = z.infer<typeof validateUsers>;
export type UpdateUserTypes = z.infer<typeof validateUpdateUsers>;
export type UserIdParamType = z.infer<typeof validateUserIdParam>;

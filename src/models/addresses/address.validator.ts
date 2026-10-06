import { z } from "zod";

export const validateCreateAddress = z.object({
    userId: z.string().min(1, "User ID is required"),
    name: z.string().min(2, "Recipient name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
    address: z.string().min(5, "Address must be at least 5 characters").max(500, "Address cannot exceed 500 characters"),
    city: z.string().min(2, "City is required").max(100, "City cannot exceed 100 characters"),
    state: z.string().min(2, "State is required").max(100, "State cannot exceed 100 characters"),
    pin: z.coerce.number().int().positive("Invalid PIN code").min(6, "PIN code must be 6 digits").max(6, "PIN code must be 6 digits"),
    country: z.string().optional().default("India"),
    phone: z.string().min(10, "Phone number must be at least 10 characters").max(10, "Phone number cannot exceed 10 characters"),
    email: z.string().email("Invalid email format").optional().nullable(),
    isDefault: z.boolean().optional().default(false),
});

export const validateUpdateAddress = validateCreateAddress.omit({ userId: true }).partial();

export const validateAddressIdParam = z.object({
    id: z.coerce.number().int().positive("Invalid address ID"),
});

export const validateAddressUserIdParam = z.object({
    userId: z.string().min(1, "User ID is required"),
});

export const validateAddressQuery = z.object({
    userId: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateAddressType = z.infer<typeof validateCreateAddress>;
export type UpdateAddressType = z.infer<typeof validateUpdateAddress>;
export type AddressIdParamType = z.infer<typeof validateAddressIdParam>;
export type AddressUserIdParamType = z.infer<typeof validateAddressUserIdParam>;
export type AddressQueryType = z.infer<typeof validateAddressQuery>;

import { HTTPException } from "hono/http-exception";
import { PrismaClient } from "../../generated/prisma/client";
import {
    CreateAddressType,
    UpdateAddressType,
    AddressQueryType,
} from "./address.validator";

//create an address
export const createAddress = async (data: CreateAddressType, prisma: PrismaClient) => {
    const user = await prisma.users.findUnique({
        where: { id: data.userId },
    });

    if (!user) {
        throw new HTTPException(404, { message: `User not found` });
    }

    const existingAddressesCount = await prisma.address.count({
        where: { userId: data.userId },
    });

    const isDefault = data.isDefault || existingAddressesCount === 0;

    if (isDefault && existingAddressesCount > 0) {
        await prisma.address.updateMany({
            where: { userId: data.userId },
            data: { isDefault: false },
        });
    }

    return await prisma.address.create({
        data: {
            userId: data.userId,
            name: data.name,
            address: data.address,
            city: data.city,
            state: data.state,
            pin: data.pin,
            country: data.country ?? "India",
            phone: data.phone,
            email: data.email ?? null,
            isDefault,
        },
    });
};

//get all address
export const getAddresses = async (query: AddressQueryType, prisma: PrismaClient) => {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.userId) {
        where.userId = query.userId;
    }

    if (query.search && query.search.trim()) {
        const search = query.search.trim();
        where.OR = [
            { name: { contains: search } },
            { address: { contains: search } },
            { city: { contains: search } },
            { state: { contains: search } },
            { phone: { contains: search } },
        ];
    }

    const [total, addresses] = await Promise.all([
        prisma.address.count({ where }),
        prisma.address.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        }),
    ]);

    return {
        addresses,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

// get all address
export const getAddressesByUserId = async (userId: string, prisma: PrismaClient) => {
    const user = await prisma.users.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new HTTPException(404, { message: `User not found` });
    }

    return await prisma.address.findMany({
        where: { userId },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
};

//get address
export const getAddressById = async (id: number, prisma: PrismaClient) => {
    const address = await prisma.address.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    fullname: true,
                    email: true,
                },
            },
        },
    });

    if (!address) {
        throw new HTTPException(404, { message: "Address not found" });
    }

    return address;
};

//Update address
export const updateAddress = async (
    data: UpdateAddressType & { id: number },
    prisma: PrismaClient
) => {
    const { id, ...updateFields } = data;

    const existing = await prisma.address.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new HTTPException(404, { message: "Address not found" });
    }

    if (updateFields.isDefault === true) {
        await prisma.address.updateMany({
            where: { userId: existing.userId },
            data: { isDefault: false },
        });
    }

    return await prisma.address.update({
        where: { id },
        data: updateFields,
    });
};

//Delete address
export const deleteAddress = async (id: number, prisma: PrismaClient) => {
    try {
        const deleted = await prisma.address.delete({
            where: { id },
        });

        // If the deleted address was default, set the newest remaining address as default
        if (deleted.isDefault) {
            const nextDefault = await prisma.address.findFirst({
                where: { userId: deleted.userId },
                orderBy: { createdAt: "desc" },
            });
            if (nextDefault) {
                await prisma.address.update({
                    where: { id: nextDefault.id },
                    data: { isDefault: true },
                });
            }
        }

        return deleted;
    } catch (err) {
        if (err instanceof Error && "code" in err && err.code === "P2025") {
            throw new HTTPException(404, { message: "Address not found" });
        }
        throw err;
    }
};

// implement admin authorization later on

import { PrismaClient } from "../../generated/prisma/client";
import { CreateUserTypes, UpdateUserTypes } from "./users.validator";

export const createUser = async (data: CreateUserTypes, prisma: PrismaClient) => {
    const user = await prisma.users.create({
        data: {
            fullname: data.fullname,
            email: data.email,
            password: data.password,
        },
        select: {
            id: true,
            fullname: true,
            email: true,
            verified: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return user;
};

export const getUsers = async (prisma: PrismaClient) => {
    const users = await prisma.users.findMany({
        select: {
            id: true,
            fullname: true,
            email: true,
            verified: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return users;
};

export const getUserById = async (id: string, prisma: PrismaClient) => {
    const user = await prisma.users.findUnique({
        where: {
            id,
        },
        select: {
            id: true,
            fullname: true,
            email: true,
            verified: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return user;
};

export const getUserByEmail = async (email: string, prisma: PrismaClient) => {
    const user = await prisma.users.findUnique({
        where: {
            email,
        },
    });

    return user;
};

export const updateUser = async (
    data: UpdateUserTypes & { id: string },
    prisma: PrismaClient
) => {
    const { id, ...updateData } = data;
    const user = await prisma.users.update({
        where: {
            id,
        },
        data: updateData,
        select: {
            id: true,
            fullname: true,
            email: true,
            verified: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return user;
};

export const deleteUser = async (
    data: { id: string },
    prisma: PrismaClient
) => {
    const user = await prisma.users.delete({
        where: {
            id: data.id,
        },
        select: {
            id: true,
            fullname: true,
            email: true,
            verified: true,
        },
    });

    return user;
};
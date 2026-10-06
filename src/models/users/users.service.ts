// implement admin authorization later on

import { HTTPException } from "hono/http-exception";
import { PrismaClient } from "../../generated/prisma/client";
import { CreateUserTypes, UpdateUserTypes, LoginUserTypes } from "./users.validator";
import { hashPassword, verifyPassword } from "./users.helper";
import { sign } from "hono/jwt";
import { setSignedCookie } from "hono/cookie";
import { createPrisma } from "../../lib/prisma";

export const createUser = async (data: CreateUserTypes, prisma: PrismaClient) => {

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.users.create({
        data: {
            fullname: data.fullname,
            email: data.email,
            password: hashedPassword,
            role: {
                connect: {
                    name: "user",
                },
            },
            //This will be changed when pushing to production as for now i do not have a registered domain email to use to send email, also will implement otp via sms.
            verified: true,
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

export const loginUser = async (data: LoginUserTypes, c: any) => {
    const prisma = await createPrisma(c.env.DB);
    const { email, password } = data;

    const user = await prisma.users.findFirst({
        where: {
            email
        },
        select: {
            id: true,
            fullname: true,
            role: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            },
            password: true,
            verified: true
        }
    })

    if (!user) {
        throw new HTTPException(404, { message: "User not found" });
    }

    const checkPassword = await verifyPassword(password as string, user?.password as string);

    if (!checkPassword) {
        throw new HTTPException(401, { message: "Invalid credentials" });
    }

    const payload = {
        id: user.id,
        fullname: user.fullname,
        role: user.role,
        verified: user.verified,
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }

    const secret = (c.env?.JWT_SECRET || process.env.JWT_SECRET) as string;
    const cookieSecret = (c.env?.COOKIE_SECRET || process.env.COOKIE_SECRET) as string;
    const token = await sign(payload, secret);

    await setSignedCookie(c, 'auth_token', token, cookieSecret, {
        path: '/',
        secure: true,
        httpOnly: true,
        maxAge: 60 * 60 * 1000,
        expires: new Date(Date.now() + 60 * 60 * 1000),
        sameSite: 'Lax',
    });

}

export const getUsers = async (prisma: PrismaClient) => {
    const users = await prisma.users.findMany({
        select: {
            id: true,
            fullname: true,
            email: true,
            role: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            },
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
            role: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            },
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
        select: {
            id: true,
            fullname: true,
            email: true,
            role: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            },
            verified: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return user;
};

export const updateUser = async (
    data: UpdateUserTypes & { id: string },
    prisma: PrismaClient
) => {

    if ("password" in data && data.password !== undefined) {
        throw new HTTPException(400, { message: "Cannot update password through this endpoint." });
    }

    const { id, password, ...updateData } = data;

    const updatedUser = await prisma.users.update({
        where: {
            id,
        },
        data: updateData,
        select: {
            id: true,
            fullname: true,
            role: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            },
            email: true,
            verified: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return updatedUser;
};

export const deleteUser = async (
    data: { id: string },
    prisma: PrismaClient
) => {
    try {
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
    } catch (err) {
        if (err instanceof Error && "code" in err && err.code === "P2025") {
            throw new HTTPException(404, { message: "User not found" });
        }
        throw err;
    }
};
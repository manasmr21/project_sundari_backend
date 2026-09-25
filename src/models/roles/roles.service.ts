import { HTTPException } from "hono/http-exception";
import { PrismaClient } from "../../generated/prisma/client";
import {
    CreateRoleType,
    UpdateRoleType,
    RoleQueryType,
} from "./roles.validator";

const slugify = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

export const createRole = async (data: CreateRoleType, prisma: PrismaClient) => {
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);

    if (!slug) {
        throw new HTTPException(400, { message: "Invalid role name or slug" });
    }

    // Check for duplicate name or slug
    const existing = await prisma.roles.findFirst({
        where: {
            OR: [{ name: data.name }, { slug }],
        },
    });

    if (existing) {
        if (existing.name.toLowerCase() === data.name.toLowerCase()) {
            throw new HTTPException(409, {
                message: `A role with name '${data.name}' already exists`,
            });
        }
        throw new HTTPException(409, {
            message: `A role with slug '${slug}' already exists`,
        });
    }

    const role = await prisma.roles.create({
        data: {
            name: data.name,
            slug,
            description: data.description,
        },
    });

    return role;
};


export const getRoles = async (query: RoleQueryType, prisma: PrismaClient) => {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search && query.search.trim()) {
        const search = query.search.trim();
        where.OR = [
            { name: { contains: search } },
            { slug: { contains: search } },
            { description: { contains: search } },
        ];
    }

    const [total, roles] = await Promise.all([
        prisma.roles.count({ where }),
        prisma.roles.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: "asc" },
        }),
    ]);

    return {
        roles,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

export const getRoleById = async (id: number, prisma: PrismaClient) => {
    const role = await prisma.roles.findUnique({
        where: { id },
    });

    if (!role) {
        throw new HTTPException(404, { message: "Role not found" });
    }

    return role;
};


export const getRoleBySlug = async (slug: string, prisma: PrismaClient) => {
    const role = await prisma.roles.findUnique({
        where: { slug },
    });

    if (!role) {
        throw new HTTPException(404, { message: `Role with slug '${slug}' not found` });
    }

    return role;
};

export const updateRole = async (
    data: UpdateRoleType & { id: number },
    prisma: PrismaClient
) => {
    const existing = await prisma.roles.findUnique({
        where: { id: data.id },
    });

    if (!existing) {
        throw new HTTPException(404, { message: "Role not found" });
    }

    const updateData: any = {};

    if (data.name !== undefined) {
        updateData.name = data.name;
    }

    if (data.slug !== undefined) {
        updateData.slug = slugify(data.slug);
    } else if (data.name !== undefined) {
        updateData.slug = slugify(data.name);
    }

    if (data.description !== undefined) {
        updateData.description = data.description;
    }

    // Check for duplicates if name or slug is changing
    if (updateData.name || updateData.slug) {
        const duplicate = await prisma.roles.findFirst({
            where: {
                id: { not: data.id },
                OR: [
                    ...(updateData.name ? [{ name: updateData.name }] : []),
                    ...(updateData.slug ? [{ slug: updateData.slug }] : []),
                ],
            },
        });

        if (duplicate) {
            if (duplicate.name === updateData.name) {
                throw new HTTPException(409, {
                    message: `A role with name '${updateData.name}' already exists`,
                });
            }
            throw new HTTPException(409, {
                message: `A role with slug '${updateData.slug}' already exists`,
            });
        }
    }

    const updated = await prisma.roles.update({
        where: { id: data.id },
        data: updateData,
    });

    return updated;
};

export const deleteRole = async (id: number, prisma: PrismaClient) => {
    const existing = await prisma.roles.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new HTTPException(404, { message: "Role not found" });
    }

    const deleted = await prisma.roles.delete({
        where: { id },
    });

    return deleted;
};

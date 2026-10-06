// implement admin authorization later on

import { HTTPException } from "hono/http-exception";
import { PrismaClient } from "../../generated/prisma/client";
import { CreateMenuTypes, UpdateMenuTypes } from "./menu.validator";

export const createMenu = async (data: CreateMenuTypes, prisma: PrismaClient) => {
    const menu = await prisma.menus.create({
        data: {
            name: data.name,
            url: data.url,
            type: data.type,
            parentId: data.parentId,
            position: data.position,
        },
    });

    return menu;
};

// no authorization required here
export const getMenus = async (prisma: PrismaClient) => {
    const menus = await prisma.menus.findMany();
    return menus;
};

export const getMenuById = async (id: number, prisma: PrismaClient) => {
    const menu = await prisma.menus.findUnique({
        where: {
            id,
        },
    });

    return menu;
};

export const updateMenu = async (
    data: UpdateMenuTypes & { id: number },
    prisma: PrismaClient
) => {
    const { id, ...updateData } = data;
    const menu = await prisma.menus.update({
        where: {
            id,
        },
        data: updateData,
    });

    return menu;
};

export const deleteMenu = async (
    data: { id: number },
    prisma: PrismaClient
) => {
    try {
        const menu = await prisma.menus.delete({
            where: {
                id: data.id,
            },
        });

        return menu;
    } catch (err) {
        if (err instanceof Error && "code" in err && err.code === "P2025") {
            throw new HTTPException(404, { message: "Menu not found" });
        }
        throw err;
    }
};
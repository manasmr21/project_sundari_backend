import { HTTPException } from "hono/http-exception";
import { PrismaClient } from "../../generated/prisma/client";
import { SocialsType, UpdateSocialsType } from "./socials.validator";

export const createSocials = async (data: SocialsType, prisma: PrismaClient) => {
    const social = await prisma.socials.create({
        data: {
            platform: data.platform,
            url: data.url,
            icon: data.icon,
        },
    });

    return social;
};

export const getSocials = async (prisma: PrismaClient) => {
    const socials = await prisma.socials.findMany();

    if (!socials) {
        throw new HTTPException(404, { message: "No socials found" });
    }

    return socials;
};

export const getSocialsById = async (id: number, prisma: PrismaClient) => {
    const social = await prisma.socials.findUnique({
        where: {
            id,
        },
    });

    return social;
};

export const updateSocials = async (
    data: UpdateSocialsType & { id: number },
    prisma: PrismaClient
) => {
    const { id, ...updateData } = data;
    const social = await prisma.socials.update({
        where: {
            id,
        },
        data: updateData,
    });

    return social;
};

export const deleteSocials = async (
    data: { id: number },
    prisma: PrismaClient
) => {
    try {
        const social = await prisma.socials.delete({
            where: {
                id: data.id,
            },
        });

        return social;
    } catch (err) {
        if (err instanceof Error && "code" in err && err.code === "P2025") {
            throw new HTTPException(404, { message: "Social link not found" });
        }
        throw err;
    }
};

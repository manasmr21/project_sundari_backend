// implement admin authorization later on

import { HTTPException } from "hono/http-exception";
import { PrismaClient } from "../../generated/prisma/client";
import { SiteDataType, UpdateSiteDataType } from "./siteData.validator";

export const createSiteData = async (data: SiteDataType, prisma: PrismaClient) => {
    const siteData = await prisma.siteData.create({
        data: {
            siteName: data.siteName,
            logo: data.logo,
            ribbonText: data.ribbonText,
            footerText: data.footerText,
        },
    });

    return siteData;
};

// no authorization required here
export const getSiteData = async (prisma: PrismaClient) => {
    const siteData = await prisma.siteData.findMany();

    if (!siteData) {
        throw new Error("Site data not found");
    }

    return siteData;
};

export const getSiteDataById = async (id: number, prisma: PrismaClient) => {
    const siteData = await prisma.siteData.findUnique({
        where: {
            id,
        },
    });

    return siteData;
};

export const updateSiteData = async (
    data: UpdateSiteDataType & { id: number },
    prisma: PrismaClient
) => {
    const { id, ...updateData } = data;
    const siteData = await prisma.siteData.update({
        where: {
            id,
        },
        data: updateData,
    });

    return siteData;
};

export const deleteSiteData = async (
    data: { id: number },
    prisma: PrismaClient
) => {
    try {
        const siteData = await prisma.siteData.delete({
            where: {
                id: data.id,
            },
        });

        return siteData;
    } catch (err) {
        if (err instanceof Error && "code" in err && err.code === "P2025") {
            throw new HTTPException(404, { message: "Site data not found" });
        }
        throw err;
    }
};
// implement admin authorization later on

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
    const siteData = await prisma.siteData.delete({
        where: {
            id: data.id,
        },
    });

    return siteData;
};
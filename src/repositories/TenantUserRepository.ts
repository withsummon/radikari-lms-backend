import { prisma } from "$pkg/prisma"
import { Prisma } from "../../generated/prisma/client"

export async function updateTenantUser(tenantId: string, data: Prisma.TenantUserCreateManyInput[]) {
    return prisma.$transaction(async (tx) => {
        await tx.tenantUser.deleteMany({
            where: {
                tenantId,
            },
        })
        return await tx.tenantUser.createMany({
            data,
        })
    })
}

export async function getByTenantId(tenantId: string) {
    return await prisma.tenantUser.findMany({
        where: {
            tenantId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phoneNumber: true,
                },
            },
            tenantRole: true,
            headOfOperation: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phoneNumber: true,
                },
            },
            teamLeader: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phoneNumber: true,
                },
            },
            supervisor: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phoneNumber: true,
                },
            },
            manager: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phoneNumber: true,
                },
            },
        },
    })
}

export async function getByTenantIdAndUserId(tenantId: string, userId: string) {
    return await prisma.tenantUser.findUnique({
        where: {
            userId_tenantId: {
                userId,
                tenantId,
            },
        },
        include: {
            tenantRole: true,
        },
    })
}

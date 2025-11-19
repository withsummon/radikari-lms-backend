import { TenantUserUpdateDTO } from "$entities/TenantUser"
import { prisma } from "$pkg/prisma"
import { ulid } from "ulid"
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

export async function createTenantUser(tenantId: string, data: TenantUserUpdateDTO) {
    return prisma.tenantUser.create({
        data: {
            id: ulid(),
            tenantId,
            userId: data.userId,
            tenantRoleId: data.tenantRoleId,
            headOfOperationUserId: data.headOfOperationUserId,
            teamLeaderUserId: data.teamLeaderUserId,
            supervisorUserId: data.supervisorUserId,
            managerUserId: data.managerUserId,
        },
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

export async function getByUserId(userId: string) {
    return await prisma.tenantUser.findMany({
        where: {
            userId,
        },
        include: {
            tenantRole: true,
        },
    })
}

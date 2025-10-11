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
            user: true,
            tenantRole: true,
        },
    })
}

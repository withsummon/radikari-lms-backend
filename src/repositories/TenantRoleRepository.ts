import { prisma } from "$pkg/prisma"
import { Prisma } from "../../generated/prisma/client"

export async function createMany(data: Prisma.TenantRoleCreateManyInput[]) {
    return await prisma.tenantRole.createMany({
        data,
    })
}

export async function getByTenantId(tenantId: string) {
    return await prisma.tenantRole.findMany({
        where: {
            tenantId,
        },
    })
}

export async function getById(id: string) {
    return await prisma.tenantRole.findUnique({
        where: {
            id,
        },
    })
}

import { prisma } from "$pkg/prisma"
import { Prisma } from "../../generated/prisma/client"

export async function createMany(data: Prisma.TenantRoleCreateManyInput[]) {
    return await prisma.tenantRole.createMany({
        data,
    })
}

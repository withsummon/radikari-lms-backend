import { TenantRoleIdentifier } from "$entities/TenantRole"
import { prisma } from "$pkg/prisma"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import { Roles } from "../../../generated/prisma/client"
import { UserJWTDAO } from "$entities/User"

export async function buildFilterTenantRole(
    usedFilters: EzFilter.BuildQueryResult,
    user: UserJWTDAO,
    tenantId: string
) {
    const tenantUser = await prisma.tenantUser.findUnique({
        where: {
            userId_tenantId: {
                userId: user.id,
                tenantId,
            },
        },
        include: {
            tenantRole: true,
        },
    })

    if (user.role == Roles.USER) {
        if (tenantUser?.tenantRole.identifier == TenantRoleIdentifier.AGENT) {
            usedFilters.query.where.AND.push({
                tenantRoleId: tenantUser.tenantRole.id,
            })
        } else {
            usedFilters.query.where.AND.push({
                tenantId,
            })
        }
    }

    return usedFilters
}

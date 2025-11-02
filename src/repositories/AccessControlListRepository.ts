import { prisma } from "$pkg/prisma"
import { Prisma, TenantRole } from "../../generated/prisma/client"
import { ulid } from "ulid"
import * as EzFilter from "@nodewave/prisma-ezfilter"

export async function findAllFeatures() {
    const aclFeatures = await prisma.aclFeature.findMany({
        select: {
            name: true,
            action: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    })

    return aclFeatures
}

export async function findAllRoles(
    filters: EzFilter.FilteringQuery
): Promise<EzFilter.PaginatedResult<TenantRole[]>> {
    const builder = new EzFilter.BuildQueryFilter()
    const usedFilters = builder.build(filters)

    const [roles, totalData] = await Promise.all([
        prisma.tenantRole.findMany(usedFilters.query as any),
        prisma.tenantRole.count({
            where: usedFilters.query.where,
        }),
    ])

    let totalPage = 1
    if (totalData > usedFilters.query.take)
        totalPage = Math.ceil(totalData / usedFilters.query.take)

    return {
        entries: roles,
        totalData,
        totalPage,
    }
}

export async function findRoleWithFeatures(tenantRoleId: string) {
    return Promise.all([
        prisma.tenantRole.findUnique({
            where: {
                id: tenantRoleId,
            },
        }),
        prisma.accessControlList.findMany({
            where: {
                tenantRoleId,
            },
        }),
    ])
}

export async function findFeatures() {
    return prisma.accessControlList.findMany()
}

export async function findAccessMapping(
    tenantRoleIds: string[],
    featureName: string,
    actionName: string
) {
    return prisma.accessControlList.findMany({
        where: {
            tenantRoleId: {
                in: tenantRoleIds,
            },
            featureName,
            actionName,
        },
    })
}

export async function createRole(
    roleData: { identifier: string; level: number; description: string; name: string },
    mappings: Prisma.AccessControlListCreateManyInput[]
) {
    const tenantRoleId = ulid()

    return await prisma.$transaction([
        prisma.tenantRole.create({
            data: {
                id: tenantRoleId,
                identifier: roleData.identifier,
                level: roleData.level,
                name: roleData.name,
                description: roleData.description,
            },
        }),
        prisma.accessControlList.createMany({
            data: mappings.map((mapping) => ({
                ...mapping,
                tenantRoleId,
            })),
        }),
    ])
}

export async function findActionByFeatureAndName(featureName: string, actionName: string) {
    return prisma.aclAction.findUnique({
        where: {
            featureName_name: {
                name: actionName,
                featureName,
            },
        },
    })
}

export async function updateRole(
    tenantRoleId: string,
    roleData: {
        name: string
        updatedBy: string
    },
    createMappings: Prisma.AccessControlListCreateManyInput[],
    deleteMappings: Array<{
        featureName: string
        actionName: string
        tenantRoleId: string
    }>
) {
    const deletePromises = deleteMappings.map((mapping) =>
        prisma.accessControlList.delete({
            where: {
                featureName_actionName_tenantRoleId: mapping,
            },
        })
    )

    return await prisma.$transaction([
        prisma.accessControlList.createMany({
            data: createMappings,
        }),
        prisma.tenantRole.update({
            where: { id: tenantRoleId },
            data: roleData,
        }),
        ...deletePromises,
    ])
}

export async function deleteRoles(ids: string[]) {
    return prisma.$transaction(
        ids.map((id) =>
            prisma.tenantRole.delete({
                where: { id },
            })
        )
    )
}

export async function findActionsByFeatureNameAndRoleId(
    featureName: string,
    tenantRoleIds: string[]
) {
    // Get all available actions for the feature
    const allActions = await prisma.aclAction.findMany({
        where: {
            featureName: featureName,
        },
        select: {
            name: true,
        },
        orderBy: {
            name: "asc",
        },
    })

    // Get user's enabled actions for this feature
    const enabledActions = await prisma.accessControlList.findMany({
        where: {
            featureName: featureName,
            tenantRoleId: {
                in: tenantRoleIds,
            },
        },
        select: {
            actionName: true,
        },
    })

    const enabledActionNames = new Set(enabledActions.map((action) => action.actionName))

    // Create result object with all actions and their permission status
    const result: Record<string, boolean> = {}
    allActions.forEach((action) => {
        result[action.name] = enabledActionNames.has(action.name)
    })

    return result
}

export async function findActionsByFeatureName(featureName: string) {
    // Get all available actions for the feature
    const allActions = await prisma.aclAction.findMany({
        where: {
            featureName: featureName,
        },
        select: {
            name: true,
        },
        orderBy: {
            name: "asc",
        },
    })

    // Get user's enabled actions for this feature
    const enabledActions = await prisma.accessControlList.findMany({
        where: {
            featureName: featureName,
        },
        select: {
            actionName: true,
        },
    })

    const enabledActionNames = new Set(enabledActions.map((action) => action.actionName))

    // Create result object with all actions and their permission status
    const result: Record<string, boolean> = {}
    allActions.forEach((action) => {
        result[action.name] = enabledActionNames.has(action.name)
    })

    return result
}

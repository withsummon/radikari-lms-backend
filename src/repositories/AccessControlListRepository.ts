import { prisma } from "$pkg/prisma"
import { Prisma, TenantRole } from "../../generated/prisma/client"
import { ulid } from "ulid"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import { TenantRoleDTO } from "$entities/TenantRole"

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
    tenantRoleId: string,
    featureName: string,
    actionName: string
) {
    return prisma.accessControlList.findUnique({
        where: {
            featureName_actionName_tenantRoleId: {
                featureName,
                actionName,
                tenantRoleId,
            },
        },
    })
}

export async function createRole(data: TenantRoleDTO) {
    const tenantRoleId = ulid()

    return await prisma.tenantRole.create({
        data: {
            id: tenantRoleId,
            identifier: data.identifier,
            level: data.level,
            name: data.name,
            description: data.description,
        },
    })
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

export async function updateRoleAccess(
    createMappings: Prisma.AccessControlListCreateManyInput[],
    deleteMappings: Array<{
        featureName: string
        actionName: string
        tenantRoleId: string
    }>
) {
    return await prisma.$transaction(async (tx) => {
        const deleteIds: string[] = []

        for (const mapping of deleteMappings) {
            const mappingExist = await tx.accessControlList.findUnique({
                where: {
                    featureName_actionName_tenantRoleId: {
                        featureName: mapping.featureName,
                        actionName: mapping.actionName,
                        tenantRoleId: mapping.tenantRoleId,
                    },
                },
            })

            if (mappingExist) {
                deleteIds.push(mappingExist.id)
            }
        }

        if (deleteIds.length > 0) {
            await tx.accessControlList.deleteMany({
                where: {
                    id: {
                        in: deleteIds,
                    },
                },
            })
        }

        if (createMappings.length > 0) {
            await tx.accessControlList.createMany({
                data: createMappings,
            })
        }
    })
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

import { Prisma, PrismaClient } from "../../generated/prisma/client"
import { ulid } from "ulid"

export async function seedAccessControlList(prisma: PrismaClient) {
    console.log("[SEEDER_LOG] Seeding Access Control List")
    const features = [
        {
            featureName: "USER_MANAGEMENT",
            actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
        },
        {
            featureName: "ACCESS_CONTROL_LIST",
            actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
        },
        {
            featureName: "TENANT",
            actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
        },
        {
            featureName: "KNOWLEDGE",
            actions: ["CREATE", "VIEW", "UPDATE", "DELETE", "APPROVAL", "ARCHIVE"],
        },
        {
            featureName: "OPERATION",
            actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
        },
        {
            featureName: "BULK_UPLOAD",
            actions: ["CREATE"],
        },
        {
            featureName: "ANNOUNCEMENT",
            actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
        },
        {
            featureName: "ASSIGNMENT",
            actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
        },
        {
            featureName: "FORUM",
            actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
        },
        {
            featureName: "USER_ACTIVITY_LOG",
            actions: ["VIEW"],
        },
        {
            featureName: "NOTIFICATION",
            actions: ["VIEW", "UPDATE", "DELETE"],
        },
        // Add More Features
    ]

    for (const feature of features) {
        const existingFeature = await prisma.aclFeature.findUnique({
            where: {
                name: feature.featureName,
            },
        })

        if (!existingFeature) {
            await prisma.aclFeature.create({
                data: {
                    name: feature.featureName,
                    isDeletable: true,
                    isEditable: true,
                },
            })
        }

        const actionCreateManyData: Prisma.AclActionCreateManyInput[] = []
        for (const action of feature.actions) {
            const existingSubFeature = await prisma.aclAction.findFirst({
                where: {
                    name: action,
                    featureName: feature.featureName,
                },
            })

            if (!existingSubFeature) {
                actionCreateManyData.push({
                    id: ulid(),
                    name: action,
                    featureName: feature.featureName,
                })
            }
        }
        await prisma.aclAction.createMany({
            data: actionCreateManyData,
        })
    }

    const allAction = await prisma.aclAction.findMany({
        include: {
            feature: true,
        },
    })

    const adminExist = await prisma.user.findFirst({
        where: {
            role: "ADMIN",
        },
    })

    if (!adminExist) {
        console.log("User admin doesnt exist")
        return
    }

    const [
        headOfOfficeRole,
        opsManagerRole,
        supervisorRole,
        teamLeaderRole,
        trainerRole,
        qualityAssuranceRole,
        agentRole,
    ] = await Promise.all([
        prisma.tenantRole.findUnique({
            where: {
                identifier: "HEAD_OF_OFFICE",
            },
        }),
        prisma.tenantRole.findUnique({
            where: {
                identifier: "OPS_MANAGER",
            },
        }),
        prisma.tenantRole.findUnique({
            where: {
                identifier: "SUPERVISOR",
            },
        }),
        prisma.tenantRole.findUnique({
            where: {
                identifier: "TEAM_LEADER",
            },
        }),
        prisma.tenantRole.findUnique({
            where: {
                identifier: "TRAINER",
            },
        }),
        prisma.tenantRole.findUnique({
            where: {
                identifier: "QUALITY_ASSURANCE",
            },
        }),
        prisma.tenantRole.findUnique({
            where: {
                identifier: "AGENT",
            },
        }),
    ])

    const accessControlListCreateManyData: Prisma.AccessControlListCreateManyInput[] = []

    if (headOfOfficeRole) {
        const headOfOfficeFeature = [
            {
                featureName: "USER_MANAGEMENT",
                actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
            },
            {
                featureName: "TENANT",
                actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
            },
            {
                featureName: "KNOWLEDGE",
                actions: ["VIEW"],
            },
            {
                featureName: "OPERATION",
                actions: ["VIEW"],
            },
            {
                featureName: "ANNOUNCEMENT",
                actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
            },
            {
                featureName: "ASSIGNMENT",
                actions: ["VIEW"],
            },
            {
                featureName: "FORUM",
                actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
            },
            {
                featureName: "NOTIFICATION",
                actions: ["VIEW", "UPDATE", "DELETE"],
            },
        ]
        for (const action of allAction) {
            if (
                headOfOfficeFeature.some(
                    (feature) =>
                        feature.featureName === action.feature.name &&
                        feature.actions.includes(action.name)
                )
            ) {
                const mappingExists = await prisma.accessControlList.findUnique({
                    where: {
                        featureName_actionName_tenantRoleId: {
                            featureName: action.feature.name,
                            actionName: action.name,
                            tenantRoleId: headOfOfficeRole.id,
                        },
                    },
                })

                if (!mappingExists) {
                    accessControlListCreateManyData.push({
                        id: ulid(),
                        featureName: action.feature.name,
                        actionName: action.name,
                        tenantRoleId: headOfOfficeRole.id,
                        createdById: adminExist.id,
                        updatedById: adminExist.id,
                    })
                }
            }
        }
    }

    if (opsManagerRole || supervisorRole) {
        const opsManagerAndSupervisorFeature = [
            {
                featureName: "USER_MANAGEMENT",
                actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
            },
            {
                featureName: "TENANT",
                actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
            },
            {
                featureName: "KNOWLEDGE",
                actions: ["VIEW"],
            },
            {
                featureName: "OPERATION",
                actions: ["VIEW"],
            },
            {
                featureName: "ANNOUNCEMENT",
                actions: ["VIEW"],
            },
            {
                featureName: "ASSIGNMENT",
                actions: ["VIEW"],
            },
            {
                featureName: "FORUM",
                actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
            },
            {
                featureName: "NOTIFICATION",
                actions: ["VIEW", "UPDATE", "DELETE"],
            },
        ]
        for (const action of allAction) {
            if (
                opsManagerAndSupervisorFeature.some(
                    (feature) =>
                        feature.featureName === action.feature.name &&
                        feature.actions.includes(action.name)
                )
            ) {
                if (opsManagerRole) {
                    const mappingExists = await prisma.accessControlList.findUnique({
                        where: {
                            featureName_actionName_tenantRoleId: {
                                featureName: action.feature.name,
                                actionName: action.name,
                                tenantRoleId: opsManagerRole.id,
                            },
                        },
                    })

                    if (!mappingExists) {
                        accessControlListCreateManyData.push({
                            id: ulid(),
                            featureName: action.feature.name,
                            actionName: action.name,
                            tenantRoleId: opsManagerRole.id,
                            createdById: adminExist.id,
                            updatedById: adminExist.id,
                        })
                    }
                }

                if (supervisorRole) {
                    const mappingExists = await prisma.accessControlList.findUnique({
                        where: {
                            featureName_actionName_tenantRoleId: {
                                featureName: action.feature.name,
                                actionName: action.name,
                                tenantRoleId: supervisorRole.id,
                            },
                        },
                    })

                    if (!mappingExists) {
                        accessControlListCreateManyData.push({
                            id: ulid(),
                            featureName: action.feature.name,
                            actionName: action.name,
                            tenantRoleId: supervisorRole.id,
                            createdById: adminExist.id,
                            updatedById: adminExist.id,
                        })
                    }
                }
            }
        }
    }

    if (teamLeaderRole) {
        const teamLeaderFeature = [
            {
                featureName: "TENANT",
                actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
            },
            {
                featureName: "KNOWLEDGE",
                actions: ["VIEW"],
            },
            {
                featureName: "OPERATION",
                actions: ["VIEW"],
            },
            {
                featureName: "ANNOUNCEMENT",
                actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
            },
            {
                featureName: "ASSIGNMENT",
                actions: ["VIEW"],
            },
            {
                featureName: "FORUM",
                actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
            },
            {
                featureName: "NOTIFICATION",
                actions: ["VIEW", "UPDATE", "DELETE"],
            },
        ]

        for (const action of allAction) {
            if (
                teamLeaderFeature.some(
                    (feature) =>
                        feature.featureName === action.feature.name &&
                        feature.actions.includes(action.name)
                )
            ) {
                const mappingExists = await prisma.accessControlList.findUnique({
                    where: {
                        featureName_actionName_tenantRoleId: {
                            featureName: action.feature.name,
                            actionName: action.name,
                            tenantRoleId: teamLeaderRole.id,
                        },
                    },
                })

                if (!mappingExists) {
                    accessControlListCreateManyData.push({
                        id: ulid(),
                        featureName: action.feature.name,
                        actionName: action.name,
                        tenantRoleId: teamLeaderRole.id,
                        createdById: adminExist.id,
                        updatedById: adminExist.id,
                    })
                }
            }
        }
    }

    if (qualityAssuranceRole || trainerRole) {
        const qualityAssuranceAndTrainerFeature = [
            {
                featureName: "KNOWLEDGE",
                actions: ["CREATE", "VIEW", "UPDATE", "DELETE", "APPROVAL", "ARCHIVE"],
            },
            {
                featureName: "OPERATION",
                actions: ["VIEW"],
            },
            {
                featureName: "TENANT",
                actions: ["VIEW"],
            },
            {
                featureName: "ANNOUNCEMENT",
                actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
            },
            {
                featureName: "ASSIGNMENT",
                actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
            },
            {
                featureName: "FORUM",
                actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
            },
            {
                featureName: "NOTIFICATION",
                actions: ["VIEW", "UPDATE", "DELETE"],
            },
        ]

        for (const action of allAction) {
            if (
                qualityAssuranceAndTrainerFeature.some(
                    (feature) =>
                        feature.featureName === action.feature.name &&
                        feature.actions.includes(action.name)
                )
            ) {
                if (qualityAssuranceRole) {
                    const mappingExists = await prisma.accessControlList.findUnique({
                        where: {
                            featureName_actionName_tenantRoleId: {
                                featureName: action.feature.name,
                                actionName: action.name,
                                tenantRoleId: qualityAssuranceRole.id,
                            },
                        },
                    })

                    if (!mappingExists) {
                        accessControlListCreateManyData.push({
                            id: ulid(),
                            featureName: action.feature.name,
                            actionName: action.name,
                            tenantRoleId: qualityAssuranceRole.id,
                            createdById: adminExist.id,
                            updatedById: adminExist.id,
                        })
                    }
                }

                if (trainerRole) {
                    const mappingExists = await prisma.accessControlList.findUnique({
                        where: {
                            featureName_actionName_tenantRoleId: {
                                featureName: action.feature.name,
                                actionName: action.name,
                                tenantRoleId: trainerRole.id,
                            },
                        },
                    })

                    if (!mappingExists) {
                        accessControlListCreateManyData.push({
                            id: ulid(),
                            featureName: action.feature.name,
                            actionName: action.name,
                            tenantRoleId: trainerRole.id,
                            createdById: adminExist.id,
                            updatedById: adminExist.id,
                        })
                    }
                }
            }
        }
    }

    if (agentRole) {
        const agentFeature = [
            {
                featureName: "OPERATION",
                actions: ["VIEW"],
            },
            {
                featureName: "KNOWLEDGE",
                actions: ["VIEW"],
            },
            {
                featureName: "TENANT",
                actions: ["VIEW"],
            },
            {
                featureName: "ANNOUNCEMENT",
                actions: ["VIEW"],
            },
            {
                featureName: "ASSIGNMENT",
                actions: ["VIEW"],
            },
            {
                featureName: "FORUM",
                actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
            },
            {
                featureName: "NOTIFICATION",
                actions: ["VIEW", "UPDATE", "DELETE"],
            },
        ]

        for (const action of allAction) {
            if (
                agentFeature.some(
                    (feature) =>
                        feature.featureName === action.feature.name &&
                        feature.actions.includes(action.name)
                )
            ) {
                const mappingExists = await prisma.accessControlList.findUnique({
                    where: {
                        featureName_actionName_tenantRoleId: {
                            featureName: action.feature.name,
                            actionName: action.name,
                            tenantRoleId: agentRole.id,
                        },
                    },
                })

                if (!mappingExists) {
                    accessControlListCreateManyData.push({
                        id: ulid(),
                        featureName: action.feature.name,
                        actionName: action.name,
                        tenantRoleId: agentRole.id,
                        createdById: adminExist.id,
                        updatedById: adminExist.id,
                    })
                }
            }
        }
    }

    const accessControlList = await prisma.accessControlList.createMany({
        data: accessControlListCreateManyData,
    })
    console.log(`Access Control List created: ${accessControlList.count}`)
}

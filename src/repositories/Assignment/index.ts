import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { AssignmentCreateDTO } from "$entities/Assignment"
import * as AssignmentQuestionRepository from "./AssignmentQuestionRepository"
import { AssignmentAccess, Prisma } from "../../../generated/prisma/client"
import { ulid } from "ulid"

export async function create(data: AssignmentCreateDTO) {
    return await prisma.$transaction(
        async (tx) => {
            const { questions, roleAccesses, userEmails, ...rest } = data
            const assignmentUserAccesses: Prisma.AssignmentUserAccessCreateManyInput[] = []
            const assignmentTenantRoleAccesses: Prisma.AssignmentTenantRoleAccessCreateManyInput[] =
                []

            const assignment = await tx.assignment.create({
                data: {
                    ...rest,
                },
            })

            switch (data.access) {
                case AssignmentAccess.TENANT_ROLE:
                    console.log("roleAccesses", roleAccesses)
                    assignmentTenantRoleAccesses.push(
                        ...roleAccesses.map((roleAccess) => ({
                            tenantRoleId: roleAccess,
                            assignmentId: assignment.id,
                            id: ulid(),
                        }))
                    )
                    break
                case AssignmentAccess.USER:
                    for (const email of userEmails) {
                        const user = await tx.user.findUnique({
                            where: {
                                email,
                            },
                        })
                        if (user) {
                            assignmentUserAccesses.push({
                                id: ulid(),
                                assignmentId: assignment.id,
                                userId: user.id,
                            })
                        }
                    }
                    break

                default:
                    break
            }

            await tx.assignmentTenantRoleAccess.createMany({
                data: assignmentTenantRoleAccesses,
            })
            await tx.assignmentUserAccess.createMany({
                data: assignmentUserAccesses,
            })

            await AssignmentQuestionRepository.createMany(tx, data.questions, assignment.id)
            return assignment
        },
        { timeout: 120000 }
    )
}

export async function getAll(filters: EzFilter.FilteringQuery) {
    const queryBuilder = new EzFilter.BuildQueryFilter()
    const usedFilters = queryBuilder.build(filters)

    const [assignment, totalData] = await Promise.all([
        prisma.assignment.findMany(usedFilters.query as any),
        prisma.assignment.count({
            where: usedFilters.query.where,
        }),
    ])

    let totalPage = 1
    if (totalData > usedFilters.query.take)
        totalPage = Math.ceil(totalData / usedFilters.query.take)

    return {
        entries: assignment,
        totalData,
        totalPage,
    }
}

export async function getById(id: string) {
    return await prisma.assignment.findUnique({
        where: {
            id,
        },
        include: {
            assignmentQuestions: {
                include: {
                    assignmentQuestionOptions: true,
                    assignmentQuestionEssayReferenceAnswer: true,
                    assignmentQuestionTrueFalseAnswer: true,
                },
            },
            assignmentTenantRoleAccesses: true,
            assignmentUserAccesses: true,
        },
    })
}

export async function update(id: string, data: AssignmentCreateDTO) {
    return await prisma.$transaction(
        async (tx) => {
            const { questions, roleAccesses, userEmails, ...rest } = data
            const assignmentUserAccesses: Prisma.AssignmentUserAccessCreateManyInput[] = []
            const assignmentTenantRoleAccesses: Prisma.AssignmentTenantRoleAccessCreateManyInput[] =
                []

            const assignment = await tx.assignment.update({
                where: {
                    id,
                },
                data: {
                    ...rest,
                },
            })

            await tx.assignmentTenantRoleAccess.deleteMany({
                where: {
                    assignmentId: id,
                },
            })
            await tx.assignmentUserAccess.deleteMany({
                where: {
                    assignmentId: id,
                },
            })

            switch (data.access) {
                case AssignmentAccess.TENANT_ROLE:
                    assignmentTenantRoleAccesses.push(
                        ...roleAccesses.map((roleAccess) => ({
                            tenantRoleId: roleAccess,
                            assignmentId: assignment.id,
                            id: ulid(),
                        }))
                    )
                    break
                case AssignmentAccess.USER:
                    for (const email of userEmails) {
                        const user = await tx.user.findUnique({
                            where: {
                                email,
                            },
                        })
                        if (user) {
                            assignmentUserAccesses.push({
                                id: ulid(),
                                assignmentId: assignment.id,
                                userId: user.id,
                            })
                        }
                    }
                    break

                default:
                    break
            }

            await tx.assignmentTenantRoleAccess.createMany({
                data: assignmentTenantRoleAccesses,
            })
            await tx.assignmentUserAccess.createMany({
                data: assignmentUserAccesses,
            })

            await AssignmentQuestionRepository.updateMany(tx, questions, id)

            return assignment
        },
        { timeout: 120000 }
    )
}

export async function deleteById(id: string) {
    return await prisma.assignment.delete({
        where: {
            id,
        },
    })
}

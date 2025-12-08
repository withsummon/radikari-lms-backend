import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { AssignmentCreateDTO } from "$entities/Assignment"
import * as AssignmentQuestionRepository from "./AssignmentQuestionRepository"
import { AssignmentAccess, Prisma } from "../../../generated/prisma/client"
import { ulid } from "ulid"
import * as AssignmentHelpers from "./helpers"
import { UserJWTDAO } from "$entities/User"

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

export async function getAll(filters: EzFilter.FilteringQuery, user: UserJWTDAO, tenantId: string) {
    const queryBuilder = new EzFilter.BuildQueryFilter()
    let usedFilters = queryBuilder.build(filters)

    usedFilters.query.include = {
        createdByUser: {
            select: {
                id: true,
                fullName: true,
            },
        },
        assignmentUserAttempts: {
            where: {
                userId: user.id,
            },
        },
    }

    usedFilters.query.where.AND.push({
        tenantId,
    })

    usedFilters = await AssignmentHelpers.generatedFilterForAssignment(usedFilters, user, tenantId)

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

export async function getById(id: string, tenantId: string) {
    return await prisma.assignment.findUnique({
        where: {
            id,
            tenantId,
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

export async function deleteById(id: string, tenantId: string) {
    return await prisma.assignment.delete({
        where: {
            id,
            tenantId,
        },
    })
}

export async function countAvailableAssignmentByUserIdAndTenantId(
    userId: string,
    tenantId: string,
    tenantRoleIds: string[]
) {
    if (tenantRoleIds.length === 0) {
        return [{ count: BigInt(0) }]
    }

    const roleIdPlaceholders = tenantRoleIds.map((id) => Prisma.sql`${id}`)

    return await prisma.$queryRaw`
        SELECT
            COUNT(*)
        FROM "Assignment" a
        WHERE a."tenantId" = ${tenantId}
            AND (
                EXISTS (
                    SELECT 1
                    FROM "AssignmentTenantRoleAccess" atra
                    WHERE atra."assignmentId" = a.id
                    AND atra."tenantRoleId" IN (${Prisma.join(roleIdPlaceholders)})
                )
                OR EXISTS (
                    SELECT 1
                    FROM "AssignmentUserAccess" aua
                    WHERE aua."assignmentId" = a.id
                    AND aua."userId" = ${userId}
                )
				OR a."createdByUserId" = ${userId}
            )
    `
}

export async function countSubmittedAssignmentByUserIdAndTenantId(
    userId: string,
    tenantId: string
) {
    return await prisma.$queryRaw`
        SELECT
            COUNT(*)
        FROM "AssignmentUserAttempt" aua
        JOIN "Assignment" a ON aua."assignmentId" = a.id
        WHERE a."tenantId" = ${tenantId}
        AND aua."userId" = ${userId}
        AND aua."isSubmitted" = true
    `
}

export async function getTotalAssignmentByTenantId(tenantId: string) {
    return prisma.$queryRaw`
        SELECT
            COUNT(*)
        FROM "Assignment" a
        WHERE a."tenantId" = ${tenantId}
    `
}

export async function getTotalCompletedAssignmentByTenantId(tenantId: string) {
    return prisma.$queryRaw`
        WITH assignment_user_count AS (
            -- For USER access: count AssignmentUserAccess per assignment
            SELECT 
                a.id,
                COUNT(DISTINCT aua."userId") as required_count
            FROM "Assignment" a
            INNER JOIN "AssignmentUserAccess" aua ON aua."assignmentId" = a.id
            WHERE a."tenantId" = ${tenantId} AND a."access" = 'USER'
            GROUP BY a.id
        ),
        assignment_tenant_role_user_count AS (
            -- For TENANT_ROLE access: count TenantUser with matching tenantRoleId per assignment
            SELECT 
                a.id,
                COUNT(DISTINCT tu."userId") as required_count
            FROM "Assignment" a
            INNER JOIN "AssignmentTenantRoleAccess" atra ON atra."assignmentId" = a.id
            INNER JOIN "TenantUser" tu ON tu."tenantRoleId" = atra."tenantRoleId" AND tu."tenantId" = a."tenantId"
            WHERE a."tenantId" = ${tenantId} AND a."access" = 'TENANT_ROLE'
            GROUP BY a.id
        ),
        assignment_attempt_count AS (
            -- Count submitted AssignmentUserAttempt per assignment
            SELECT 
                a.id,
                COUNT(DISTINCT aua."userId") as attempt_count
            FROM "Assignment" a
            LEFT JOIN "AssignmentUserAttempt" aua ON aua."assignmentId" = a.id AND aua."isSubmitted" = true
            WHERE a."tenantId" = ${tenantId}
            GROUP BY a.id
        ),
        assignment_completion AS (
            SELECT 
                a.id,
                a."access",
                COALESCE(auc.attempt_count, 0) as attempt_count,
                CASE 
                    WHEN a."access" = 'USER' THEN COALESCE(au_count.required_count, 0)
                    WHEN a."access" = 'TENANT_ROLE' THEN COALESCE(atru_count.required_count, 0)
                    ELSE 0
                END as required_count
            FROM "Assignment" a
            LEFT JOIN assignment_attempt_count auc ON auc.id = a.id
            LEFT JOIN assignment_user_count au_count ON au_count.id = a.id AND a."access" = 'USER'
            LEFT JOIN assignment_tenant_role_user_count atru_count ON atru_count.id = a.id AND a."access" = 'TENANT_ROLE'
            WHERE a."tenantId" = ${tenantId}
        )
        SELECT 
            COUNT(*) as count
        FROM assignment_completion
        WHERE attempt_count >= required_count AND required_count > 0
    `
}

export async function getUserListWithAssignmentSummaryByTenantId(tenantId: string) {
    return prisma.$queryRaw`
        WITH user_total_assignment AS (
            -- Combine both access types (using UNION to avoid duplicates)
            SELECT 
                user_id,
                COUNT(DISTINCT assignment_id) as total_assignment
            FROM (
                SELECT u.id as user_id, a.id as assignment_id
                FROM "User" u
                INNER JOIN "TenantUser" tu ON tu."userId" = u.id AND tu."tenantId" = ${tenantId}
                INNER JOIN "AssignmentUserAccess" aua ON aua."userId" = u.id
                INNER JOIN "Assignment" a ON a.id = aua."assignmentId" AND a."tenantId" = ${tenantId} AND a."access" = 'USER'
                
                UNION
                
                SELECT u.id as user_id, a.id as assignment_id
                FROM "User" u
                INNER JOIN "TenantUser" tu ON tu."userId" = u.id AND tu."tenantId" = ${tenantId}
                INNER JOIN "AssignmentTenantRoleAccess" atra ON atra."tenantRoleId" = tu."tenantRoleId"
                INNER JOIN "Assignment" a ON a.id = atra."assignmentId" AND a."tenantId" = ${tenantId} AND a."access" = 'TENANT_ROLE'
            ) combined_access
            GROUP BY user_id
        ),
        user_submitted_assignment AS (
            -- Count submitted assignments per user
            SELECT 
                u.id as user_id,
                COUNT(DISTINCT aua."assignmentId") as total_submitted_assignment
            FROM "User" u
            INNER JOIN "TenantUser" tu ON tu."userId" = u.id AND tu."tenantId" = ${tenantId}
            INNER JOIN "AssignmentUserAttempt" aua ON aua."userId" = u.id AND aua."isSubmitted" = true
            INNER JOIN "Assignment" a ON a.id = aua."assignmentId" AND a."tenantId" = ${tenantId}
            GROUP BY u.id
        )
        SELECT
            u.id,
            u."fullName",
            u.email,
            u."phoneNumber",
            u."profilePictureUrl",
            u."createdAt",
            u."updatedAt",
            u.role,
            u.type,
			tr."identifier" as "tenantRoleIdentifier",
            COALESCE(uta.total_assignment, 0)::bigint as "totalAssignment",
            COALESCE(usa.total_submitted_assignment, 0)::bigint as "totalSubmittedAssignment"
        FROM "User" u
        INNER JOIN "TenantUser" tu ON tu."userId" = u.id AND tu."tenantId" = ${tenantId}
		INNER JOIN "TenantRole" tr ON tr."id" = tu."tenantRoleId"
        LEFT JOIN user_total_assignment uta ON uta.user_id = u.id
        LEFT JOIN user_submitted_assignment usa ON usa.user_id = u.id
        ORDER BY u."createdAt" DESC
    `
}

export async function getAssginmentWithUserSummaryByTenantId(tenantId: string) {
    return prisma.$queryRaw`
        WITH assignment_total_user AS (
            -- Combine both access types (using UNION to avoid duplicates)
            SELECT 
                assignment_id,
                COUNT(DISTINCT user_id) as total_user
            FROM (
                SELECT a.id as assignment_id, aua."userId" as user_id
                FROM "Assignment" a
                INNER JOIN "AssignmentUserAccess" aua ON aua."assignmentId" = a.id
                WHERE a."tenantId" = ${tenantId} AND a."access" = 'USER'
                
                UNION
                
                SELECT a.id as assignment_id, tu."userId" as user_id
                FROM "Assignment" a
                INNER JOIN "AssignmentTenantRoleAccess" atra ON atra."assignmentId" = a.id
                INNER JOIN "TenantUser" tu ON tu."tenantRoleId" = atra."tenantRoleId" AND tu."tenantId" = a."tenantId"
                WHERE a."tenantId" = ${tenantId} AND a."access" = 'TENANT_ROLE'
            ) combined_users
            GROUP BY assignment_id
        ),
        assignment_submitted_user_count AS (
            -- Count distinct users who submitted per assignment
            SELECT 
                a.id as assignment_id,
                COUNT(DISTINCT aua."userId") as total_user_submitted
            FROM "Assignment" a
            INNER JOIN "AssignmentUserAttempt" aua ON aua."assignmentId" = a.id AND aua."isSubmitted" = true
            WHERE a."tenantId" = ${tenantId}
            GROUP BY a.id
        )
        SELECT
            a.id,
            a.title,
            a."durationInMinutes",
            a.status,
            a."access",
            a."expiredDate",
            a."tenantId",
            a."createdAt",
            a."updatedAt",
            a."createdByUserId",
            COALESCE(atu.total_user, 0)::bigint as "totalUser",
            COALESCE(asu.total_user_submitted, 0)::bigint as "totalUserSubmitted"
        FROM "Assignment" a
        LEFT JOIN assignment_total_user atu ON atu.assignment_id = a.id
        LEFT JOIN assignment_submitted_user_count asu ON asu.assignment_id = a.id
        WHERE a."tenantId" = ${tenantId}
        ORDER BY a."createdAt" DESC
    `
}

export async function getAssignmentListByUserIdAndTenantIdAndTenantRoleId(
    userId: string,
    tenantId: string,
    tenantRoleId: string
) {
    // Get all assignments accessible by user
    return await prisma.assignment.findMany({
        where: {
            tenantId,
            OR: [
                // USER access: user is in AssignmentUserAccess
                {
                    access: AssignmentAccess.USER,
                    assignmentUserAccesses: {
                        some: {
                            userId,
                        },
                    },
                },
                // TENANT_ROLE access: user's role is in AssignmentTenantRoleAccess
                {
                    access: AssignmentAccess.TENANT_ROLE,
                    assignmentTenantRoleAccesses: {
                        some: {
                            tenantRoleId,
                        },
                    },
                },
            ],
        },
        include: {
            assignmentUserAttempts: {
                where: {
                    userId,
                    isSubmitted: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    })
}

export async function getDetailUserAssignmentByUserIdAndTenantId(
    userId: string,
    assignmentId: string
) {
    // Get all assignments accessible by user
    return await prisma.assignment.findUnique({
        where: {
            id: assignmentId,
        },
        include: {
            assignmentQuestions: {
                include: {
                    assignmentQuestionOptions: true,
                    assignmentQuestionEssayReferenceAnswer: true,
                    assignmentQuestionTrueFalseAnswer: true,
                },
                orderBy: {
                    order: "asc",
                },
            },
            assignmentUserAttempts: {
                where: {
                    userId,
                    isSubmitted: true,
                },
                include: {
                    assignmentUserAttemptQuestionAnswers: true,
                },
            },
        },
    })
}

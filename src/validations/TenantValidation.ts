import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import { TenantCreateUpdateDTO } from "$entities/Tenant"
import * as Helpers from "./helper"
import { TenantSchema } from "./schema/TenantSchema"
import { TenantUserUpdateDTO } from "$entities/TenantUser"
import { TenantUserUpdateSchema } from "./schema/TenantUserSchema"
import { prisma } from "$pkg/prisma"

export async function validateTenantSchema(c: Context, next: Next) {
    const data: TenantCreateUpdateDTO = await c.req.json()
    let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(TenantSchema, data)

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    if (data.headOfTenantUserId) {
        const headOfTenantUser = await prisma.user.findUnique({
            where: {
                id: data.headOfTenantUserId,
            },
        })
        if (!headOfTenantUser) {
            invalidFields.push({
                field: "headOfTenantUserId",
                message: "headOfTenantUser not found",
            })
        }
    }

    const operation = await prisma.operation.findUnique({
        where: {
            id: data.operationId,
        },
    })

    if (!operation) {
        invalidFields.push({
            field: "operationId",
            message: "operation not found",
        })
    }

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    await next()
}

export async function validateTenantUserUpdateSchema(c: Context, next: Next) {
    const data: TenantUserUpdateDTO[] = await c.req.json()
    let invalidFields: Helpers.ErrorStructure[] = []

    if (data.length === 0) {
        invalidFields.push(Helpers.generateErrorStructure("data", "Data is required"))
    }

    for (const tenantUser of data) {
        invalidFields.push(...Helpers.validateSchema(TenantUserUpdateSchema, tenantUser))
    }

    const seenUserIds = new Set<string>()
    for (const tenantUser of data) {
        if (seenUserIds.has(tenantUser.userId)) {
            invalidFields.push(
                Helpers.generateErrorStructure(
                    "userId",
                    `Duplicate User ID '${tenantUser.userId}' found`
                )
            )
        } else {
            seenUserIds.add(tenantUser.userId)
        }

        if (tenantUser.headOfOperationUserId) {
            const headOfOperationUser = await prisma.user.findUnique({
                where: {
                    id: tenantUser.headOfOperationUserId,
                },
            })
            if (!headOfOperationUser) {
                invalidFields.push(
                    Helpers.generateErrorStructure(
                        "headOfOperationUserId",
                        "headOfOperationUser not found"
                    )
                )
            }
        }

        if (tenantUser.teamLeaderUserId) {
            const teamLeaderUser = await prisma.user.findUnique({
                where: {
                    id: tenantUser.teamLeaderUserId,
                },
            })
            if (!teamLeaderUser) {
                invalidFields.push(
                    Helpers.generateErrorStructure("teamLeaderUserId", "teamLeaderUser not found")
                )
            }
        }

        if (tenantUser.supervisorUserId) {
            const supervisorUser = await prisma.user.findUnique({
                where: {
                    id: tenantUser.supervisorUserId,
                },
            })
            if (!supervisorUser) {
                invalidFields.push(
                    Helpers.generateErrorStructure("supervisorUserId", "supervisorUser not found")
                )
            }
        }

        if (tenantUser.managerUserId) {
            const managerUser = await prisma.user.findUnique({
                where: {
                    id: tenantUser.managerUserId,
                },
            })
            if (!managerUser) {
                invalidFields.push(
                    Helpers.generateErrorStructure("managerUserId", "managerUser not found")
                )
            }
        }
    }

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    await next()
}

export async function validateTenantUserCreateSchema(c: Context, next: Next) {
    const data: TenantUserUpdateDTO = await c.req.json()
    let invalidFields: Helpers.ErrorStructure[] = []

    invalidFields.push(...Helpers.validateSchema(TenantUserUpdateSchema, data))

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    const [tenantRole, user] = await Promise.all([
        prisma.tenantRole.findUnique({
            where: {
                id: data.tenantRoleId,
            },
        }),
        prisma.user.findUnique({
            where: {
                id: data.userId,
            },
        }),
    ])

    if (data.headOfOperationUserId) {
        const headOfOperationUser = await prisma.user.findUnique({
            where: {
                id: data.headOfOperationUserId,
            },
        })
        if (!headOfOperationUser) {
            invalidFields.push(
                Helpers.generateErrorStructure(
                    "headOfOperationUserId",
                    "headOfOperationUser not found"
                )
            )
        }
    }

    if (data.teamLeaderUserId) {
        const teamLeaderUser = await prisma.user.findUnique({
            where: {
                id: data.teamLeaderUserId,
            },
        })
        if (!teamLeaderUser) {
            invalidFields.push(
                Helpers.generateErrorStructure("teamLeaderUserId", "teamLeaderUser not found")
            )
        }
    }

    if (data.supervisorUserId) {
        const supervisorUser = await prisma.user.findUnique({
            where: {
                id: data.supervisorUserId,
            },
        })
        if (!supervisorUser) {
            invalidFields.push(
                Helpers.generateErrorStructure("supervisorUserId", "supervisorUser not found")
            )
        }
    }

    if (data.managerUserId) {
        const managerUser = await prisma.user.findUnique({
            where: {
                id: data.managerUserId,
            },
        })
        if (!managerUser) {
            invalidFields.push(
                Helpers.generateErrorStructure("managerUserId", "managerUser not found")
            )
        }
    }

    if (!tenantRole) {
        invalidFields.push(Helpers.generateErrorStructure("tenantRoleId", "tenantRole not found"))
    }

    if (!user) {
        invalidFields.push(Helpers.generateErrorStructure("userId", "user not found"))
    }

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    await next()
}

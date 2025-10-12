import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import { TenantDTO } from "$entities/Tenant"
import * as Helpers from "./helper"
import { TenantSchema } from "./schema/TenantSchema"
import { TenantUserUpdateDTO } from "$entities/TenantUser"
import { TenantUserUpdateSchema } from "./schema/TenantUserSchema"
import { prisma } from "$pkg/prisma"

export async function validateTenantSchema(c: Context, next: Next) {
    const data: TenantDTO = await c.req.json()
    let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(TenantSchema, data)

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    const operation = await prisma.operation.findUnique({
        where: {
            id: data.operationId,
        },
    })
    if (!operation) {
        invalidFields.push(Helpers.generateErrorStructure("operationId", "operation not found"))
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

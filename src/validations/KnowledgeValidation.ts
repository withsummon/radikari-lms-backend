import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import { KnowledgeApprovalDTO, KnowledgeDTO } from "$entities/Knowledge"
import { KnowlegeSchema } from "./schema/KnowlegeSchema"
import * as Helpers from "./helper"
import { prisma } from "$pkg/prisma"
import { KnowledgeApprovalSchema } from "./schema/KnowlegeSchema"

export async function validateKnowlegeSchema(c: Context, next: Next) {
    const data: KnowledgeDTO = await c.req.json()
    let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(KnowlegeSchema, data)

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    const tenantRoleExist = await prisma.tenantRole.findUnique({
        where: {
            id: data.tenantRoleId,
        },
    })

    if (!tenantRoleExist) {
        invalidFields.push(Helpers.generateErrorStructure("tenantRoleId", "tenantRoleId not found"))
    }

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    await next()
}

export async function validateKnowledgeApprovalSchema(c: Context, next: Next) {
    const data: KnowledgeApprovalDTO = await c.req.json()
    let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
        KnowledgeApprovalSchema,
        data
    )

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    await next()
}

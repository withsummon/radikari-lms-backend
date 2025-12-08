import { AccessControlListDTO } from "$entities/AccessControlList"
import { Context, Next } from "hono"
import { ErrorStructure } from "./helper"
import * as Helpers from "./helper"
import {
    AccessControlListCreateRoleSchema,
    AccessControlListUpdateAccessSchema,
} from "./schema/AccessControlListSchema"
import { response_bad_request } from "$utils/response.utils"
import { TenantRoleDTO } from "$entities/TenantRole"
import { prisma } from "$pkg/prisma"

export async function validateAccessControlListUpdateAccessSchema(c: Context, next: Next) {
    const data: AccessControlListDTO = await c.req.json()

    const invalidFields: ErrorStructure[] = Helpers.validateSchema(
        AccessControlListUpdateAccessSchema,
        data
    )

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    await next()
}

export async function validateAccessControlListCreateRoleSchema(c: Context, next: Next) {
    const data: TenantRoleDTO = await c.req.json()

    const invalidFields: ErrorStructure[] = Helpers.validateSchema(
        AccessControlListCreateRoleSchema,
        data
    )

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    const tenantRoleExist = await prisma.tenantRole.findUnique({
        where: {
            identifier: data.identifier,
        },
    })

    if (tenantRoleExist) {
        invalidFields.push({
            field: "identifier",
            message: "tenant role identifier already used",
        })
    }

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    await next()
}

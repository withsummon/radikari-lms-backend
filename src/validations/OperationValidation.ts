import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import { OperationDTO } from "$entities/Operation"
import { OperationSchema } from "./schema/OperationSchema"
import * as Helpers from "./helper"
import { prisma } from "$pkg/prisma"

export async function validateOperationSchema(c: Context, next: Next) {
    const data: OperationDTO = await c.req.json()
    let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(OperationSchema, data)

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    const headOfOperationUser = await prisma.user.findUnique({
        where: {
            id: data.headOfOperationUserId,
        },
    })

    if (!headOfOperationUser) {
        invalidFields.push({
            field: "headOfOperationUserId",
            message: "headOfOperationUser not found",
        })
    }

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    await next()
}

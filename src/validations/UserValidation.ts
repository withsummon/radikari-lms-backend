import { CreateUserDTO, UpdateUserDTO } from "$entities/User"
import { prisma } from "$pkg/prisma"
import { response_bad_request } from "$utils/response.utils"
import { Context, Next } from "hono"
import * as Helpers from "./helper"
import { ErrorStructure } from "./helper"
import { UserValidationCreateSchema, UserValidationUpdateSchema } from "./schema/UserSchema"

export async function validateCreateDTO(c: Context, next: Next) {
    const data: CreateUserDTO = await c.req.json()

    const invalidFields: ErrorStructure[] = Helpers.validateSchema(UserValidationCreateSchema, data)

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Bad Request", invalidFields)
    }

    const userExist = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    })

    if (userExist != null) {
        invalidFields.push({ field: "email", message: "email already used" })
    }
    if (invalidFields.length > 0) {
        return response_bad_request(c, "Bad Request", invalidFields)
    }

    await next()
}

export async function validateUpdateDTO(c: Context, next: Next) {
    const data: UpdateUserDTO = await c.req.json()
    const id = c.req.param("id")

    const invalidFields: ErrorStructure[] = Helpers.validateSchema(UserValidationUpdateSchema, data)

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Bad Request", invalidFields)
    }

    const userExist = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    })

    if (userExist != null && userExist.id !== id) {
        invalidFields.push({ field: "email", message: "email already used" })
    }
    if (invalidFields.length > 0) {
        return response_bad_request(c, "Bad Request", invalidFields)
    }

    await next()
}

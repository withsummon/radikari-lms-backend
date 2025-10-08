import { UserLoginDTO } from "$entities/User"
import { response_bad_request } from "$utils/response.utils"
import { Context, Next } from "hono"
import * as Helpers from "./helper"
import { ErrorStructure } from "./helper"
import { UserValidationLoginSchema } from "./schema/UserSchema"

export async function validateLoginDTO(c: Context, next: Next) {
    const data: UserLoginDTO = await c.req.json()

    const invalidFields: ErrorStructure[] = Helpers.validateSchema(UserValidationLoginSchema, data)
    if (invalidFields.length > 0) {
        return response_bad_request(c, "Bad Request", invalidFields)
    }

    await next()
}

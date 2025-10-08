import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import { TenantDTO } from "$entities/Tenant"
import * as Helpers from "./helper"
import { TenantSchema } from "./schema/TenantSchema"

export async function validateTenantSchema(c: Context, next: Next) {
    const data: TenantDTO = await c.req.json()
    let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(TenantSchema, data)

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    await next()
}

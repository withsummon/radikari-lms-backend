import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import { AiPromptDTO } from "$entities/AiPrompt"
import { AiPromptSchema } from "./schema/AiPromptSchema"
import * as Helpers from "./helper"

export async function validateAiPromptSchema(c: Context, next: Next) {
    const data: AiPromptDTO = await c.req.json()
    let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(AiPromptSchema, data)

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    await next()
}

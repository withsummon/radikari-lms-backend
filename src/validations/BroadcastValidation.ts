import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import { BroadcastDTO } from "$entities/Broadcast"
import { BroadcastSchema } from "./schema/BroadcastSchema"
import * as Helpers from "./helper"

export async function validateBroadcastSchema(c: Context, next: Next) {
	const data: BroadcastDTO = await c.req.json()
	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		BroadcastSchema,
		data,
	)

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	await next()
}

import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import { KnowledgeApprovalDTO, KnowledgeDTO } from "$entities/Knowledge"
import { KnowlegeSchema } from "./schema/KnowlegeSchema"
import * as Helpers from "./helper"
import { KnowledgeApprovalSchema } from "./schema/KnowlegeSchema"

export async function validateKnowlegeSchema(c: Context, next: Next) {
	const data: KnowledgeDTO = await c.req.json()
	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		KnowlegeSchema,
		data,
	)

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	await next()
}

export async function validateKnowledgeApprovalSchema(c: Context, next: Next) {
	const data: KnowledgeApprovalDTO = await c.req.json()
	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		KnowledgeApprovalSchema,
		data,
	)

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	await next()
}

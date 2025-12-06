import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import { MasterKnowledgeCaseDTO } from "$entities/MasterKnowledgeCase"
import { MasterKnowledgeCaseSchema } from "./schema/MasterKnowledgeCaseSchema"
import * as Helpers from "./helper"
import { prisma } from "$pkg/prisma"

export async function validateMasterKnowledgeCaseSchema(
	c: Context,
	next: Next,
) {
	const data: MasterKnowledgeCaseDTO = await c.req.json()
	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		MasterKnowledgeCaseSchema,
		data,
	)

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	const caseExist = await prisma.masterKnowledgeCase.findUnique({
		where: {
			name: data.name,
		},
	})

	if (caseExist) {
		invalidFields.push(
			Helpers.generateErrorStructure("name", "name already used"),
		)
	}

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	await next()
}

export async function validateUpdateMasterKnowledgeCaseSchema(
	c: Context,
	next: Next,
) {
	const data: MasterKnowledgeCaseDTO = await c.req.json()
	const id = c.req.param("id")
	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		MasterKnowledgeCaseSchema,
		data,
	)

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	const caseExist = await prisma.masterKnowledgeCase.findUnique({
		where: {
			name: data.name,
		},
	})

	if (caseExist && caseExist.id !== id) {
		invalidFields.push(
			Helpers.generateErrorStructure("name", "name already used"),
		)
	}

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	await next()
}

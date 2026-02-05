import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import {
	KnowledgeApprovalDTO,
	KnowledgeDTO,
	KnowledgeBulkCreateDTO,
} from "$entities/Knowledge"
import {
	KnowlegeSchema,
	KnowledgeBulkCreateSchema,
} from "./schema/KnowlegeSchema"
import * as Helpers from "./helper"
import { KnowledgeApprovalSchema } from "./schema/KnowlegeSchema"
import { KnowledgeAccess } from "../../generated/prisma/client"
import { prisma } from "$pkg/prisma"
import Logger from "$pkg/logger"

export async function validateKnowlegeSchema(c: Context, next: Next) {
	const data: KnowledgeDTO = await c.req.json()
	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		KnowlegeSchema,
		data,
	)

	if (invalidFields.length > 0) {
		Logger.warning("Validation Error Details:", {
			errors: invalidFields,
			data,
		})
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	if (data.access === KnowledgeAccess.EMAIL) {
		if (!data.emails || data.emails.length === 0) {
			return response_bad_request(c, "Validation Error", [
				{
					field: "emails",
					message: "Emails is required for access type email",
				},
			])
		}
	}

	if (data.parentId) {
		if (data.parentId === data.id) {
			return response_bad_request(c, "Validation Error", [
				{
					field: "parentId",
					message: "Parent ID cannot be the same as the knowledge ID",
				},
			])
		} else {
			const parent = await prisma.knowledge.findUnique({
				where: {
					id: data.parentId,
				},
			})
			if (!parent) {
				return response_bad_request(c, "Validation Error", [
					{ field: "parentId", message: "Parent not found" },
				])
			}
			if (parent.type !== data.type) {
				return response_bad_request(c, "Validation Error", [
					{
						field: "parentId",
						message: "Parent type is not the same as the knowledge type",
					},
				])
			}
		}
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

export async function validateBulkCreateKnowledgeSchema(
	c: Context,
	next: Next,
) {
	const data: KnowledgeBulkCreateDTO = await c.req.json()

	// Debug: Log the incoming type value
	Logger.info("Bulk Upload Validation Debug:", {
		type: data.type,
		typeIsValid: data.type === "CASE" || data.type === "ARTICLE",
		access: data.access,
		fileUrl: data.fileUrl,
	})

	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		KnowledgeBulkCreateSchema,
		data,
	)

	if (invalidFields.length > 0) {
		Logger.warning("Bulk Upload Validation Error Details:", {
			errors: invalidFields,
			data,
		})
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	if (data.access === KnowledgeAccess.EMAIL) {
		if (!data.emails || data.emails.length === 0) {
			return response_bad_request(c, "Validation Error", [
				{
					field: "emails",
					message: "Emails is required for access type email",
				},
			])
		}
	}

	await next()
}

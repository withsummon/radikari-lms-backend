import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import { MasterKnowledgeCategoryDTO } from "$entities/MasterKnowledgeCategory"
import { MasterKnowledgeCategorySchema } from "./schema/MasterKnowledgeCategory"
import * as Helpers from "./helper"
import { prisma } from "$pkg/prisma"

export async function validateMasterKnowledgeCategory(c: Context, next: Next) {
	const tenantId = c.req.param("tenantId")
	const data: MasterKnowledgeCategoryDTO = await c.req.json()

	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		MasterKnowledgeCategorySchema,
		data,
	)

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	const categoryExist = await prisma.masterKnowledgeCategory.findFirst({
		where: {
			name: data.name,
			tenantId: tenantId,
		},
	})

	if (categoryExist) {
		invalidFields.push({
			field: "name",
			message: "Category name already used in this tenant",
		})
	}

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	await next()
}

export async function validateUpdateMasterKnowledgeCategory(
	c: Context,
	next: Next,
) {
	const tenantId = c.req.param("tenantId") // ✅ Ambil context Tenant
	const data: MasterKnowledgeCategoryDTO = await c.req.json()
	const id = c.req.param("id")

	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		MasterKnowledgeCategorySchema,
		data,
	)

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	// ✅ Cek duplikat HANYA di tenant ini, exclude diri sendiri
	const categoryExist = await prisma.masterKnowledgeCategory.findFirst({
		where: {
			name: data.name,
			tenantId: tenantId,
		},
	})

	if (categoryExist && categoryExist.id !== id) {
		invalidFields.push({
			field: "name",
			message: "Category name already used in this tenant",
		})
	}

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	await next()
}

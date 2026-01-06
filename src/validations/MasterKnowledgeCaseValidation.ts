import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import { MasterKnowledgeCaseDTO } from "$entities/MasterKnowledgeCase"
import { MasterKnowledgeCaseSchema } from "./schema/MasterKnowledgeCaseSchema"
import * as Helpers from "./helper"
import { prisma } from "$pkg/prisma"

// ✅ Nama function disesuaikan dengan Router
export async function validateMasterKnowledgeCaseSchema(
	c: Context,
	next: Next,
) {
	const data: MasterKnowledgeCaseDTO = await c.req.json()

	// 1. Validasi Struktur
	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		MasterKnowledgeCaseSchema,
		data,
	)

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	// 2. Validasi Unik: Cek Nama di dalam Sub-Category yang sama
	const caseExist = await prisma.masterKnowledgeCase.findFirst({
		where: {
			name: data.name,
			subCategoryId: data.subCategoryId, // Scope: Per Parent
		},
	})

	if (caseExist) {
		invalidFields.push(
			Helpers.generateErrorStructure(
				"name",
				"name already used in this sub-category",
			),
		)
	}

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	await next()
}

// ✅ Nama function disesuaikan dengan Router
export async function validateUpdateMasterKnowledgeCaseSchema(
	c: Context,
	next: Next,
) {
	const data: MasterKnowledgeCaseDTO = await c.req.json()
	const id = c.req.param("id")

	// 1. Validasi Struktur
	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		MasterKnowledgeCaseSchema,
		data,
	)

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	// Ambil data lama untuk tahu subCategoryId-nya
	const currentData = await prisma.masterKnowledgeCase.findUnique({
		where: { id },
	})

	if (currentData) {
		// 2. Validasi Unik
		const caseExist = await prisma.masterKnowledgeCase.findFirst({
			where: {
				name: data.name,
				subCategoryId: currentData.subCategoryId, // Bandingkan di parent yang sama
			},
		})

		if (caseExist && caseExist.id !== id) {
			invalidFields.push(
				Helpers.generateErrorStructure(
					"name",
					"name already used in this sub-category",
				),
			)
		}
	}

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	await next()
}

import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import { MasterKnowledgeSubCategoryDTO } from "$entities/MasterKnowledgeSubCategory"
// Pastikan schema ini memvalidasi 'name' dan 'categoryId'
import { MasterKnowledgeSubCategorySchema } from "./schema/MasterKnowledgeSubCategory" // ini rusak
import * as Helpers from "./helper"
import { prisma } from "$pkg/prisma"

export async function validateMasterKnowledgeSubCategory(
	c: Context,
	next: Next,
) {
	const data: MasterKnowledgeSubCategoryDTO = await c.req.json()

	// 1. Validate Schema Structure
	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		MasterKnowledgeSubCategorySchema,
		data,
	)

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	// 2. Validate Duplicate Name in same Parent Category
	const exist = await prisma.masterKnowledgeSubCategory.findFirst({
		where: {
			name: data.name,
			categoryId: data.categoryId, // Scope unique per parent category
		},
	})

	if (exist) {
		invalidFields.push({
			field: "name",
			message: "Sub-category name already used in this category",
		})
	}

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	await next()
}

export async function validateUpdateMasterKnowledgeSubCategory(
	c: Context,
	next: Next,
) {
	const data: MasterKnowledgeSubCategoryDTO = await c.req.json()
	const id = c.req.param("id")

	// 1. Validate Schema Structure
	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		MasterKnowledgeSubCategorySchema,
		data,
	)

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	// Ambil data existing dulu untuk tau parent category-nya
	const currentData = await prisma.masterKnowledgeSubCategory.findUnique({
		where: { id },
	})

	if (currentData) {
		// 2. Validate Duplicate Name (hanya jika nama berubah)
		const exist = await prisma.masterKnowledgeSubCategory.findFirst({
			where: {
				name: data.name,
				categoryId: currentData.categoryId, // Gunakan parent yang sama
			},
		})

		if (exist && exist.id !== id) {
			invalidFields.push({
				field: "name",
				message: "Sub-category name already used in this category",
			})
		}
	}

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	await next()
}

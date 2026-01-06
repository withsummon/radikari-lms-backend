import { ulid } from "ulid"
import { PrismaClient } from "../../generated/prisma/client"

export async function seedMasterKnowledgeCategorySubCategoryAndCase(
	prisma: PrismaClient,
) {
	console.log("Seeding Master Knowledge Hierarchy...")

	// 1. Ambil semua data Knowledge yang ada (Source of Truth)
	// Pastikan hanya mengambil yang memiliki tenantId (karena schema baru wajib tenant)
	const knowledges = await prisma.knowledge.findMany({
		where: {
			tenantId: { not: null },
			category: { not: null }, // Kategori tidak boleh null
		},
		select: {
			tenantId: true,
			category: true,
			subCategory: true,
			case: true,
		},
	})

	console.log(`Found ${knowledges.length} knowledge items to process.`)

	// Cache untuk menghindari query berulang ke DB
	// Format Key: "tenantId:categoryName" -> Value: ID
	const categoryCache = new Map<string, string>()

	// Format Key: "categoryId:subCategoryName" -> Value: ID
	const subCategoryCache = new Map<string, string>()

	// Format Key: "subCategoryId:caseName" -> Value: ID
	const caseCache = new Map<string, string>()

	for (const item of knowledges) {
		if (!item.tenantId || !item.category) continue

		// ---------------------------------------------------------
		// LEVEL 1: MASTER CATEGORY
		// ---------------------------------------------------------
		const categoryKey = `${item.tenantId}:${item.category}`
		let categoryId = categoryCache.get(categoryKey)

		if (!categoryId) {
			// Cek di DB apakah sudah ada
			const existingCat = await prisma.masterKnowledgeCategory.findFirst({
				where: {
					tenantId: item.tenantId,
					name: item.category,
				},
			})

			if (existingCat) {
				categoryId = existingCat.id
			} else {
				// Create baru
				const newCat = await prisma.masterKnowledgeCategory.create({
					data: {
						id: ulid(),
						tenantId: item.tenantId,
						name: item.category,
					},
				})
				categoryId = newCat.id
			}
			// Simpan ke cache
			categoryCache.set(categoryKey, categoryId)
		}

		// ---------------------------------------------------------
		// LEVEL 2: MASTER SUB-CATEGORY
		// ---------------------------------------------------------
		// Hanya proses jika string subCategory ada
		if (item.subCategory && categoryId) {
			const subCategoryKey = `${categoryId}:${item.subCategory}`
			let subCategoryId = subCategoryCache.get(subCategoryKey)

			if (!subCategoryId) {
				const existingSub = await prisma.masterKnowledgeSubCategory.findFirst({
					where: {
						categoryId: categoryId, // Link ke Parent
						name: item.subCategory,
					},
				})

				if (existingSub) {
					subCategoryId = existingSub.id
				} else {
					const newSub = await prisma.masterKnowledgeSubCategory.create({
						data: {
							id: ulid(),
							tenantId: item.tenantId, // Direct relation
							categoryId: categoryId, // Relasi Parent
							name: item.subCategory,
						},
					})
					subCategoryId = newSub.id
				}
				subCategoryCache.set(subCategoryKey, subCategoryId)
			}

			// ---------------------------------------------------------
			// LEVEL 3: MASTER CASE
			// ---------------------------------------------------------
			// Hanya proses jika string case ada DAN subCategory parent-nya ada
			if (item.case && subCategoryId) {
				const caseKey = `${subCategoryId}:${item.case}`
				let caseId = caseCache.get(caseKey)

				if (!caseId) {
					const existingCase = await prisma.masterKnowledgeCase.findFirst({
						where: {
							subCategoryId: subCategoryId, // Link ke Parent
							name: item.case,
						},
					})

					if (!existingCase) {
						const newCase = await prisma.masterKnowledgeCase.create({
							data: {
								id: ulid(),
								tenantId: item.tenantId, // Direct relation
								subCategoryId: subCategoryId, // Relasi Parent
								name: item.case,
							},
						})
						caseId = newCase.id
					}
					// Kita tidak butuh ID case untuk step selanjutnya,
					// tapi tetap cache untuk menghindari duplikat insert di loop ini
					if (existingCase || caseId) {
						caseCache.set(caseKey, existingCase?.id || caseId!)
					}
				}
			}
		}
	}

	console.log("Seeding Master Knowledge Hierarchy completed.")
}

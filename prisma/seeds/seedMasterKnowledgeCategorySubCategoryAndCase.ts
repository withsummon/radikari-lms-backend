import { ulid } from "ulid"
import { Prisma, PrismaClient } from "../../generated/prisma/client"

export async function seedMasterKnowledgeCategorySubCategoryAndCase(
	prisma: PrismaClient,
) {
	const knowledges = await prisma.knowledge.findMany()
	const cases = knowledges
		.map((knowledge) => knowledge.case)
		.filter((c) => c !== null)
	const categories = knowledges
		.map((knowledge) => knowledge.category)
		.filter((c) => c !== null)
	const subCategories = knowledges
		.map((knowledge) => knowledge.subCategory)
		.filter((c) => c !== null)
	const uniqueCategories = [...new Set(categories)]
	const uniqueSubCategories = [...new Set(subCategories)]
	const uniqueCases = [...new Set(cases)]

	const categoryCreateManyInput: Prisma.MasterKnowledgeCategoryCreateManyInput[] =
		[]
	const subCategoryCreateManyInput: Prisma.MasterKnowledgeSubCategoryCreateManyInput[] =
		[]
	const caseCreateManyInput: Prisma.MasterKnowledgeCaseCreateManyInput[] = []

	for (const category of uniqueCategories) {
		const categoryExist = await prisma.masterKnowledgeCategory.findUnique({
			where: {
				name: category,
			},
		})
		if (!categoryExist) {
			categoryCreateManyInput.push({
				id: ulid(),
				name: category,
			})
		}
	}
	for (const subCategory of uniqueSubCategories) {
		const subCategoryExist = await prisma.masterKnowledgeSubCategory.findUnique(
			{
				where: {
					name: subCategory,
				},
			},
		)
		if (!subCategoryExist) {
			subCategoryCreateManyInput.push({
				id: ulid(),
				name: subCategory,
			})
		}
	}
	for (const item of uniqueCases) {
		const itemExist = await prisma.masterKnowledgeCase.findUnique({
			where: {
				name: item,
			},
		})
		if (!itemExist) {
			caseCreateManyInput.push({
				id: ulid(),
				name: item,
			})
		}
	}

	if (categoryCreateManyInput.length > 0) {
		await prisma.masterKnowledgeCategory.createMany({
			data: categoryCreateManyInput,
		})
	}
	if (subCategoryCreateManyInput.length > 0) {
		await prisma.masterKnowledgeSubCategory.createMany({
			data: subCategoryCreateManyInput,
		})
	}
	if (caseCreateManyInput.length > 0) {
		await prisma.masterKnowledgeCase.createMany({
			data: caseCreateManyInput,
		})
	}
}

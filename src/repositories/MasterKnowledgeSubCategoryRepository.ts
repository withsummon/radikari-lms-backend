import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { MasterKnowledgeSubCategoryDTO } from "$entities/MasterKnowledgeSubCategory"

export async function create(data: MasterKnowledgeSubCategoryDTO) {
	return await prisma.masterKnowledgeSubCategory.create({
		data,
	})
}

export async function getAll(filters: EzFilter.FilteringQuery) {
	const queryBuilder = new EzFilter.BuildQueryFilter()
	const usedFilters = queryBuilder.build(filters)

	const [masterKnowledgeSubCategory, totalData] = await Promise.all([
		prisma.masterKnowledgeSubCategory.findMany(usedFilters.query as any),
		prisma.masterKnowledgeSubCategory.count({
			where: usedFilters.query.where,
		}),
	])

	let totalPage = 1
	if (totalData > usedFilters.query.take)
		totalPage = Math.ceil(totalData / usedFilters.query.take)

	return {
		entries: masterKnowledgeSubCategory,
		totalData,
		totalPage,
	}
}

export async function getById(id: string) {
	return await prisma.masterKnowledgeSubCategory.findUnique({
		where: {
			id,
		},
	})
}

export async function update(id: string, data: MasterKnowledgeSubCategoryDTO) {
	return await prisma.masterKnowledgeSubCategory.update({
		where: {
			id,
		},
		data,
	})
}

export async function deleteById(id: string) {
	return await prisma.masterKnowledgeSubCategory.delete({
		where: {
			id,
		},
	})
}

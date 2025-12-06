import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { MasterKnowledgeCaseDTO } from "$entities/MasterKnowledgeCase"

export async function create(data: MasterKnowledgeCaseDTO) {
	return await prisma.masterKnowledgeCase.create({
		data,
	})
}

export async function getAll(filters: EzFilter.FilteringQuery) {
	const queryBuilder = new EzFilter.BuildQueryFilter()
	const usedFilters = queryBuilder.build(filters)

	const [masterKnowledgeCase, totalData] = await Promise.all([
		prisma.masterKnowledgeCase.findMany(usedFilters.query as any),
		prisma.masterKnowledgeCase.count({
			where: usedFilters.query.where,
		}),
	])

	let totalPage = 1
	if (totalData > usedFilters.query.take)
		totalPage = Math.ceil(totalData / usedFilters.query.take)

	return {
		entries: masterKnowledgeCase,
		totalData,
		totalPage,
	}
}

export async function getById(id: string) {
	return await prisma.masterKnowledgeCase.findUnique({
		where: {
			id,
		},
	})
}

export async function update(id: string, data: MasterKnowledgeCaseDTO) {
	return await prisma.masterKnowledgeCase.update({
		where: {
			id,
		},
		data,
	})
}

export async function deleteById(id: string) {
	return await prisma.masterKnowledgeCase.delete({
		where: {
			id,
		},
	})
}

import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { OperationDTO } from "$entities/Operation"

export async function create(data: OperationDTO) {
	return await prisma.operation.create({
		data,
	})
}

export async function getAll(filters: EzFilter.FilteringQuery) {
	const queryBuilder = new EzFilter.BuildQueryFilter()
	const usedFilters = queryBuilder.build(filters)

	const [operation, totalData] = await Promise.all([
		prisma.operation.findMany(usedFilters.query as any),
		prisma.operation.count({
			where: usedFilters.query.where,
		}),
	])

	let totalPage = 1
	if (totalData > usedFilters.query.take)
		totalPage = Math.ceil(totalData / usedFilters.query.take)

	return {
		entries: operation,
		totalData,
		totalPage,
	}
}

export async function getById(id: string) {
	return await prisma.operation.findUnique({
		where: {
			id,
		},
		include: {
			headOfOperationUser: {
				select: {
					id: true,
					fullName: true,
					email: true,
				},
			},
			tenant: true,
		},
	})
}

export async function update(id: string, data: OperationDTO) {
	return await prisma.operation.update({
		where: {
			id,
		},
		data,
	})
}

export async function deleteById(id: string) {
	return await prisma.operation.delete({
		where: {
			id,
		},
	})
}

export async function findFirst() {
	return await prisma.operation.findFirst()
}

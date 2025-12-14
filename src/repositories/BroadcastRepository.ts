import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { BroadcastDTO } from "$entities/Broadcast"
import { ulid } from "ulid"

export async function create(data: BroadcastDTO) {
	return await prisma.broadcast.create({
		data,
	})
}

export async function getByTenantId(tenantId: string) {
	return await prisma.broadcast.findUnique({
		where: {
			tenantId,
		},
		include: {
			createdByUser: {
				select: {
					id: true,
					fullName: true,
				},
			},
			updatedByUser: {
				select: {
					id: true,
					fullName: true,
				},
			},
		},
	})
}

export async function getAll(filters: EzFilter.FilteringQuery) {
	const queryBuilder = new EzFilter.BuildQueryFilter()
	const usedFilters = queryBuilder.build(filters)

	const [broadcast, totalData] = await Promise.all([
		prisma.broadcast.findMany(usedFilters.query as any),
		prisma.broadcast.count({
			where: usedFilters.query.where,
		}),
	])

	let totalPage = 1
	if (totalData > usedFilters.query.take)
		totalPage = Math.ceil(totalData / usedFilters.query.take)

	return {
		entries: broadcast,
		totalData,
		totalPage,
	}
}

export async function getById(id: string) {
	return await prisma.broadcast.findUnique({
		where: {
			id,
		},
	})
}

export async function upsertByTenantId(tenantId: string, data: BroadcastDTO) {
	return await prisma.broadcast.upsert({
		where: {
			tenantId,
		},
		update: {
			content: data.content,
			updatedByUserId: data.updatedByUserId,
		},
		create: {
			id: ulid(),
			tenantId,
			content: data.content,
			createdByUserId: data.createdByUserId,
			updatedByUserId: data.updatedByUserId,
		},
	})
}

export async function deleteById(id: string) {
	return await prisma.broadcast.delete({
		where: {
			id,
		},
	})
}

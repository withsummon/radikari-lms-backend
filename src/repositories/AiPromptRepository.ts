import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { AiPromptDTO } from "$entities/AiPrompt"
import { ulid } from "ulid"

export async function create(data: AiPromptDTO) {
  return await prisma.aiPrompt.create({
    data: {
      id: ulid(),
      tenantId: data.tenantId!,
      prompt: data.prompt,
      createdByUserId: data.createdByUserId,
      updatedByUserId: data.updatedByUserId,
    },
  })
}


export async function getByTenantId(tenantId: string) {
	return await prisma.aiPrompt.findUnique({
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

	const [aiPrompt, totalData] = await Promise.all([
		prisma.aiPrompt.findMany(usedFilters.query as any),
		prisma.aiPrompt.count({
			where: usedFilters.query.where,
		}),
	])

	let totalPage = 1
	if (totalData > usedFilters.query.take)
		totalPage = Math.ceil(totalData / usedFilters.query.take)

	return {
		entries: aiPrompt,
		totalData,
		totalPage,
	}
}

export async function getById(id: string) {
	return await prisma.aiPrompt.findUnique({
		where: {
			id,
		},
	})
}

export async function upsertByTenantId(tenantId: string, data: AiPromptDTO) {
	return await prisma.aiPrompt.upsert({
		where: {
			tenantId,
		},
		update: {
			prompt: data.prompt,
			updatedByUserId: data.updatedByUserId,
		},
		create: {
			id: ulid(),
			tenantId,
			prompt: data.prompt,
			createdByUserId: data.createdByUserId,
			updatedByUserId: data.updatedByUserId,
		},
	})
}

export async function deleteById(id: string) {
	return await prisma.aiPrompt.delete({
		where: {
			id,
		},
	})
}

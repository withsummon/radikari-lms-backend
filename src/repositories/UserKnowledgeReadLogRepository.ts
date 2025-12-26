import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { ulid } from "ulid"
import { KnowledgeReadStatus } from "../../generated/prisma/client"

export async function getAllByTenant(
	tenantId: string,
	filters: EzFilter.FilteringQuery,
) {
	const queryBuilder = new EzFilter.BuildQueryFilter()
	const usedFilters = queryBuilder.build(filters)

	usedFilters.query.where = {
		...(usedFilters.query.where ?? {}),
		knowledge: {
			...(usedFilters.query.where?.knowledge ?? {}),
			tenantId,
		},
	}

	usedFilters.query.include = {
		user: {
			select: { id: true, fullName: true, email: true },
		},
		knowledge: {
			select: {
				id: true,
				headline: true,
				type: true,
				access: true,
				status: true,
				createdAt: true,
				tenantId: true,
			},
		},
	}

	usedFilters.query.orderBy = { lastViewedAt: "desc" }

	const take = usedFilters.query.take
		? Number(usedFilters.query.take)
		: undefined
	const skip = usedFilters.query.skip
		? Number(usedFilters.query.skip)
		: undefined

	const [entries, totalData] = await Promise.all([
		prisma.userKnowledgeReadLog.findMany({
			...(usedFilters.query as any),
			take,
			skip,
		}),
		prisma.userKnowledgeReadLog.count({ where: usedFilters.query.where }),
	])

	const safeTake = take ?? 0
	const totalPage = safeTake > 0 ? Math.ceil(totalData / safeTake) : 1

	return { entries, totalData, totalPage }
}

export async function getByUserAndKnowledge(
	userId: string,
	knowledgeId: string,
) {
	return prisma.userKnowledgeReadLog.findUnique({
		where: { knowledgeId_userId: { knowledgeId, userId } },
		include: {
			user: { select: { id: true, fullName: true, email: true } },
			knowledge: { select: { id: true, headline: true, type: true } },
		},
	})
}

export async function upsertView(userId: string, knowledgeId: string) {
	const now = new Date()

	return prisma.userKnowledgeReadLog.upsert({
		where: { knowledgeId_userId: { knowledgeId, userId } },
		create: {
			id: ulid(),
			userId,
			knowledgeId,
			status: KnowledgeReadStatus.VIEWED,
			firstViewedAt: now,
			lastViewedAt: now,
			viewCount: 1,
		},
		update: {
			status: KnowledgeReadStatus.VIEWED,
			lastViewedAt: now,
			viewCount: { increment: 1 },
		},
	})
}

export async function markNotViewed(userId: string, knowledgeId: string) {
	return prisma.userKnowledgeReadLog.update({
		where: { knowledgeId_userId: { knowledgeId, userId } },
		data: { status: KnowledgeReadStatus.NOT_VIEWED },
	})
}

export async function deleteByUserAndKnowledge(
	userId: string,
	knowledgeId: string,
) {
	return prisma.userKnowledgeReadLog.delete({
		where: { knowledgeId_userId: { knowledgeId, userId } },
	})
}

import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { ulid } from "ulid"
import { KnowledgeReadStatus } from "../../generated/prisma/client"

export async function getAll(filters: EzFilter.FilteringQuery) {
  const queryBuilder = new EzFilter.BuildQueryFilter()
  const usedFilters = queryBuilder.build(filters)

  usedFilters.query.include = {
    user: {
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    },
    knowledge: {
      select: {
        id: true,
        headline: true,
        type: true,
        access: true,
        status: true,
        createdAt: true,
      },
    },
  }

  usedFilters.query.orderBy = {
    lastViewedAt: "desc",
  }

  const [entries, totalData] = await Promise.all([
    prisma.userKnowledgeReadLog.findMany(usedFilters.query as any),
    prisma.userKnowledgeReadLog.count({
      where: usedFilters.query.where,
    }),
  ])

  let totalPage = 1
  if (totalData > (usedFilters.query.take ?? 0))
    totalPage = Math.ceil(totalData / usedFilters.query.take)

  return {
    entries,
    totalData,
    totalPage,
  }
}

export async function getByUserAndKnowledge(userId: string, knowledgeId: string) {
  return prisma.userKnowledgeReadLog.findUnique({
    where: {
      knowledgeId_userId: { knowledgeId, userId },
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      knowledge: { select: { id: true, headline: true, type: true } },
    },
  })
}

export async function upsertView(userId: string, knowledgeId: string) {
  const now = new Date()

  return prisma.userKnowledgeReadLog.upsert({
    where: {
      knowledgeId_userId: { knowledgeId, userId },
    },
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
    where: {
      knowledgeId_userId: { knowledgeId, userId },
    },
    data: {
      status: KnowledgeReadStatus.NOT_VIEWED,
    },
  })
}

export async function deleteByUserAndKnowledge(userId: string, knowledgeId: string) {
  return prisma.userKnowledgeReadLog.delete({
    where: {
      knowledgeId_userId: { knowledgeId, userId },
    },
  })
}

import { AiChatRoomMessageDTO } from "$entities/AiChatRoomMessage"
import { prisma } from "$pkg/prisma"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import { Prisma } from "../../generated/prisma/client"
import { ulid } from "ulid"

export async function create(
	data: AiChatRoomMessageDTO,
	tx?: Prisma.TransactionClient,
) {
	console.log(data)
	const prismaClient = tx || prisma
	const { aiChatRoomMessageKnowledge, ...rest } = data
	const aiChatRoomMessage = await prismaClient.aiChatRoomMessage.create({
		data: rest,
	})

	if (aiChatRoomMessageKnowledge && aiChatRoomMessageKnowledge.length > 0) {
		await prismaClient.aiChatRoomMessageKnowledge.createMany({
			data: aiChatRoomMessageKnowledge.map((knowledge) => ({
				id: ulid(),
				aiChatRoomMessageId: aiChatRoomMessage.id,
				knowledgeId: knowledge.knowledgeId,
			})),
		})
	}

	return aiChatRoomMessage
}

export async function getAll(
	filters: EzFilter.FilteringQuery,
	aiChatRoomId: string,
) {
	const queryBuilder = new EzFilter.BuildQueryFilter()
	const usedFilters = queryBuilder.build(filters)

	usedFilters.query.where.AND.push({
		aiChatRoomId,
	})

	usedFilters.query.include = {
		aiChatRoomMessageKnowledge: {
			include: {
				knowledge: true,
			},
		},
	}

	const [aiChatRoomMessage, totalData] = await Promise.all([
		prisma.aiChatRoomMessage.findMany(usedFilters.query as any),
		prisma.aiChatRoomMessage.count({
			where: usedFilters.query.where,
		}),
	])

	let totalPage = 1
	if (totalData > usedFilters.query.take)
		totalPage = Math.ceil(totalData / usedFilters.query.take)

	return {
		entries: aiChatRoomMessage,
		totalData,
		totalPage,
	}
}

export async function getLatestChatRoomHistory(aiChatRoomId: string) {
	return await prisma.aiChatRoomMessage.findMany({
		where: {
			aiChatRoomId,
		},
		include: {
			aiChatRoomMessageKnowledge: {
				include: {
					knowledge: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		take: 20,
	})
}

export async function getById(id: string, tx?: Prisma.TransactionClient) {
	const prismaClient = tx || prisma
	return await prismaClient.aiChatRoomMessage.findUnique({
		where: {
			id,
		},
	})
}

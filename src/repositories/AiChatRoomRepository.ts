import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { AiChatRoomDTO } from "$entities/AiChatRoom"
import {
	AiChatRoomMessageCreateDTO,
	AiClientChatRoomMessageRequestBody,
	UserTenantDTO,
} from "$entities/AiChatRoomMessage"
import { UserJWTDAO } from "$entities/User"
import axios from "axios"
import {
	AiChatRoomMessage,
	AiChatRoomMessageKnowledge,
} from "../../generated/prisma/client"

export async function create(data: AiChatRoomDTO) {
	return await prisma.aiChatRoom.create({
		data,
	})
}

export async function getAll(
	filters: EzFilter.FilteringQuery,
	userId: string,
	tenantId: string,
) {
	const queryBuilder = new EzFilter.BuildQueryFilter()
	const usedFilters = queryBuilder.build(filters)

	usedFilters.query.where.AND.push({
		userId,
		tenantId,
	})

	const [aiChatRoom, totalData] = await Promise.all([
		prisma.aiChatRoom.findMany(usedFilters.query as any),
		prisma.aiChatRoom.count({
			where: usedFilters.query.where,
		}),
	])

	let totalPage = 1
	if (totalData > usedFilters.query.take)
		totalPage = Math.ceil(totalData / usedFilters.query.take)

	return {
		entries: aiChatRoom,
		totalData,
		totalPage,
	}
}

export async function getByIdAndUserId(id: string, userId: string) {
	return await prisma.aiChatRoom.findUnique({
		where: {
			id,
			userId,
		},
		include: {
			tenant: true,
		},
	})
}

export async function update(id: string, data: AiChatRoomDTO) {
	return await prisma.aiChatRoom.update({
		where: {
			id,
		},
		data: {
			title: data.title,
		},
	})
}

export async function deleteById(id: string) {
	return await prisma.aiChatRoom.delete({
		where: {
			id,
		},
	})
}

export async function streamMessage(data: AiClientChatRoomMessageRequestBody) {
	try {
		console.log("Stream Message to API Assistant Chat ........")
		console.log("AI_API_URL:", process.env.AI_API_URL)
		console.log("Is HTTPS:", process.env.AI_API_URL?.startsWith("https://"))
		console.log("Data:", data)

		const fullUrl = `${process.env.AI_API_URL}/chat/stream-sse`
		console.log("Full URL:", fullUrl)

		const response = await axios.post(fullUrl, JSON.stringify(data), {
			headers: {
				"Content-Type": "application/json",
			},
			responseType: "stream",
			timeout: 30000, // 30 seconds timeout
		})

		return response
	} catch (error) {
		if (axios.isAxiosError(error)) {
			console.error("Axios error details:", {
				message: error.message,
				code: error.code,
				status: error.response?.status,
				statusText: error.response?.statusText,
				body: error.toJSON(),
			})
		}
		throw new Error("Failed to stream message")
	}
}

export async function buildRequestBody(
	payload: AiChatRoomMessageCreateDTO,
	chatHistory: (AiChatRoomMessage & {
		aiChatRoomMessageKnowledge: AiChatRoomMessageKnowledge[]
	})[],
	user: UserJWTDAO,
): Promise<AiClientChatRoomMessageRequestBody> {
	const userTenant = await prisma.tenantUser.findMany({
		where: {
			userId: user.id,
		},
		include: {
			tenantRole: true,
			tenant: true,
		},
	})

	if (!userTenant || userTenant.length === 0) {
		throw new Error("User tenant not found")
	}

	const operationIds = userTenant.map((data) => data.tenant.operationId)
	const userTenantPayload: UserTenantDTO[] = userTenant.map((data) => ({
		tenantId: data.tenant.id,
		tenantRole: data.tenantRole.id,
	}))
	return {
		chatHistory: chatHistory.map((data) => ({
			role: data.sender.toLocaleLowerCase(),
			content: data.message,
			timestamp: data.createdAt.toISOString(),
			knowledgeIds: data.aiChatRoomMessageKnowledge.map(
				(knowledge) => knowledge.knowledgeId,
			),
		})),
		// chatHistory: [],
		message: payload.question,
		userAttributes: {
			userId: user.id,
			operationIds,
			userTenants: userTenantPayload,
		},
	}
}

export async function archiveOrUnarchiveAiChatRoom(
	id: string,
	userId: string,
	isArchived: boolean,
) {
	return await prisma.aiChatRoom.update({
		where: {
			id,
			userId,
		},
		data: {
			isArchived: !isArchived,
		},
	})
}

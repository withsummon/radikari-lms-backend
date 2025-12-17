import { ModelMessage } from "ai"
import { prisma } from "$pkg/prisma"
import { ulid } from "ulid"
import { AiChatRoomMessageSender } from "../../../generated/prisma/client"
import Logger from "$pkg/logger"
import { executeHybridChatCore } from "./HybridChatCore"

interface HybridChatRequest {
	messages: ModelMessage[]
	chatRoomId: string
	tenantId: string
	userId: string
}

/**
 * Persistent RAG runner with identity and DB persistence
 * Wraps HybridChatCore and adds persistence on finish
 */
export async function streamHybridChat({
	messages,
	chatRoomId,
	tenantId,
	userId,
}: HybridChatRequest) {
	Logger.info("HybridChatService.streamHybridChat", {
		chatRoomId,
		tenantId,
		userId,
		messageCount: messages.length,
	})

	const lastMessage = messages[messages.length - 1]

	return executeHybridChatCore({
		messages,
		tenantId,
		onFinish: async ({ text, usage }) => {
			Logger.info("HybridChatService.streamHybridChat.onFinish", {
				chatRoomId,
				responseLength: text.length,
				usage,
			})

			try {
				// Persist to DB
				// 1. Save User Message
				if (lastMessage && lastMessage.role === "user" && lastMessage.content) {
					await prisma.aiChatRoomMessage.create({
						data: {
							id: ulid(),
							aiChatRoomId: chatRoomId,
							sender: AiChatRoomMessageSender.USER,
							message: lastMessage.content as string,
							htmlFormattedMessage: lastMessage.content as string,
						},
					})
				}

				// 2. Save Assistant Response
				const assistantMessage = await prisma.aiChatRoomMessage.create({
					data: {
						id: ulid(),
						aiChatRoomId: chatRoomId,
						sender: AiChatRoomMessageSender.ASSISTANT,
						message: text,
						htmlFormattedMessage: text,
					},
				})

				// 3. Log Token Usage
				if (usage) {
					const usageData = usage as {
						inputTokens?: number
						outputTokens?: number
						totalTokens?: number
					}
					await prisma.aiUsageLog.create({
						data: {
							id: ulid(),
							tenantId,
							userId,
							aiChatRoomMessageId: assistantMessage.id,
							action: "CHAT",
							model: "gpt-4.1-mini",
							promptTokens: usageData.inputTokens || 0,
							completionTokens: usageData.outputTokens || 0,
							totalTokens: usageData.totalTokens || 0,
						},
					})
				}

				Logger.info("HybridChatService.streamHybridChat.onFinish", {
					message: "Successfully saved messages to database.",
				})
			} catch (error) {
				Logger.error("HybridChatService.streamHybridChat.onFinish", {
					error: "Failed to save messages to database",
					details: error,
				})
			}
		},
	})
}

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

				console.log("Context Parts:", contextParts)


				// 6. Stream Text
				const systemMessage = `
You are the Radikari Knowledge Assistant. Your role is to help users understand and apply information from Radikari documentation and contextual materials.

LANGUAGE:
- Respond using the same language the user uses.
- If the user mixes Indonesian and English, respond in Indonesian unless the content requires specific untranslated terminology.
- Do not translate unless the user explicitly requests.

ANSWERING STYLE (STRICT ORDER):
1. Start with the most direct answer to the user's question in 1–3 concise sentences based only on the provided context.
2. After answering, expand with additional relevant information from the retrieved context — including rules, requirements, limitations, timelines, definitions, steps, or related functionality that would logically matter to the user based on their question.
3. If the retrieved documents contain structured elements (steps, rules, benefits, lists, timelines), present them cleanly in bullet points or numbered format.
4. The tone must remain informative, neutral, and fluent — never overly formal, robotic, or conversational.

INFERENCE RULES:
- You may infer meaning ONLY if the inference is clearly supported by the retrieved context.
- You may connect fragmented pieces of related information to present a clearer, unified explanation.
- You may NOT add new facts, assumptions, or external knowledge not present in the retrieved sources.

REFUSAL RULE:
- If the requested information cannot be answered or reasonably inferred from the provided context, respond:
  - English: "The available documents do not fully answer this question, but here is what is relevant from the context."
  - Indonesian: "Dokumen yang tersedia tidak sepenuhnya menjawab pertanyaan ini, namun berikut informasi yang relevan dari konteks."

FORMATTING:
- Avoid greetings, apologies, and generic assistant phrasing.
- Keep responses functional, readable, and consistent.

Context:
${contextParts.join("\n\n")}`

				const result = streamText({
					model: openai("gpt-4.1-mini"),
					messages: [{ role: "system", content: systemMessage }, ...messages],
					async onFinish({ text, usage }) {
						Logger.info("HybridChatService.streamHybridChat.onFinish", {
							chatRoomId,
							responseLength: text.length,
							usage,
						})

						try {
							// Persist to DB
							// 1. Save User Message
							if (
								lastMessage &&
								lastMessage.role === "user" &&
								lastMessage.content
							) {
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
							const aiMessage = await prisma.aiChatRoomMessage.create({
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
								const usageData = usage as any
								await prisma.aiUsageLog.create({
									data: {
										id: ulid(),
										tenantId,
										userId,
										aiChatRoomMessageId: aiMessage.id,
										action: "CHAT",
										model: "gpt-4.1-mini",
										promptTokens: usageData.inputTokens || 0,
										completionTokens: usageData.outputTokens || 0,
										totalTokens: usageData.totalTokens || 0,
									},
								})
							}

							Logger.info("HybridChatService.streamHybridChat.onFinish", {
								message:
									"Successfully saved messages and usage logs to database.",
							})
						} catch (error) {
							Logger.error("HybridChatService.streamHybridChat.onFinish", {
								error: "Failed to save messages to database",
								details: error,
							})
						}
					},
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

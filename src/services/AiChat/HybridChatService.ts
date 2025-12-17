import {
	createUIMessageStream,
	createUIMessageStreamResponse,
	streamText,
	generateText,
	embed,
	ModelMessage,
} from "ai"
import { openai } from "@ai-sdk/openai"
import { qdrantClient } from "$pkg/qdrant"
import { prisma } from "$pkg/prisma"
import { ulid } from "ulid"
import { AiChatRoomMessageSender } from "../../../generated/prisma/client"
import Logger from "$pkg/logger"
import { getById } from "$repositories/KnowledgeRepository"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { checkTokenLimit } from "$services/Tenant/TenantLimitService"

const google = createGoogleGenerativeAI({
	apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
})

interface HybridChatRequest {
	messages: ModelMessage[]
	chatRoomId: string
	tenantId: string
	userId: string
}

type SourceData = {
	knowledgeId: string
	headline: string
	content?: string
}

// Helper for L2 Normalization
function normalizeVector(vector: number[]): number[] {
	const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
	if (magnitude === 0) return vector
	return vector.map((val) => val / magnitude)
}

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

	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			try {
				// 0. Check Token Limit
				// 0. Check Token Limit
				const limitStatus = await checkTokenLimit(tenantId)
				if (!limitStatus.allowed) {
					throw new Error(
						limitStatus.errorMessage || "Monthly token limit exceeded.",
					)
				}

				// 1. Query Contextualization
				const lastMessage = messages[messages.length - 1]

				const { text: contextualizedQuery } = await generateText({
					model: openai("gpt-4.1-mini"),
					messages: [
						{
							role: "system",
							content: `Given the following conversation history and the latest user message, rephrase the latest message into a standalone search query. If the message is already standalone, return it as is. Do NOT answer the question.`,
						},
						...messages,
					],
				})

				// 2. Embed
				const { embedding } = await embed({
					model: google.textEmbedding("gemini-embedding-001"),
					value: contextualizedQuery,
					providerOptions: {
						google: {
							outputDimensionality: 768,
							taskType: "RETRIEVAL_QUERY",
						},
					},
				})

				// 3. L2 Normalize
				const normalizedEmbedding = normalizeVector(embedding)

				// 4. Retrieve
				const searchResult = await qdrantClient.search("radikari_knowledge", {
					vector: normalizedEmbedding,
					// filter: {
					// 	must: [{ key: "tenantId", match: { value: tenantId } }],
					// },
					limit: 15,
					score_threshold: 0.5,
				})

				// 5. Filter out duplicate results by headline
				const uniqueResults: typeof searchResult = []
				const seenHeadlines = new Set<string>()
				for (const item of searchResult) {
					const headline = (item.payload as any)?.headline
					if (headline && !seenHeadlines.has(headline)) {
						seenHeadlines.add(headline)
						uniqueResults.push(item)
					}
				}

				// 6. Send unique sources to the client for display (up to 10)
				const resultsForClient = uniqueResults.slice(0, 10)
				for (const item of resultsForClient) {
					const payload = item.payload as any
					if (!payload) continue

					const sourceData: SourceData = {
						knowledgeId: payload.knowledge_id,
						headline: payload.headline || "Untitled",
						content: payload.content,
					}

					writer.write({
						type: "data-source",
						data: sourceData,
					} as any)
				}

				// 7. Build enriched context for the AI using only the top 3 unique results
				const topThreeResults = uniqueResults.slice(0, 3)

				const contextParts: string[] = []

				// Process each result to include both embedding retrieval content and full knowledge context
				for (const result of topThreeResults) {
					const payload = result.payload as any
					if (!payload?.knowledge_id) continue

					const knowledgeId = payload.knowledge_id
					const retrievalContent = payload.content // Content from embedding retrievalW
					const score = result.score

					try {
						// Fetch full knowledge context from database
						const fullKnowledge = await getById(knowledgeId)

						if (!fullKnowledge) continue

						// Build context part with both retrieval result and full context
						let contextPart = `[${fullKnowledge.headline}] (Relevance Score: ${
							score?.toFixed(3) || "N/A"
						})\n`

						// Include the specific content that was retrieved via embedding
						if (retrievalContent) {
							contextPart += `Retrieved Content: ${retrievalContent}\n\n`
						}

						// Include full knowledge context for comprehensive understanding
						contextPart += `Full Article Context:\n`
						if (fullKnowledge.headline) {
							contextPart += `Headline: ${fullKnowledge.headline}\n`
						}

						if (
							fullKnowledge.knowledgeContent &&
							fullKnowledge.knowledgeContent.length > 0
						) {
							contextPart += fullKnowledge.knowledgeContent
								.map((content) => `• ${content.title}: ${content.description}`)
								.join("\n")
						}

						contextParts.push(contextPart)
					} catch (error) {
						Logger.error("HybridChatService.buildContext", {
							message: `Failed to build context for knowledge ID: ${knowledgeId}`,
							error,
						})
					}
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

				console.log(systemMessage)

				// Merge the text stream into the UI message stream
				writer.merge(result.toUIMessageStream())
			} catch (error) {
				Logger.error("HybridChatService.streamHybridChat.error", { error })
				writer.write({
					type: "error",
					errorText: error instanceof Error ? error.message : String(error),
				})
			}
		},
	})

	return createUIMessageStreamResponse({ stream })
}

import {
    HandleServiceResponseCustomError,
    HandleServiceResponseSuccess,
    ResponseStatus,
    ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"
import * as AiChatRoomRepository from "$repositories/AiChatRoomRepository"
import * as AiChatRoomMessageRepository from "$repositories/AiChatRoomMessageRepository"
import { prisma } from "$pkg/prisma"
import { ulid } from "ulid"
import {
    AiChatRoom,
    AiChatRoomMessage,
    AiChatRoomMessageSender,
} from "../../../generated/prisma/client"
import { AiChatRoomDTO } from "$entities/AiChatRoom"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import {
    AiChatRoomMessageCreateDTO,
    AiClientResponse,
    AiClientContentResponse,
    AiClientSourceResponse,
    AiClientSourceToSave,
} from "$entities/AiChatRoomMessage"
import { UserJWTDAO } from "$entities/User"
import * as KnowledgeRepository from "$repositories/KnowledgeRepository"

export async function createChatRoom(
    data: AiChatRoomDTO,
    userId: string,
    tenantId: string
): Promise<ServiceResponse<AiChatRoom | {}>> {
    try {
        data.userId = userId
        data.tenantId = tenantId

        const createdData = await AiChatRoomRepository.create(data)
        return HandleServiceResponseSuccess(createdData)
    } catch (err) {
        Logger.error(`ChatService.createChatRoom`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getAllChatRooms(
    filters: EzFilter.FilteringQuery,
    userId: string,
    tenantId: string
): Promise<ServiceResponse<EzFilter.PaginatedResult<AiChatRoom[]> | {}>> {
    try {
        const data = await AiChatRoomRepository.getAll(filters, userId, tenantId)
        return HandleServiceResponseSuccess(data)
    } catch (err) {
        Logger.error(`ChatService.getAllChatRooms`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getChatRoomById(
    id: string,
    userId: string
): Promise<ServiceResponse<AiChatRoom | {}>> {
    try {
        let aiChatRoom = await AiChatRoomRepository.getByIdAndUserId(id, userId)

        if (!aiChatRoom)
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        return HandleServiceResponseSuccess(aiChatRoom)
    } catch (err) {
        Logger.error(`ChatService.getChatRoomById`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getChatRoomHistory(
    chatRoomId: string,
    filters: EzFilter.FilteringQuery,
    userId: string
): Promise<ServiceResponse<EzFilter.PaginatedResult<AiChatRoomMessage[]> | {}>> {
    try {
        const aiChatRoom = await AiChatRoomRepository.getByIdAndUserId(chatRoomId, userId)

        if (!aiChatRoom)
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        const data = await AiChatRoomMessageRepository.getAll(filters, chatRoomId)
        return HandleServiceResponseSuccess(data)
    } catch (err) {
        Logger.error(`ChatService.getChatRoomHistory`, {
            error: err,
        })

        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export type UpdateResponse = AiChatRoom | {}
export async function updateChatRoom(
    id: string,
    data: AiChatRoomDTO,
    userId: string
): Promise<ServiceResponse<UpdateResponse>> {
    try {
        const aiChatRoom = await AiChatRoomRepository.getByIdAndUserId(id, userId)

        if (!aiChatRoom)
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        const aiChatRoomUpdated = await AiChatRoomRepository.update(id, data)

        return HandleServiceResponseSuccess(aiChatRoomUpdated)
    } catch (err) {
        Logger.error(`ChatService.updateChatRoom`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function deleteChatRoomById(id: string, userId: string): Promise<ServiceResponse<{}>> {
    try {
        let aiChatRoom = await AiChatRoomRepository.getByIdAndUserId(id, userId)

        if (!aiChatRoom)
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        await AiChatRoomRepository.deleteById(id)
        return HandleServiceResponseSuccess({})
    } catch (err) {
        Logger.error(`ChatService.deleteChatRoomById`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function chat(data: AiChatRoomMessageCreateDTO, aiChatRoomId: string, userId: string) {
    try {
        const aiChatRoom = await AiChatRoomRepository.getByIdAndUserId(aiChatRoomId, userId)

        if (!aiChatRoom) {
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)
        }

        // TODO: Integrate with AI Agent Engine

        const aiChatRoomMessage = await prisma.$transaction(
            async (tx) => {
                await AiChatRoomMessageRepository.create(
                    {
                        id: ulid(),
                        aiChatRoomId,
                        sender: AiChatRoomMessageSender.USER,
                        message: data.question,
                        htmlFormattedMessage: data.question,
                    },
                    tx
                )

                const aiMessage = await AiChatRoomMessageRepository.create(
                    {
                        id: ulid(),
                        aiChatRoomId,
                        sender: AiChatRoomMessageSender.ASSISTANT,
                        message: "This is a test message",
                        htmlFormattedMessage: "<p>This is a test message</p>",
                    },
                    tx
                )

                return aiMessage
            },
            { timeout: 10000 }
        )

        return HandleServiceResponseSuccess(aiChatRoomMessage)
    } catch (error) {
        Logger.error(`ChatService.chat`, {
            error: error,
        })
        return HandleServiceResponseCustomError(
            "Internal Server Error",
            ResponseStatus.INTERNAL_SERVER_ERROR
        )
    }
}

export async function streamMessage(
    user: UserJWTDAO,
    chatRoomId: string,
    payload: AiChatRoomMessageCreateDTO,
    onChunk: (chunk: string) => void
): Promise<void> {
    try {
        console.log("Stream Message to API Assistant Chat ........")
        const chatHistory = await AiChatRoomMessageRepository.getLatestChatRoomHistory(chatRoomId)
        console.log("Chat History:", chatHistory)

        const requestBody = await AiChatRoomRepository.buildRequestBody(payload, chatHistory, user)
        console.log("Request Body:", requestBody)
        const response = await AiChatRoomRepository.streamMessage(requestBody)

        // For axios with responseType: 'stream', we get a Node.js stream
        const stream = response.data

        // Convert Node.js stream to async iterator
        const decoder = new TextDecoder()

        let done = false
        let accumulatedContent = ""
        let sources: AiClientSourceToSave[] = []

        // Process Node.js stream
        let buffer = ""

        for await (const chunk of stream) {
            const text = decoder.decode(chunk, { stream: true })
            buffer += text

            // Process complete lines
            const lines = buffer.split("\n")
            buffer = lines.pop() || "" // Keep incomplete line in buffer

            let eventType = ""
            let data = ""

            for (const line of lines) {
                const trimmedLine = line.trim()
                if (!trimmedLine) continue

                if (trimmedLine.startsWith("event:")) {
                    eventType = trimmedLine.substring(6).trim()
                } else if (trimmedLine.startsWith("data:")) {
                    data = trimmedLine.substring(5).trim()

                    // Process the complete event when we have both event type and data
                    if (eventType && data) {
                        const result = await processStreamEvent(
                            eventType,
                            data,
                            onChunk,
                            accumulatedContent,
                            sources
                        )
                        accumulatedContent = result.newAccumulatedContent
                        sources = result.newSources

                        if (result.done) {
                            // Save messages to database
                            await saveChatMessages(chatRoomId, payload, accumulatedContent, sources)
                            done = true
                            break
                        }

                        // Reset for next event
                        eventType = ""
                        data = ""
                    }
                }
            }

            if (done) break
        }
    } catch (err) {
        Logger.error(`ChatService.streamMessage`, {
            error: err,
        })
        throw new Error("Failed to stream message")
    }
}

async function processStreamEvent(
    eventType: string,
    data: string,
    onChunk: (chunk: string) => void,
    accumulatedContent: string,
    sources: AiClientSourceToSave[]
): Promise<{ done: boolean; newAccumulatedContent: string; newSources: AiClientSourceToSave[] }> {
    try {
        const parsedData: AiClientResponse = JSON.parse(data)

        switch (parsedData.type) {
            case "content":
                const contentResponse = parsedData as AiClientContentResponse
                const newAccumulatedContent = accumulatedContent + contentResponse.content

                // Stream content immediately
                onChunk(
                    JSON.stringify({
                        event: "message",
                        data: JSON.stringify({
                            type: "content",
                            content: contentResponse.content,
                        }),
                    })
                )

                return { done: false, newAccumulatedContent, newSources: sources }

            case "sources":
                const sourceResponse = parsedData as AiClientSourceResponse
                // Convert AI client sources to our format
                const newSources: AiClientSourceToSave[] = sourceResponse.sources.map((source) => ({
                    knowledgeId: source.knowledge_id,
                    title: source.metadata?.type || "Knowledge", // Use metadata type as title, fallback to "Knowledge"
                    content: source.content,
                }))

                // Stream sources immediately
                onChunk(
                    JSON.stringify({
                        event: "sources",
                        data: JSON.stringify({
                            type: "sources",
                            sources: sourceResponse.sources,
                        }),
                    })
                )

                return { done: false, newAccumulatedContent: accumulatedContent, newSources }

            case "end":
                // Stream end event
                onChunk(
                    JSON.stringify({
                        event: "end",
                        data: JSON.stringify({
                            type: "end",
                        }),
                    })
                )

                return {
                    done: true,
                    newAccumulatedContent: accumulatedContent,
                    newSources: sources,
                }

            default:
                // Handle unknown types
                onChunk(
                    JSON.stringify({
                        event: eventType || "message",
                        data: data,
                    })
                )

                return {
                    done: false,
                    newAccumulatedContent: accumulatedContent,
                    newSources: sources,
                }
        }
    } catch (error) {
        Logger.debug("Skipped invalid JSON in stream:", { data, error })
        // Still send the raw data
        onChunk(
            JSON.stringify({
                event: eventType || "message",
                data: data,
            })
        )

        return { done: false, newAccumulatedContent: accumulatedContent, newSources: sources }
    }
}

async function saveChatMessages(
    chatRoomId: string,
    payload: AiChatRoomMessageCreateDTO,
    aiResponse: string,
    sources: AiClientSourceToSave[]
): Promise<void> {
    try {
        // Get chat room to access tenantId
        const chatRoom = await prisma.aiChatRoom.findUnique({
            where: { id: chatRoomId },
            select: { tenantId: true },
        })

        if (!chatRoom) {
            throw new Error("Chat room not found")
        }

        await prisma.$transaction(async (tx) => {
            // Save user message
            await AiChatRoomMessageRepository.create(
                {
                    id: ulid(),
                    aiChatRoomId: chatRoomId,
                    sender: AiChatRoomMessageSender.USER,
                    message: payload.question,
                    htmlFormattedMessage: payload.question,
                },
                tx
            )

            // Save AI response message
            const aiMessage = await AiChatRoomMessageRepository.create(
                {
                    id: ulid(),
                    aiChatRoomId: chatRoomId,
                    sender: AiChatRoomMessageSender.ASSISTANT,
                    message: aiResponse,
                    htmlFormattedMessage: `<p>${aiResponse}</p>`,
                },
                tx
            )

            // Save sources to AiChatRoomMessageKnowledge if any
            if (sources.length > 0) {
                for (const source of sources) {
                    // Check if knowledge exists before creating relationship
                    const knowledgeExists = await tx.knowledge.findUnique({
                        where: { id: source.knowledgeId },
                    })

                    if (knowledgeExists) {
                        await KnowledgeRepository.incrementTotalViews(source.knowledgeId)
                        // Check if relationship already exists to avoid duplicates
                        const existingRelation = await tx.aiChatRoomMessageKnowledge.findFirst({
                            where: {
                                aiChatRoomMessageId: aiMessage.id,
                                knowledgeId: source.knowledgeId,
                            },
                        })

                        if (!existingRelation) {
                            // Create the relationship to existing knowledge
                            await tx.aiChatRoomMessageKnowledge.create({
                                data: {
                                    id: ulid(),
                                    aiChatRoomMessageId: aiMessage.id,
                                    knowledgeId: source.knowledgeId,
                                },
                            })
                        }
                    }
                }
            }
        })
    } catch (error) {
        Logger.error(`ChatService.saveChatMessages`, {
            error,
        })
        throw error
    }
}

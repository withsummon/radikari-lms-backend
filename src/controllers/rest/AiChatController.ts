import { Context, TypedResponse } from "hono"
import * as AiChatService from "$services/AiChat"
import {
    handleServiceErrorWithResponse,
    response_created,
    response_success,
    response_stream,
} from "$utils/response.utils"
import { AiChatRoomDTO } from "$entities/AiChatRoom"
import { AiChatRoomMessageCreateDTO } from "$entities/AiChatRoomMessage"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import { UserJWTDAO } from "$entities/User"

export async function createChatRoom(c: Context): Promise<TypedResponse> {
    const data: AiChatRoomDTO = await c.req.json()
    const user: UserJWTDAO = c.get("jwtPayload")
    const tenantId = c.req.param("tenantId")

    const serviceResponse = await AiChatService.Chat.createChatRoom(data, user.id, tenantId)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_created(c, serviceResponse.data, "Successfully created new AiChatRoom!")
}

export async function getAllChatRooms(c: Context): Promise<TypedResponse> {
    const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(c.req.query())
    const user: UserJWTDAO = c.get("jwtPayload")
    const tenantId = c.req.param("tenantId")
    const serviceResponse = await AiChatService.Chat.getAllChatRooms(filters, user.id, tenantId)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched all AiChatRoom!")
}

export async function getChatRoomById(c: Context): Promise<TypedResponse> {
    const chatRoomId = c.req.param("chatRoomId")
    const user: UserJWTDAO = c.get("jwtPayload")

    const serviceResponse = await AiChatService.Chat.getChatRoomById(chatRoomId, user.id)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched AiChatRoom by id!")
}

export async function updateChatRoom(c: Context): Promise<TypedResponse> {
    const data: AiChatRoomDTO = await c.req.json()
    const chatRoomId = c.req.param("chatRoomId")
    const user: UserJWTDAO = c.get("jwtPayload")
    const serviceResponse = await AiChatService.Chat.updateChatRoom(chatRoomId, data, user.id)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully updated AiChatRoom!")
}

export async function deleteChatRoomById(c: Context): Promise<TypedResponse> {
    const chatRoomId = c.req.param("chatRoomId")
    const user: UserJWTDAO = c.get("jwtPayload")

    const serviceResponse = await AiChatService.Chat.deleteChatRoomById(chatRoomId, user.id)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully deleted AiChatRoom!")
}

export async function getChatRoomHistory(c: Context): Promise<TypedResponse> {
    const chatRoomId = c.req.param("chatRoomId")
    const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(c.req.query())
    const user: UserJWTDAO = c.get("jwtPayload")

    const serviceResponse = await AiChatService.Chat.getChatRoomHistory(
        chatRoomId,
        filters,
        user.id
    )

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched AiChatRoom history!")
}

export async function chat(c: Context): Promise<TypedResponse> {
    const question = await c.req.json()
    const chatRoomId = c.req.param("chatRoomId")
    const user: UserJWTDAO = c.get("jwtPayload")

    const serviceResponse = await AiChatService.Chat.chat(question, chatRoomId, user.id)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully sent message to AiChatRoom!")
}

export async function streamMessage(c: Context): Promise<TypedResponse | Response> {
    const formData = await c.req.json()
    const message = formData.message as string
    const chatRoomId = c.req.param("chatRoomId")
    const user: UserJWTDAO = c.get("jwtPayload")

    if (!message) {
        return c.json({ error: "Message is required" }, 400)
    }

    const payload: AiChatRoomMessageCreateDTO = {
        question: message,
    }

    const streamData = new ReadableStream({
        async start(controller) {
            try {
                // Set headers untuk Server-Sent Events
                controller.enqueue(
                    `data: ${JSON.stringify({
                        event: "start",
                        data: { message: "Starting AI response..." },
                    })}\n\n`
                )

                await AiChatService.Chat.streamMessage(
                    user,
                    chatRoomId,
                    payload,
                    (chunk: string) => {
                        try {
                            const parsedChunk = JSON.parse(chunk)

                            // Format response sesuai dengan SSE standard
                            const eventType = parsedChunk.event || "message"
                            const data = parsedChunk.data || chunk

                            // Kirim ke client dalam format SSE
                            controller.enqueue(`event: ${eventType}\n`)
                            controller.enqueue(`data: ${data}\n\n`)
                        } catch (error) {
                            console.error("Error parsing chunk:", error)
                            // Kirim raw data jika parsing gagal
                            controller.enqueue(`event: message\n`)
                            controller.enqueue(`data: ${chunk}\n\n`)
                        }
                    }
                )

                // Stream selesai
                controller.enqueue(`event: end\n`)
                controller.enqueue(`data: ${JSON.stringify({ type: "end" })}\n\n`)
            } catch (err) {
                console.error("Error in streaming chat:", err)
                controller.enqueue(`event: error\n`)
                controller.enqueue(
                    `data: ${JSON.stringify({ error: "Failed to process message" })}\n\n`
                )
            } finally {
                controller.close()
            }
        },
    })

    return response_stream(c, streamData as ReadableStream)
}

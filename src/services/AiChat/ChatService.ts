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
import { AiChatRoomMessageCreateDTO } from "$entities/AiChatRoomMessage"

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
                        sender: AiChatRoomMessageSender.SYSTEM,
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

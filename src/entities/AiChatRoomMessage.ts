import { AiChatRoomMessageSender } from "../../generated/prisma/client"

export interface AiChatRoomMessageDTO {
    id: string
    aiChatRoomId: string
    sender: AiChatRoomMessageSender
    message: string
    htmlFormattedMessage?: string
    knowledgeId?: string
    aiChatRoomMessageKnowledge?: AiChatRoomMessageKnowledgeDTO[]
}

export interface AiChatRoomMessageKnowledgeDTO {
    id: string
    aiChatRoomMessageId: string
    knowledgeId: string
    knowledge?: {
        id: string
        title: string
        content: string
    }
}

export interface AiChatRoomMessageCreateDTO {
    question: string
}

export interface AiClientChatRoomMessageRequestBody {
    chatHistory: ChatHistoryDTO[]
    message: string
    userAttributes: UserAttributesDTO
}

export interface ChatHistoryDTO {
    role: string
    content: string
    timestamp: string
    knowledgeIds: string[]
}

export interface UserAttributesDTO {
    userId: string
    operationIds: string[]
    userTenants: UserTenantDTO[]
}

export interface UserTenantDTO {
    tenantId: string
    tenantRole: string
}

// AI Client Response Types
export interface AiClientContentResponse {
    type: "content"
    content: string
}

export interface AiClientSourceResponse {
    type: "sources"
    sources: AiClientSource[]
}

export interface AiClientEndResponse {
    type: "end"
}

export interface AiClientSource {
    id: string
    title: string
    content: string
}

export interface AiClientSourceToSave {
    knowledgeId: string
    title: string
    content: string
}

export type AiClientResponse =
    | AiClientContentResponse
    | AiClientSourceResponse
    | AiClientEndResponse

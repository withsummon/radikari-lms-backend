import { AiChatRoomMessageSender } from "../../generated/prisma/client"

export interface AiChatRoomMessageDTO {
    id: string
    aiChatRoomId: string
    sender: AiChatRoomMessageSender
    message: string
    htmlFormattedMessage?: string
    knowledgeId?: string
}

export interface AiChatRoomMessageCreateDTO {
    question: string
}

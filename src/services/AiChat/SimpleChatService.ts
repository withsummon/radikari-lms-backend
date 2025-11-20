import { streamText, ModelMessage } from "ai"
import { openai } from "@ai-sdk/openai"
import { prisma } from "$pkg/prisma"
import { ulid } from "ulid"
import { AiChatRoomMessageSender } from "../../../generated/prisma/client"
import Logger from "$pkg/logger"

export async function streamSimpleChat(
    messages: ModelMessage[],
    chatRoomId: string,
    tenantId: string,
    userId: string
) {
    Logger.info("SimpleChatService.streamSimpleChat", {
        chatRoomId,
        tenantId,
        userId,
        messageCount: messages.length,
    })

    const result = streamText({
        model: openai("gpt-4.1-mini"),
        messages,
        async onFinish({ text }) {
            Logger.info("SimpleChatService.streamSimpleChat.onFinish", {
                chatRoomId,
                responseLength: text.length,
            })

            try {
                // Persist the conversation to the database
                // 1. Save User Message (last message in the array)
                const lastUserMessage = messages[messages.length - 1]
                if (lastUserMessage && lastUserMessage.role === 'user' && lastUserMessage.content) {
                    await prisma.aiChatRoomMessage.create({
                        data: {
                            id: ulid(),
                            aiChatRoomId: chatRoomId,
                            sender: AiChatRoomMessageSender.USER,
                            message: lastUserMessage.content as string,
                            htmlFormattedMessage: lastUserMessage.content as string, // Simple text for now
                        }
                    })
                }

                // 2. Save Assistant Response
                await prisma.aiChatRoomMessage.create({
                    data: {
                        id: ulid(),
                        aiChatRoomId: chatRoomId,
                        sender: AiChatRoomMessageSender.ASSISTANT,
                        message: text,
                        htmlFormattedMessage: text, // Markdown processing can be added later
                    }
                })

                Logger.info("SimpleChatService.streamSimpleChat.onFinish", {
                    message: "Successfully saved messages to database.",
                })
            } catch (error) {
                Logger.error("SimpleChatService.streamSimpleChat.onFinish", {
                    error: "Failed to save messages to database",
                    details: error,
                })
            }
        },
    })

    return result.toUIMessageStreamResponse()
}

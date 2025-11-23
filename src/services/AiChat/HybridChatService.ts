import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  generateText,
  embed,
  ModelMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { qdrantClient } from "$pkg/qdrant";
import { prisma } from "$pkg/prisma";
import { ulid } from "ulid";
import { AiChatRoomMessageSender } from "../../../generated/prisma/client";
import Logger from "$pkg/logger";
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

interface HybridChatRequest {
  messages: ModelMessage[];
  chatRoomId: string;
  tenantId: string;
  userId: string;
}

type SourceData = {
  knowledgeId: string;
  headline: string;
  content?: string;
};

// Helper for L2 Normalization
function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map((val) => val / magnitude);
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
  });

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      try {
        // 1. Query Contextualization
        const lastMessage = messages[messages.length - 1];

        const { text: contextualizedQuery } = await generateText({
          model: openai("gpt-4.1-mini"),
          messages: [
            {
              role: "system",
              content: `Given the following conversation history and the latest user message, rephrase the latest message into a standalone search query. If the message is already standalone, return it as is. Do NOT answer the question.`,
            },
            ...messages,
          ],
        });

        // 2. Embed
        const { embedding } = await embed({
          model: google.textEmbedding("gemini-embedding-001"),
          value: contextualizedQuery,
          providerOptions: {
            google: {
              outputDimensionality: 768,
              taskType: 'RETRIEVAL_QUERY',
            },
          },
        });

        // 3. L2 Normalize
        const normalizedEmbedding = normalizeVector(embedding);

        // 4. Retrieve
        const searchResult = await qdrantClient.search("radikari_knowledge", {
          vector: normalizedEmbedding,
          filter: {
            // DO NOTTT FORGET TO CHANGE BACK TO TENANT ID FILTER @valuin @Copilot
            must: [{ key: "tenantId", match: { value: "01KAR8XNR66TD180JD73XY2M21" } }],
          },
          limit: 10,
          score_threshold: 0.6,
        });

        // 5. Send Sources
        const contextParts: string[] = [];
        for (const item of searchResult) {
          const payload = item.payload as any;
          if (!payload) continue;

          const sourceData: SourceData = {
            knowledgeId: payload.knowledge_id,
            headline: payload.headline || "Untitled",
            content: payload.content,
          };

          // Use 'data-source' type which is compatible with AI SDK v5 DataUIMessageChunk
          writer.write({
            type: "data-source",
            data: sourceData,
          } as any);

          contextParts.push(
            `[${payload.headline || payload.knowledge_id}]: ${payload.content}`
          );
        }

        // 6. Stream Text
        const systemMessage = `You are a helpful assistant for the Radikari LMS.
Use the following pieces of retrieved context to answer the user's question.
If the answer is not in the context, say you don't know.

Make sure to cite the sources properly by referring to their title or article, and avoid using markdown formatting especially using tables or alike, for simplicity sake you should focus on conciseness, recalling, and if needed use bullet lists.

Context:
${contextParts.join("\n\n")}`;

        const result = streamText({
          model: openai("gpt-4.1-mini"),
          messages: [{ role: "system", content: systemMessage }, ...messages],
          async onFinish({ text }) {
            Logger.info("HybridChatService.streamHybridChat.onFinish", {
              chatRoomId,
              responseLength: text.length,
            });

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
                });
              }

              // 2. Save Assistant Response
              await prisma.aiChatRoomMessage.create({
                data: {
                  id: ulid(),
                  aiChatRoomId: chatRoomId,
                  sender: AiChatRoomMessageSender.ASSISTANT,
                  message: text,
                  htmlFormattedMessage: text,
                },
              });

              Logger.info("HybridChatService.streamHybridChat.onFinish", {
                message: "Successfully saved messages to database.",
              });
            } catch (error) {
              Logger.error("HybridChatService.streamHybridChat.onFinish", {
                error: "Failed to save messages to database",
                details: error,
              });
            }
          },
        });

        // Merge the text stream into the UI message stream
        writer.merge(result.toUIMessageStream());
      } catch (error) {
        Logger.error("HybridChatService.streamHybridChat.error", { error });
        writer.write({
          type: "error",
          errorText: error instanceof Error ? error.message : String(error),
        });
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}

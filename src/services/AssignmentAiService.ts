import { streamObject, embed } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { qdrantClient } from "$pkg/qdrant";
import { getById } from "$repositories/KnowledgeRepository";
import { checkTokenLimit } from "$services/Tenant/TenantLimitService";
import Logger from "$pkg/logger";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

export const questionGenerationSchema = z.object({
  questions: z.array(
    z.object({
      content: z.string().min(1, "Question content is required"),
      type: z.enum(["MULTIPLE_CHOICE", "ESSAY", "TRUE_FALSE"]),
      options: z
        .array(
          z.object({
            content: z.string().min(1, "Option content is required"),
            isCorrectAnswer: z.boolean(),
          })
        )
        .optional(),
      essayReferenceAnswer: z
        .object({
          content: z.string().min(1, "Essay reference answer is required"),
        })
        .optional(),
      trueFalseAnswer: z
        .object({
          correctAnswer: z.boolean(),
        })
        .optional(),
    })
  ),
});

export type QuestionGenerationRequest = {
  prompt: string;
  count?: number;
  tenantId: string;
};

// Helper for L2 Normalization
function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map((val) => val / magnitude);
}

/**
 * Streams AI-generated questions using streamObject with RAG integration
 */
export async function streamQuestions({
  prompt,
  count = 5,
  tenantId,
}: QuestionGenerationRequest) {
  Logger.info("AssignmentAiService.streamQuestions", {
    tenantId,
    prompt,
    count,
  });

  // 0. Check token limit
  const limitStatus = await checkTokenLimit(tenantId);
  if (!limitStatus.allowed) {
    throw new Error(
      limitStatus.errorMessage || "Monthly token limit exceeded."
    );
  }

  // 1. RAG Integration - Retrieval
  let context = "";
  try {
    // Embed the prompt
    const { embedding } = await embed({
      model: google.textEmbedding("gemini-embedding-001"),
      value: prompt,
      providerOptions: {
        google: {
          outputDimensionality: 768,
          taskType: "RETRIEVAL_QUERY",
        },
      },
    });

    const normalizedEmbedding = normalizeVector(embedding);

    // Search Qdrant
    const searchResult = await qdrantClient.search("radikari_knowledge", {
      vector: normalizedEmbedding,
      ...(process.env.NODE_ENV === "production"
        ? {
            filter: {
              must: [{ key: "tenantId", match: { value: tenantId } }],
            },
          }
        : {}),
      limit: 5,
      score_threshold: 0.4,
    });

    // Build context from top results
    const contextParts: string[] = [];
    for (const result of searchResult) {
      const payload = result.payload as any;
      if (!payload?.knowledge_id) continue;

      const fullKnowledge = await getById(payload.knowledge_id);
      if (!fullKnowledge) continue;

      let part = `[Source: ${fullKnowledge.headline}]\n`;
      if (
        fullKnowledge.knowledgeContent &&
        fullKnowledge.knowledgeContent.length > 0
      ) {
        part += fullKnowledge.knowledgeContent
          .map((c) => `${c.title}: ${c.description}`)
          .join("\n");
      } else if (payload.content) {
        part += payload.content;
      }
      contextParts.push(part);
    }

    if (contextParts.length > 0) {
      context = `Use the following retrieved context as the primary source of truth for generating questions:\n\n${contextParts.join(
        "\n\n"
      )}`;
    }
  } catch (ragError) {
    Logger.error("AssignmentAiService.ragError", { ragError });
    // Fallback to non-RAG generation if retrieval fails
  }

  const systemPrompt = `You are an educator creating assignment questions. 
Generate ${count} questions relevant to the prompt: "${prompt}"

${context}

Requirements:
- For MULTIPLE_CHOICE: Create exactly 4 options with exactly one correct answer (isCorrectAnswer: true)
- For ESSAY: Provide a comprehensive reference answer based on the context
- For TRUE_FALSE: Set the correct boolean value based on the context
- Mix of question types is preferred
- Questions should be clear, concise, and appropriate for the target audience
- Content should be educational and factually accurate based on the provided sources
- If context is provided, ensure questions are specifically derived from that material

Return the response in the specified JSON format.`;

  const result = streamObject({
    model: openai("gpt-4.1-mini"),
    schema: questionGenerationSchema,
    prompt: systemPrompt,
    temperature: 0.4, // Lower temperature for more factual RAG-based generation
  });

  return result;
}

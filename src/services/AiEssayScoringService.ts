import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import Logger from "$pkg/logger"
import { prisma } from "$pkg/prisma"
import { ulid } from "ulid"

// Define the Zod schema for AI essay scoring response
const essayScoreSchema = z.object({
	isCorrect: z
		.boolean()
		.describe("Whether the answer is correct (score >= 70)"),
	score: z.number().min(0).max(100).describe("The score for the essay (0-100)"),
	feedback: z.string().describe("Brief constructive feedback for the student"),
	confidence: z
		.number()
		.min(0)
		.max(1)
		.describe("AI's confidence level in the evaluation (0-1)"),
})

export type EssayScoringResult = z.infer<typeof essayScoreSchema>

export async function scoreEssayAnswer(request: {
	question: string
	userAnswer: string
	expectedAnswer?: string
	context?: string
	tenantId: string
	userId?: string
}): Promise<EssayScoringResult> {
	try {
		Logger.info("AiEssayScoringService.scoreEssayAnswer", {
			question: request.question.substring(0, 100) + "...",
			userAnswer: request.userAnswer.substring(0, 100) + "...",
		})

		// Build the system prompt for essay scoring
		const systemPrompt = `
You are an expert essay evaluator for educational assessments. Your task is to evaluate student answers to essay questions.

EVALUATION CRITERIA:
1. Correctness: Does the answer demonstrate understanding of the core concept?
2. Completeness: Does the answer address all parts of the question?
3. Clarity: Is the answer well-structured and easy to understand?
4. Relevance: Does the answer stay focused on the question asked?

SCORING SYSTEM:
- Score 0-100 where:
  - 90-100: Excellent - Completely correct, comprehensive, and well-explained
  - 80-89: Good - Mostly correct with minor gaps or clarity issues
  - 70-79: Satisfactory - Partially correct but missing key elements
  - 60-69: Needs Improvement - Limited understanding or significant gaps
  - 0-59: Insufficient - Incorrect or completely misses the point

CONTEXT INFORMATION:
${request.context ? `Additional context: ${request.context}` : "No additional context provided."}
${
	request.expectedAnswer
		? `Expected answer key points: ${request.expectedAnswer}`
		: "No specific expected answer provided."
}

IMPORTANT:
- Be fair and consistent in your evaluation
- Consider the language used by the student (respond in the same language if possible)
- Focus on understanding rather than exact wording
- Provide constructive feedback that helps the student learn
`

		const userPrompt = `Question: ${request.question}\n\nStudent Answer: ${request.userAnswer}`

		const { object, usage } = await generateObject({
			model: openai("gpt-4.1-mini"),
			schema: essayScoreSchema,
			system: systemPrompt,
			prompt: userPrompt,
			temperature: 0.3, // Lower temperature for more consistent scoring
		})

		// Log Token Usage
		if (usage && request.tenantId) {
			try {
				const usageData = usage as any
				await prisma.aiUsageLog.create({
					data: {
						id: ulid(),
						tenantId: request.tenantId,
						userId: request.userId,
						action: "ESSAY_SCORING",
						model: "gpt-4.1-mini",
						promptTokens: usageData.promptTokens || 0,
						completionTokens: usageData.completionTokens || 0,
						totalTokens: usageData.totalTokens || 0,
					},
				})
			} catch (logError) {
				Logger.error("AiEssayScoringService.scoreEssayAnswer.logError", {
					error:
						logError instanceof Error ? logError.message : String(logError),
				})
			}
		}

		Logger.info("AiEssayScoringService.scoreEssayAnswer", {
			score: object.score,
			isCorrect: object.isCorrect,
			confidence: object.confidence,
		})

		return object
	} catch (error) {
		Logger.error("AiEssayScoringService.scoreEssayAnswer", {
			error: error instanceof Error ? error.message : String(error),
		})

		// Return a default result on error
		return {
			isCorrect: false,
			score: 0,
			feedback: "Error occurred during evaluation. Manual review required.",
			confidence: 0,
		}
	}
}

export async function evaluateEssayAnswers(
	essayQuestions: Array<{
		id: string
		question: string
		userAnswer: string
		expectedAnswer?: string
		context?: string
	}>,
	tenantId: string,
	userId?: string,
): Promise<Array<{ questionId: string; result: EssayScoringResult }>> {
	const results = []

	for (const essayQuestion of essayQuestions) {
		const result = await scoreEssayAnswer({
			...essayQuestion,
			tenantId,
			userId,
		})
		results.push({
			questionId: essayQuestion.id,
			result,
		})
	}

	return results
}

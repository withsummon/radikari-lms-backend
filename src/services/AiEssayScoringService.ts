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
		.default(false)
		.describe("Whether the answer is correct (score >= 70)"),
	score: z
		.number()
		.min(0)
		.max(100)
		.default(0)
		.describe("The score for the essay (0-100)"),
	feedback: z
		.string()
		.default("")
		.describe("Brief constructive feedback for the student"),
	confidence: z
		.number()
		.min(0)
		.max(1)
		.default(0)
		.describe("AI's confidence level in the evaluation (0-1)"),
	strengths: z
		.array(z.string())
		.default([])
		.describe("Array of 2-3 specific things the student did well"),
	weaknesses: z
		.array(z.string())
		.default([])
		.describe("Array of 2-3 specific areas that need improvement"),
	suggestions: z
		.array(z.string())
		.default([])
		.describe("Array of 2-3 actionable advice items for improvement"),
	keyPointsCovered: z
		.array(z.string())
		.default([])
		.describe(
			"Array of key concepts from expected answer that student addressed",
		),
	keyPointsMissing: z
		.array(z.string())
		.default([])
		.describe(
			"Array of important concepts from expected answer that were not addressed",
		),
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
You are a supportive and understanding essay evaluator for educational assessments. Your goal is to evaluate if the student has the right "conceptual direction" and "understanding," rather than requiring 100% accurate wording or exhaustive completeness.

EVALUATION PHILOSOPHY:
- Prioritize "Understanding over Accuracy": If a student explains the core concept correctly but uses informal language or misses non-essential details, they should still receive a high score.
- Be "Tolerant of Incompleteness": If the answer is partially incomplete but the part provided shows clear understanding of the relevant topic, do not penalize heavily.
- Reward "Right Direction": If the student is clearly on the right track but stumbles on specific terminology, give them the benefit of the doubt.

EVALUATION CRITERIA:
1. Conceptual Understanding: Does the student "get it"? This is the most important factor.
2. Directional Accuracy: Is the student moving towards the right answer?
3. Core Explanation: Did they hit the main "key point" of the reference answer, even if briefly?

SCORING SYSTEM:
- Score 0-100 where:
  - 85-100: Excellent - Shows clear understanding of the core concept.
  - 70-84: Good/Satisfactory - Has the right direction and understands the basics, even if some details are missing or slightly off.
  - 50-69: Needs Improvement - Shows some inkling of the concept but has major gaps or confusion.
  - 0-49: Insufficient - Completely unrelated or fundamentally incorrect.

THRESHOLD:
- Any answer that demonstrates the correct "essence" or "direction" of the expected answer should be considered "Correct" (isCorrect: true, score >= 70).

REQUIRED OUTPUT STRUCTURE:
You MUST provide:

1. **feedback**: A brief 1-2 sentence overall summary of the evaluation

2. **strengths**: Array of 2-3 specific things the student did well
   - Be specific and encouraging
   - Mention correct concepts, good explanations, or proper understanding
   - Example: "Correctly identified the main concept of photosynthesis"

3. **weaknesses**: Array of 2-3 specific areas that need improvement
   - Be constructive and specific
   - Point out missing concepts, unclear explanations, or misconceptions
   - Example: "Did not mention the role of chlorophyll in the process"

4. **suggestions**: Array of 2-3 actionable advice items
   - Provide clear, specific steps for improvement
   - Example: "Review the role of ATP in cellular energy transfer"

5. **keyPointsCovered**: Array of key concepts from the expected answer that the student successfully addressed
   - List specific concepts/points from the reference answer
   - Empty array if no expected answer provided

6. **keyPointsMissing**: Array of important concepts from the expected answer that were not addressed
   - List specific missing concepts/points
   - Empty array if no expected answer provided or if all points covered

CONTEXT INFORMATION:
${
	request.context
		? `Additional context: ${request.context}`
		: "No additional context provided."
}
${
	request.expectedAnswer
		? `Expected answer key points: ${request.expectedAnswer}`
		: "No specific expected answer provided."
}

IMPORTANT GUIDELINES:
- Be fair, consistent, and encouraging in your evaluation
- ALWAYS respond in Indonesian (Bahasa Indonesia), regardless of the language used in the student's answer
- Focus on understanding rather than exact wording
- Provide constructive feedback that helps the student learn
`

		const userPrompt = `Question: ${request.question}\n\nStudent Answer: ${request.userAnswer}`

		const { object, usage } = await generateObject({
			model: openai("gpt-4o-mini"),
			schema: essayScoreSchema,
			system: systemPrompt,
			prompt: userPrompt,
			temperature: 0.5,
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
						model: "gpt-4o-mini",
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
			stack: error instanceof Error ? error.stack : undefined,
			errorType: error?.constructor?.name,
			fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
		})

		// Return a default result on error
		return {
			isCorrect: false,
			score: 0,
			feedback: "Error occurred during evaluation. Manual review required.",
			confidence: 0,
			strengths: [],
			weaknesses: [],
			suggestions: [],
			keyPointsCovered: [],
			keyPointsMissing: [],
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

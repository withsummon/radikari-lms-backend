import { AssignmentUserAttemptAnswerDTO } from "$entities/Assignment"
import {
	HandleServiceResponseCustomError,
	HandleServiceResponseSuccess,
	ResponseStatus,
	ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"
import pubsub from "$pkg/pubsub"
import { PUBSUB_TOPICS } from "$entities/PubSub"
import * as AssignmentAttemptRepository from "$repositories/Assignment/AssignmentAttemptRepository"
import {
	AssignmentQuestionType,
	AssignmentUserAttempt,
	AssignmentUserAttemptQuestionAnswer,
} from "../../generated/prisma/client"
import * as AssignmentQuestionRepository from "$repositories/Assignment/AssignmentQuestionRepository"
import * as AssignmentRepository from "$repositories/Assignment"
import { evaluateEssayAnswers } from "./AiEssayScoringService"

export async function create(
	assignmentId: string,
	userId: string,
	tenantId: string,
): Promise<ServiceResponse<AssignmentUserAttempt | {}>> {
	try {
		const assignment = await AssignmentRepository.getById(
			assignmentId,
			tenantId,
		)
		if (!assignment) {
			return HandleServiceResponseCustomError(
				"Assignment not found",
				ResponseStatus.NOT_FOUND,
			)
		}

		if (assignment.status == "EXPIRED") {
			return HandleServiceResponseCustomError(
				"Assignment is expired",
				ResponseStatus.BAD_REQUEST,
			)
		}

		const currentUserAssignmentAttempt =
			await AssignmentAttemptRepository.getCurrentUserAssignmentAttemptByUserId(
				userId,
			)
		if (
			currentUserAssignmentAttempt &&
			currentUserAssignmentAttempt.assignmentId !== assignmentId
		) {
			return HandleServiceResponseCustomError(
				"User already has an assignment in progress",
				ResponseStatus.BAD_REQUEST,
			)
		}

		const existingAssignmentAttempt =
			await AssignmentAttemptRepository.getByUserIdAndAssignmentId(
				userId,
				assignmentId,
			)
		if (existingAssignmentAttempt && existingAssignmentAttempt.isSubmitted) {
			return HandleServiceResponseCustomError(
				"Assignment already submitted",
				ResponseStatus.BAD_REQUEST,
			)
		}

		// If user already has an attempt for this assignment, return it instead of creating a new one
		if (existingAssignmentAttempt) {
			return HandleServiceResponseSuccess(existingAssignmentAttempt)
		}

		const data = await AssignmentAttemptRepository.create(assignmentId, userId)
		return HandleServiceResponseSuccess(data)
	} catch (err) {
		Logger.error(`AssignmentAttemptService.create`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getCurrentUserAssignmentAttemptByUserId(
	userId: string,
): Promise<ServiceResponse<AssignmentUserAttempt | {}>> {
	try {
		const data =
			await AssignmentAttemptRepository.getCurrentUserAssignmentAttemptByUserId(
				userId,
			)

		if (!data) {
			return HandleServiceResponseCustomError(
				"Assignment user attempt not found",
				ResponseStatus.NOT_FOUND,
			)
		}

		return HandleServiceResponseSuccess(data)
	} catch (err) {
		Logger.error(
			`AssignmentAttemptService.getCurrentUserAssignmentAttemptByUserId`,
			{
				error: err,
			},
		)
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function updateAnswer(
	userId: string,
	assignmentId: string,
	data: AssignmentUserAttemptAnswerDTO,
): Promise<ServiceResponse<AssignmentUserAttemptQuestionAnswer | {}>> {
	try {
		const assignmentAttempt =
			await AssignmentAttemptRepository.getByUserIdAndAssignmentId(
				userId,
				assignmentId,
			)
		if (!assignmentAttempt) {
			return HandleServiceResponseCustomError(
				"Assignment user attempt not found",
				ResponseStatus.NOT_FOUND,
			)
		}

		if (assignmentAttempt.isSubmitted) {
			return HandleServiceResponseCustomError(
				"Assignment user attempt already submitted",
				ResponseStatus.BAD_REQUEST,
			)
		}

		// Add time validation before processing answer
		const isTimeValid = await AssignmentAttemptRepository.isAttemptTimeValid(
			assignmentAttempt.id,
		)

		if (!isTimeValid) {
			return HandleServiceResponseCustomError(
				"Time limit exceeded - cannot submit answers",
				ResponseStatus.BAD_REQUEST,
			)
		}

		const assignmentUserAttemptQuestionAnswer =
			await AssignmentAttemptRepository.getByAssignmentUserAttemptIdAndAssignmentQuestionId(
				assignmentAttempt.id,
				data.assignmentQuestionId,
			)

		if (!assignmentUserAttemptQuestionAnswer) {
			return HandleServiceResponseCustomError(
				"Assignment user attempt question answer not found",
				ResponseStatus.NOT_FOUND,
			)
		}

		const answer = await AssignmentAttemptRepository.updateAnswer(
			assignmentAttempt.id,
			data,
		)
		return HandleServiceResponseSuccess(answer)
	} catch (err: any) {
		Logger.error(`AssignmentAttemptService.updateAnswer`, {
			error: err.message || err,
		})
		return HandleServiceResponseCustomError(
			err.message || "Internal Server Error",
			500,
		)
	}
}

export async function submitAssignment(
	userId: string,
	assignmentId: string,
): Promise<ServiceResponse<AssignmentUserAttempt | {}>> {
	try {
		const assignmentAttempt =
			await AssignmentAttemptRepository.getByUserIdAndAssignmentId(
				userId,
				assignmentId,
			)
		if (!assignmentAttempt) {
			return HandleServiceResponseCustomError(
				"Assignment user attempt not found",
				ResponseStatus.NOT_FOUND,
			)
		}

		if (assignmentAttempt.isSubmitted) {
			return HandleServiceResponseCustomError(
				"Assignment user attempt already submitted",
				ResponseStatus.BAD_REQUEST,
			)
		}

		try {
			await AssignmentAttemptRepository.markAsSubmitted(assignmentAttempt.id)
			await pubsub.sendToQueue(PUBSUB_TOPICS.ASSIGNMENT_ATTEMPT_SUBMIT, {
				assignmentUserAttemptId: assignmentAttempt.id,
			})
		} catch (mqError) {
			Logger.warning(
				"AssignmentAttemptService.submitAssignment: Failed to publish submit event",
				{
					error: mqError,
					assignmentUserAttemptId: assignmentAttempt.id,
				},
			)
		}

		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`AssignmentAttemptService.submitAssignment`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function calculateAssignmentScore(
	assignmentUserAttemptId: string,
) {
	try {
		const assignmentAttempt = await AssignmentAttemptRepository.getById(
			assignmentUserAttemptId,
		)
		if (!assignmentAttempt) {
			Logger.error(`AssignmentAttemptService.calculateAssignmentScore`, {
				message: "Assignment user attempt not found",
			})
			throw new Error("Assignment user attempt not found")
		}

		// Fetch assignment to get tenantId
		const assignment = await AssignmentRepository.getByIdDefault(
			assignmentAttempt.assignmentId,
		)

		if (!assignment) {
			throw new Error("Assignment not found")
		}

		Logger.info(`AssignmentAttemptService.calculateAssignmentScore`, {
			message: "Calculating assignment score",
		})
		const [correctAnswers, assignmentUserAttemptAnswers] = await Promise.all([
			AssignmentQuestionRepository.getCorrectQuestionAnswers(
				assignmentAttempt.assignmentId,
			),
			AssignmentAttemptRepository.getAllUserAttemptAnswers(
				assignmentUserAttemptId,
			),
		])

		let score = 0
		const totalPossibleScore = correctAnswers.reduce(
			(acc, q) => acc + (q.points || 0),
			0,
		)

		// Separate essay questions for AI scoring
		const essayQuestions = []
		const nonEssayQuestions = []

		for (const userAttemptAnswer of assignmentUserAttemptAnswers) {
			const question = correctAnswers.find(
				(answer) => answer.id === userAttemptAnswer.assignmentQuestionId,
			)

			if (userAttemptAnswer.type === AssignmentQuestionType.ESSAY) {
				essayQuestions.push({
					id: userAttemptAnswer.assignmentQuestionId,
					question: question?.content || "",
					userAnswer: userAttemptAnswer.essayAnswer || "",
					expectedAnswer:
						question?.assignmentQuestionEssayReferenceAnswer?.content,
					context: question?.assignmentQuestionEssayReferenceAnswer?.content,
					points: question?.points || 0,
				})
			} else {
				nonEssayQuestions.push({
					...userAttemptAnswer,
					points: question?.points || 0,
				})
			}
		}

		// Process non-essay questions with traditional scoring
		for (const userAttemptAnswer of nonEssayQuestions) {
			let isCorrect = false
			switch (userAttemptAnswer.type) {
				case AssignmentQuestionType.MULTIPLE_CHOICE:
					let correctAnswerChoiceId = correctAnswers.find(
						(answer) => answer.id === userAttemptAnswer.assignmentQuestionId,
					)?.assignmentQuestionOptions[0].id

					if (
						correctAnswerChoiceId ===
						userAttemptAnswer.assignmentQuestionOptionId
					) {
						isCorrect = true
						score += (userAttemptAnswer as any).points || 0
					}
					break
				case AssignmentQuestionType.TRUE_FALSE:
					let correctAnswer = correctAnswers.find(
						(answer) => answer.id === userAttemptAnswer.assignmentQuestionId,
					)?.assignmentQuestionTrueFalseAnswer?.correctAnswer

					if (correctAnswer === userAttemptAnswer.trueFalseAnswer) {
						isCorrect = true
						score += (userAttemptAnswer as any).points || 0
					}
					break
				default:
					break
			}

			Logger.info(`AssignmentAttemptService.calculateAssignmentScore`, {
				message: `Setting correct answer for question ${userAttemptAnswer.assignmentQuestionId}, Is correct: ${isCorrect}`,
			})

			await AssignmentAttemptRepository.setCorrectAnswer(
				assignmentUserAttemptId,
				userAttemptAnswer.assignmentQuestionId,
				isCorrect,
			)
		}

		// Process essay questions with AI scoring
		if (essayQuestions.length > 0) {
			Logger.info(`AssignmentAttemptService.calculateAssignmentScore`, {
				message: `Scoring ${essayQuestions.length} essay questions with AI`,
			})

			const essayResults = await evaluateEssayAnswers(
				essayQuestions,
				assignment.tenantId,
				assignmentAttempt.userId,
			)

			for (const { questionId, result } of essayResults) {
				const isCorrect = result.isCorrect
				if (isCorrect) {
					const question = essayQuestions.find((q) => q.id === questionId)
					score += question?.points || 0
				}

				Logger.info(`AssignmentAttemptService.calculateAssignmentScore`, {
					message: `AI scored essay question ${questionId}, Is correct: ${isCorrect}, Score: ${result.score}, Confidence: ${result.confidence}`,
					aiScore: result.score,
					aiFeedback: result.feedback,
					aiConfidence: result.confidence,
				})

				// Serialize the complete AI feedback to JSON for storage
				const aiGradingReasoning = JSON.stringify(result)

				await AssignmentAttemptRepository.setCorrectAnswer(
					assignmentUserAttemptId,
					questionId,
					isCorrect,
					aiGradingReasoning,
				)
			}
		}

		// Calculate percentage score
		const totalQuestions = assignmentUserAttemptAnswers.length
		const percentageScore =
			totalPossibleScore > 0
				? Number(((score / totalPossibleScore) * 100).toFixed(2))
				: 0

		await AssignmentAttemptRepository.submitAssignment(
			assignmentUserAttemptId,
			score,
			percentageScore,
		)

		Logger.info(`AssignmentAttemptService.calculateAssignmentScore`, {
			message: `Assignment scored successfully. Total score: ${score}/${totalPossibleScore} (${percentageScore}%)`,
			totalScore: score,
			totalQuestions: totalQuestions,
			totalPossibleScore: totalPossibleScore,
			percentageScore: percentageScore,
			essayQuestionsCount: essayQuestions.length,
			nonEssayQuestionsCount: nonEssayQuestions.length,
		})
	} catch (err) {
		Logger.error(`AssignmentAttemptService.calculateAssignmentScore`, {
			error: err,
		})
	}
}

export async function getAllQuestionsAndAnswers(
	userId: string,
	assignmentId: string,
): Promise<ServiceResponse<any[] | {}>> {
	try {
		const assignmentAttempt =
			await AssignmentAttemptRepository.getByUserIdAndAssignmentId(
				userId,
				assignmentId,
			)
		if (!assignmentAttempt) {
			return HandleServiceResponseCustomError(
				"Assignment user attempt not found",
				ResponseStatus.NOT_FOUND,
			)
		}

		if (assignmentAttempt.isSubmitted) {
			return HandleServiceResponseCustomError(
				"Assignment user attempt already submitted",
				ResponseStatus.BAD_REQUEST,
			)
		}

		const [assignment, questions, assignmentUserAttemptAnswers] =
			await Promise.all([
				AssignmentRepository.getByIdDefault(assignmentAttempt.assignmentId),
				AssignmentQuestionRepository.getAllQuestions(
					assignmentAttempt.assignmentId,
				),
				AssignmentAttemptRepository.getAllUserAttemptAnswers(
					assignmentAttempt.id,
				),
			])

		let sortedQuestions = questions
		if (assignment?.isRandomized && assignmentAttempt.randomSeed !== 0) {
			const seed = assignmentAttempt.randomSeed
			// Deterministic shuffle using a simple seeded random
			sortedQuestions = [...questions].sort((a, b) => {
				const valA =
					Math.sin(
						seed +
							a.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0),
					) * 10000
				const valB =
					Math.sin(
						seed +
							b.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0),
					) * 10000
				return valA - Math.floor(valA) - (valB - Math.floor(valB))
			})
		} else {
			sortedQuestions = [...questions].sort((a, b) => a.order - b.order)
		}

		const mappedQuestions = sortedQuestions.map((question) => {
			const assignmentUserAttemptAnswer = assignmentUserAttemptAnswers.find(
				(answer) => answer.assignmentQuestionId === question.id,
			)

			if (question.type === AssignmentQuestionType.MULTIPLE_CHOICE) {
				return {
					id: question.id,
					order: question.order,
					content: question.content,
					type: question.type,
					options: question.assignmentQuestionOptions.map((option) => {
						return {
							id: option.id,
							content: option.content,
						}
					}),
					userAnswer: assignmentUserAttemptAnswer?.assignmentQuestionOptionId,
				}
			} else if (question.type === AssignmentQuestionType.ESSAY) {
				return {
					id: question.id,
					order: question.order,
					content: question.content,
					type: question.type,
					userAnswer: assignmentUserAttemptAnswer?.essayAnswer,
					aiGradingReasoning: assignmentUserAttemptAnswer?.aiGradingReasoning,
				}
			} else if (question.type === AssignmentQuestionType.TRUE_FALSE) {
				return {
					id: question.id,
					order: question.order,
					content: question.content,
					type: question.type,
					userAnswer: assignmentUserAttemptAnswer?.trueFalseAnswer,
				}
			}
		})

		return HandleServiceResponseSuccess(mappedQuestions)
	} catch (err) {
		Logger.error(`AssignmentAttemptService.getAllQuestionsAndAnswers`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getAssignmentsByExpiredDate() {
	try {
		const assignments =
			await AssignmentAttemptRepository.getUnsubmittedAssignmentUserAttempts()
		for (const assignment of assignments) {
			if (
				assignment.createdAt.getTime() +
					60000 +
					assignment.assignment.durationInMinutes * 60000 <
				Date.now()
			) {
				try {
					await pubsub.sendToQueue(PUBSUB_TOPICS.ASSIGNMENT_ATTEMPT_SUBMIT, {
						assignmentUserAttemptId: assignment.id,
					})
				} catch (mqError) {
					Logger.warning(
						"AssignmentAttemptService.getAssignmentsByExpiredDate: Failed to publish submit event",
						{
							error: mqError,
							assignmentUserAttemptId: assignment.id,
						},
					)
				}
			}
		}
	} catch (err) {
		Logger.error(`AssignmentAttemptService.getAssignmentsByExpiredDate`, {
			error: err,
		})
	}
}

export async function getHistoryUserAssignmentAttempts(
	userId: string,
	assignmentId: string,
) {
	try {
		const assignmentAttempt =
			await AssignmentAttemptRepository.getHistoryUserAssignmentAttempts(
				userId,
				assignmentId,
			)

		if (!assignmentAttempt) {
			return HandleServiceResponseCustomError(
				"Assignment user attempt not found",
				ResponseStatus.NOT_FOUND,
			)
		}

		const mappedQuestions =
			assignmentAttempt.assignment.assignmentQuestions.map((question) => {
				const assignmentUserAttemptAnswer =
					assignmentAttempt.assignmentUserAttemptQuestionAnswers.find(
						(answer) => answer.assignmentQuestionId === question.id,
					)

				if (question.type === AssignmentQuestionType.MULTIPLE_CHOICE) {
					return {
						id: question.id,
						order: question.order,
						content: question.content,
						type: question.type,
						options: question.assignmentQuestionOptions.map((option) => {
							return {
								id: option.id,
								content: option.content,
								isCorrectAnswer: option.isCorrectAnswer,
							}
						}),
						isCorrect: assignmentUserAttemptAnswer?.isAnswerCorrect,
						userAnswer: assignmentUserAttemptAnswer?.assignmentQuestionOptionId,
						correctChoice: question.assignmentQuestionOptions.find(
							(option) => option.isCorrectAnswer,
						),
					}
				} else if (question.type === AssignmentQuestionType.ESSAY) {
					return {
						id: question.id,
						order: question.order,
						content: question.content,
						type: question.type,
						isCorrect: assignmentUserAttemptAnswer?.isAnswerCorrect,
						userAnswer: assignmentUserAttemptAnswer?.essayAnswer,
						aiGradingFeedback: assignmentUserAttemptAnswer?.aiGradingReasoning,
						correctAnswer: question.assignmentQuestionEssayReferenceAnswer?.content,
					}
				} else if (question.type === AssignmentQuestionType.TRUE_FALSE) {
					return {
						id: question.id,
						order: question.order,
						content: question.content,
						type: question.type,
						isCorrect: assignmentUserAttemptAnswer?.isAnswerCorrect,
						userAnswer: assignmentUserAttemptAnswer?.trueFalseAnswer,
						correctAnswer: question.assignmentQuestionTrueFalseAnswer?.correctAnswer,
					}
				}
			})

		return HandleServiceResponseSuccess({
			assignmentAttempt: {
				id: assignmentAttempt.id,
				score: assignmentAttempt.score,
				percentageScore: assignmentAttempt.percentageScore,
				isSubmitted: assignmentAttempt.isSubmitted,
				submittedAt: assignmentAttempt.submittedAt,
				createdAt: assignmentAttempt.createdAt,
				updatedAt: assignmentAttempt.updatedAt,
			},
			assignment: {
				id: assignmentAttempt.assignment.id,
				title: assignmentAttempt.assignment.title,
				durationInMinutes: assignmentAttempt.assignment.durationInMinutes,
				showAnswer: assignmentAttempt.assignment.showAnswer,
				showQuestion: assignmentAttempt.assignment.showQuestion,
			},
			questions: mappedQuestions,
		})
	} catch (err) {
		Logger.error(`AssignmentAttemptService.getHistoryUserAssignmentAttempts`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getTimeStatus(
	userId: string,
	assignmentId: string,
): Promise<
	ServiceResponse<
		| {
				isValid: boolean
				remainingSeconds: number
				gracePeriodMs: number
		  }
		| {}
	>
> {
	try {
		const assignmentAttempt =
			await AssignmentAttemptRepository.getByUserIdAndAssignmentId(
				userId,
				assignmentId,
			)

		if (!assignmentAttempt) {
			return HandleServiceResponseCustomError(
				"Assignment attempt not found",
				ResponseStatus.NOT_FOUND,
			)
		}

		if (assignmentAttempt.isSubmitted) {
			return HandleServiceResponseCustomError(
				"Assignment already submitted",
				ResponseStatus.BAD_REQUEST,
			)
		}

		// Fetch assignment to get tenantId
		const assignment = await AssignmentRepository.getById(
			assignmentAttempt.assignmentId,
			"", // tenantId not needed for this call, we'll get it from the assignment
		)

		if (!assignment || !assignment.tenantId) {
			return HandleServiceResponseCustomError(
				"Assignment tenant not found",
				ResponseStatus.NOT_FOUND,
			)
		}

		// Re-fetch with proper tenantId if needed
		const assignmentWithTenant = await AssignmentRepository.getById(
			assignmentAttempt.assignmentId,
			assignment.tenantId,
		)

		if (!assignmentWithTenant) {
			return HandleServiceResponseCustomError(
				"Assignment not found",
				ResponseStatus.NOT_FOUND,
			)
		}

		const gracePeriodMs = parseInt(
			process.env.ASSIGNMENT_GRACE_PERIOD_MS || "60000",
			10,
		)
		const expirationTime =
			assignmentAttempt.createdAt.getTime() +
			gracePeriodMs +
			assignmentWithTenant.durationInMinutes * 60000

		const remainingTime = expirationTime - Date.now()
		const isValid = remainingTime > 0

		return HandleServiceResponseSuccess({
			isValid,
			remainingSeconds: Math.max(0, Math.floor(remainingTime / 1000)),
			gracePeriodMs,
		})
	} catch (err) {
		Logger.error(`AssignmentAttemptService.getTimeStatus`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getAssignmentExportData(
	tenantId: string,
	assignmentId: string,
): Promise<
	ServiceResponse<
		| {
				assignment: {
					id: string
					title: string
					durationInMinutes: number
				}
				questions: {
					id: string
					order: number
					content: string
					type: "MULTIPLE_CHOICE" | "ESSAY" | "TRUE_FALSE"
					options?: {
						id: string
						content: string
					}[]
					correctAnswer?: boolean
					referenceAnswer?: string
				}[]
				studentAttempts: {
					student: {
						id: string
						fullName: string
						email: string
					}
					attempt: {
						id: string
						score: number
						percentageScore: number
						submittedAt: string
						durationInMinutes?: number
					}
					answers: {
						questionId: string
						userAnswer: string | boolean | null
						isCorrect: boolean
						aiGradingReasoning?: string
					}[]
				}[]
		  }
		| {}
	>
> {
	try {
		// Get assignment details
		const assignment = await AssignmentRepository.getById(
			assignmentId,
			tenantId,
		)
		if (!assignment) {
			return HandleServiceResponseCustomError(
				"Assignment not found",
				ResponseStatus.NOT_FOUND,
			)
		}

		// Get all submitted attempts for this assignment
		const allAttempts =
			await AssignmentAttemptRepository.getAllSubmittedAttemptsByAssignmentId(
				assignmentId,
			)

		// Get all questions for this assignment
		const questions =
			await AssignmentQuestionRepository.getAllQuestions(assignmentId)

		// Transform questions data
		const transformedQuestions = questions.map((question) => {
			const baseQuestion = {
				id: question.id,
				order: question.order,
				content: question.content,
				type: question.type,
			}

			if (question.type === AssignmentQuestionType.MULTIPLE_CHOICE) {
				return {
					...baseQuestion,
					options: question.assignmentQuestionOptions.map((option) => ({
						id: option.id,
						content: option.content,
					})),
				}
			} else if (question.type === AssignmentQuestionType.TRUE_FALSE) {
				return {
					...baseQuestion,
					correctAnswer:
						question.assignmentQuestionTrueFalseAnswer?.correctAnswer,
				}
			} else if (question.type === AssignmentQuestionType.ESSAY) {
				return {
					...baseQuestion,
					referenceAnswer:
						question.assignmentQuestionEssayReferenceAnswer?.content,
				}
			}

			return baseQuestion
		})

		// Transform student attempts data
		const studentAttempts = await Promise.all(
			allAttempts.map(async (attempt) => {
				// Get all answers for this attempt
				const userAnswers =
					await AssignmentAttemptRepository.getAllUserAttemptAnswers(attempt.id)

				// Get user details
				const user = await AssignmentAttemptRepository.getUserById(
					attempt.userId,
				)

				// Transform answers
				const answers = userAnswers.map((answer) => {
					let userAnswer: string | boolean | null = null

					if (answer.type === AssignmentQuestionType.MULTIPLE_CHOICE) {
						// Find the option content
						const question = questions.find(
							(q) => q.id === answer.assignmentQuestionId,
						)
						const option = question?.assignmentQuestionOptions.find(
							(o) => o.id === answer.assignmentQuestionOptionId,
						)
						userAnswer = option?.content || null
					} else if (answer.type === AssignmentQuestionType.ESSAY) {
						userAnswer = answer.essayAnswer || null
					} else if (answer.type === AssignmentQuestionType.TRUE_FALSE) {
						userAnswer = answer.trueFalseAnswer ?? null
					}

					return {
						questionId: answer.assignmentQuestionId,
						userAnswer,
						isCorrect: !!answer.isAnswerCorrect,
						aiGradingReasoning: (answer as any).aiGradingReasoning,
					}
				})

				return {
					student: {
						id: user.id,
						fullName: user.fullName,
						email: user.email,
					},
					attempt: {
						id: attempt.id,
						score: attempt.score ?? 0,
						percentageScore: attempt.percentageScore ?? 0,
						submittedAt: attempt.submittedAt?.toISOString() || "",
						durationInMinutes: (attempt as any).durationInMinutes,
					},
					answers,
				}
			}),
		)

		const exportData = {
			assignment: {
				id: assignment.id,
				title: assignment.title,
				durationInMinutes: assignment.durationInMinutes,
			},
			questions: transformedQuestions,
			studentAttempts,
		}

		return HandleServiceResponseSuccess(exportData)
	} catch (err) {
		Logger.error(`AssignmentAttemptService.getAssignmentExportData`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

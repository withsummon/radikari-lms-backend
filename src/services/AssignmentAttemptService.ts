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

		await pubsub.sendToQueue(PUBSUB_TOPICS.ASSIGNMENT_ATTEMPT_SUBMIT, {
			assignmentUserAttemptId: assignmentAttempt.id,
		})

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

		// Separate essay questions for AI scoring
		const essayQuestions = []
		const nonEssayQuestions = []

		for (const userAttemptAnswer of assignmentUserAttemptAnswers) {
			if (userAttemptAnswer.type === AssignmentQuestionType.ESSAY) {
				const question = correctAnswers.find(
					(answer) => answer.id === userAttemptAnswer.assignmentQuestionId,
				)
				essayQuestions.push({
					id: userAttemptAnswer.assignmentQuestionId,
					question: question?.content || "",
					userAnswer: userAttemptAnswer.essayAnswer || "",
					expectedAnswer:
						question?.assignmentQuestionEssayReferenceAnswer?.content,
					context: question?.assignmentQuestionEssayReferenceAnswer?.content,
				})
			} else {
				nonEssayQuestions.push(userAttemptAnswer)
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
						score += 1
					}
					break
				case AssignmentQuestionType.TRUE_FALSE:
					let correctAnswer = correctAnswers.find(
						(answer) => answer.id === userAttemptAnswer.assignmentQuestionId,
					)?.assignmentQuestionTrueFalseAnswer?.correctAnswer

					if (correctAnswer === userAttemptAnswer.trueFalseAnswer) {
						isCorrect = true
						score += 1
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

			const essayResults = await evaluateEssayAnswers(essayQuestions)

			for (const { questionId, result } of essayResults) {
				const isCorrect = result.isCorrect
				if (isCorrect) {
					score += 1
				}

				Logger.info(`AssignmentAttemptService.calculateAssignmentScore`, {
					message: `AI scored essay question ${questionId}, Is correct: ${isCorrect}, Score: ${result.score}, Confidence: ${result.confidence}`,
					aiScore: result.score,
					aiFeedback: result.feedback,
					aiConfidence: result.confidence,
				})

				await AssignmentAttemptRepository.setCorrectAnswer(
					assignmentUserAttemptId,
					questionId,
					isCorrect,
				)
			}
		}

		// Calculate percentage score
		const totalQuestions = assignmentUserAttemptAnswers.length
		const percentageScore =
			totalQuestions > 0
				? Number(((score / totalQuestions) * 100).toFixed(2))
				: 0

		await AssignmentAttemptRepository.submitAssignment(
			assignmentUserAttemptId,
			score,
			percentageScore,
		)

		Logger.info(`AssignmentAttemptService.calculateAssignmentScore`, {
			message: `Assignment scored successfully. Total score: ${score}/${totalQuestions} (${percentageScore}%)`,
			totalScore: score,
			totalQuestions: totalQuestions,
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

		const [questions, assignmentUserAttemptAnswers] = await Promise.all([
			AssignmentQuestionRepository.getAllQuestions(
				assignmentAttempt.assignmentId,
			),
			AssignmentAttemptRepository.getAllUserAttemptAnswers(
				assignmentAttempt.id,
			),
		])

		const mappedQuestions = questions.map((question) => {
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
				await pubsub.sendToQueue(PUBSUB_TOPICS.ASSIGNMENT_ATTEMPT_SUBMIT, {
					assignmentUserAttemptId: assignment.id,
				})
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
							}
						}),
						isCorrect: assignmentUserAttemptAnswer?.isAnswerCorrect,
						userAnswer: assignmentUserAttemptAnswer?.assignmentQuestionOptionId,
					}
				} else if (question.type === AssignmentQuestionType.ESSAY) {
					return {
						id: question.id,
						order: question.order,
						content: question.content,
						type: question.type,
						isCorrect: assignmentUserAttemptAnswer?.isAnswerCorrect,
						userAnswer: assignmentUserAttemptAnswer?.essayAnswer,
					}
				} else if (question.type === AssignmentQuestionType.TRUE_FALSE) {
					return {
						id: question.id,
						order: question.order,
						content: question.content,
						type: question.type,
						isCorrect: assignmentUserAttemptAnswer?.isAnswerCorrect,
						userAnswer: assignmentUserAttemptAnswer?.trueFalseAnswer,
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

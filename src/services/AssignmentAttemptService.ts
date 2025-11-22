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

export async function create(
    assignmentId: string,
    userId: string
): Promise<ServiceResponse<AssignmentUserAttempt | {}>> {
    try {
        const currentUserAssignmentAttempt =
            await AssignmentAttemptRepository.getCurrentUserAssignmentAttemptByUserId(userId)
        if (currentUserAssignmentAttempt) {
            return HandleServiceResponseCustomError(
                "User already has an assignment in progress",
                ResponseStatus.BAD_REQUEST
            )
        }

        const existingAssignmentAttempt =
            await AssignmentAttemptRepository.getByUserIdAndAssignmentId(userId, assignmentId)
        if (existingAssignmentAttempt) {
            return HandleServiceResponseCustomError(
                "Invalid assignment attempt",
                ResponseStatus.NOT_FOUND
            )
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
    userId: string
): Promise<ServiceResponse<AssignmentUserAttempt | {}>> {
    try {
        const data = await AssignmentAttemptRepository.getCurrentUserAssignmentAttemptByUserId(
            userId
        )

        if (!data) {
            return HandleServiceResponseCustomError(
                "Assignment user attempt not found",
                ResponseStatus.NOT_FOUND
            )
        }

        return HandleServiceResponseSuccess(data)
    } catch (err) {
        Logger.error(`AssignmentAttemptService.getCurrentUserAssignmentAttemptByUserId`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function updateAnswer(
    userId: string,
    assignmentId: string,
    data: AssignmentUserAttemptAnswerDTO
): Promise<ServiceResponse<AssignmentUserAttemptQuestionAnswer | {}>> {
    try {
        const assignmentAttempt = await AssignmentAttemptRepository.getByUserIdAndAssignmentId(
            userId,
            assignmentId
        )
        if (!assignmentAttempt) {
            return HandleServiceResponseCustomError(
                "Assignment user attempt not found",
                ResponseStatus.NOT_FOUND
            )
        }

        if (assignmentAttempt.isSubmitted) {
            return HandleServiceResponseCustomError(
                "Assignment user attempt already submitted",
                ResponseStatus.BAD_REQUEST
            )
        }

        const assignmentUserAttemptQuestionAnswer =
            await AssignmentAttemptRepository.getByAssignmentUserAttemptIdAndAssignmentQuestionId(
                assignmentAttempt.id,
                data.assignmentQuestionId
            )

        if (!assignmentUserAttemptQuestionAnswer) {
            return HandleServiceResponseCustomError(
                "Assignment user attempt question answer not found",
                ResponseStatus.NOT_FOUND
            )
        }

        const answer = await AssignmentAttemptRepository.updateAnswer(assignmentAttempt.id, data)
        return HandleServiceResponseSuccess(answer)
    } catch (err) {
        Logger.error(`AssignmentAttemptService.updateAnswer`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function submitAssignment(
    userId: string,
    assignmentId: string
): Promise<ServiceResponse<AssignmentUserAttempt | {}>> {
    try {
        const assignmentAttempt = await AssignmentAttemptRepository.getByUserIdAndAssignmentId(
            userId,
            assignmentId
        )
        if (!assignmentAttempt) {
            return HandleServiceResponseCustomError(
                "Assignment user attempt not found",
                ResponseStatus.NOT_FOUND
            )
        }

        if (assignmentAttempt.isSubmitted) {
            return HandleServiceResponseCustomError(
                "Assignment user attempt already submitted",
                ResponseStatus.BAD_REQUEST
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

export async function calculateAssignmentScore(assignmentUserAttemptId: string) {
    try {
        const assignmentAttempt = await AssignmentAttemptRepository.getById(assignmentUserAttemptId)
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
            AssignmentQuestionRepository.getCorrectQuestionAnswers(assignmentAttempt.assignmentId),
            AssignmentAttemptRepository.getAllUserAttemptAnswers(assignmentUserAttemptId),
        ])

        let score = 0

        for (const userAttemptAnswer of assignmentUserAttemptAnswers) {
            let isCorrect = false
            switch (userAttemptAnswer.type) {
                case AssignmentQuestionType.MULTIPLE_CHOICE:
                    let correctAnswerChoiceId = correctAnswers.find(
                        (answer) => answer.id === userAttemptAnswer.assignmentQuestionId
                    )?.assignmentQuestionOptions[0].id

                    if (correctAnswerChoiceId === userAttemptAnswer.assignmentQuestionOptionId) {
                        isCorrect = true
                        score += 1
                    }
                    break
                case AssignmentQuestionType.TRUE_FALSE:
                    let correctAnswer = correctAnswers.find(
                        (answer) => answer.id === userAttemptAnswer.assignmentQuestionId
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
                isCorrect
            )
        }

        await AssignmentAttemptRepository.submitAssignment(assignmentUserAttemptId, score)
    } catch (err) {
        Logger.error(`AssignmentAttemptService.calculateAssignmentScore`, {
            error: err,
        })
    }
}

export async function getAllQuestionsAndAnswers(
    userId: string,
    assignmentId: string
): Promise<ServiceResponse<any[] | {}>> {
    try {
        const assignmentAttempt = await AssignmentAttemptRepository.getByUserIdAndAssignmentId(
            userId,
            assignmentId
        )
        if (!assignmentAttempt) {
            return HandleServiceResponseCustomError(
                "Assignment user attempt not found",
                ResponseStatus.NOT_FOUND
            )
        }

        if (assignmentAttempt.isSubmitted) {
            return HandleServiceResponseCustomError(
                "Assignment user attempt already submitted",
                ResponseStatus.BAD_REQUEST
            )
        }

        const [questions, assignmentUserAttemptAnswers] = await Promise.all([
            AssignmentQuestionRepository.getAllQuestions(assignmentAttempt.assignmentId),
            AssignmentAttemptRepository.getAllUserAttemptAnswers(assignmentAttempt.id),
        ])

        const mappedQuestions = questions.map((question) => {
            const assignmentUserAttemptAnswer = assignmentUserAttemptAnswers.find(
                (answer) => answer.assignmentQuestionId === question.id
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
        const assignments = await AssignmentAttemptRepository.getUnsubmittedAssignmentUserAttempts()
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

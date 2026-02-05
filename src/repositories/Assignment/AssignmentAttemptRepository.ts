import { prisma } from "$pkg/prisma"
import { ulid } from "ulid"
import {
	AssignmentQuestionType,
	Prisma,
} from "../../../generated/prisma/client"
import { AssignmentUserAttemptAnswerDTO } from "$entities/Assignment"

export async function create(assignmentId: string, userId: string) {
	return await prisma.$transaction(async (tx) => {
		const assginmentAttempt = await tx.assignmentUserAttempt.create({
			data: {
				id: ulid(),
				assignmentId,
				userId,
				randomSeed: Math.floor(Math.random() * 1000000),
			},
		})

		const questions = await tx.assignmentQuestion.findMany({
			where: {
				assignmentId,
			},
		})

		const assignmentUserAttemptQuestionAnswersCreateManyInput: Prisma.AssignmentUserAttemptQuestionAnswerCreateManyInput[] =
			[]

		for (const question of questions) {
			assignmentUserAttemptQuestionAnswersCreateManyInput.push({
				id: ulid(),
				assignmentUserAttemptId: assginmentAttempt.id,
				assignmentQuestionId: question.id,
				type: question.type,
			})
		}

		await tx.assignmentUserAttemptQuestionAnswer.createMany({
			data: assignmentUserAttemptQuestionAnswersCreateManyInput,
		})

		return assginmentAttempt
	})
}

export async function getCurrentUserAssignmentAttemptByUserId(userId: string) {
	return await prisma.assignmentUserAttempt.findFirst({
		where: {
			userId,
			isSubmitted: false,
		},
		orderBy: {
			createdAt: "desc",
		},
	})
}

export async function updateAnswer(
	assignmentUserAttemptId: string,
	data: AssignmentUserAttemptAnswerDTO,
) {
	return await prisma.$transaction(async (tx) => {
		const answerAttempt =
			await tx.assignmentUserAttemptQuestionAnswer.findUnique({
				where: {
					assignmentUserAttemptId_assignmentQuestionId: {
						assignmentUserAttemptId,
						assignmentQuestionId: data.assignmentQuestionId,
					},
				},
			})

		if (!answerAttempt) {
			throw new Error("Assignment user attempt question answer not found")
		}

		let dataToUpdate: any = {}

		switch (answerAttempt.type) {
			case AssignmentQuestionType.MULTIPLE_CHOICE:
				dataToUpdate = {
					assignmentQuestionOptionId: data.optionAnswerId,
				}
				break
			case AssignmentQuestionType.MULTIPLE_SELECT:
				if (data.optionAnswerIds) {
					// 1. Clear existing options
					await tx.assignmentUserAttemptQuestionAnswerOption.deleteMany({
						where: {
							assignmentUserAttemptQuestionAnswerId: answerAttempt.id,
						},
					})

					// 2. Insert new options
					if (data.optionAnswerIds.length > 0) {
						await tx.assignmentUserAttemptQuestionAnswerOption.createMany({
							data: data.optionAnswerIds.map((optId) => ({
								id: ulid(),
								assignmentUserAttemptQuestionAnswerId: answerAttempt.id,
								assignmentQuestionOptionId: optId,
							})),
						})
					}
				}
				break
			case AssignmentQuestionType.ESSAY:
				dataToUpdate = {
					essayAnswer: data.essayAnswer,
				}
				break
			case AssignmentQuestionType.TRUE_FALSE:
				dataToUpdate = {
					trueFalseAnswer: data.trueFalseAnswer,
				}
				break
			default:
				throw new Error("Assignment question type not supported")
		}

		return await tx.assignmentUserAttemptQuestionAnswer.update({
			where: {
				assignmentUserAttemptId_assignmentQuestionId: {
					assignmentUserAttemptId,
					assignmentQuestionId: data.assignmentQuestionId,
				},
			},
			data: dataToUpdate,
		})
	})
}

// export async function updateAssignmentUserAttemptAnswers(
//     assignmentId: string,
//     userId: string,
//     data: AssignmentUserAttemptAnswerDTO[]
// ) {
//     return await prisma.$transaction(async (tx) => {
//         const assignmentUserAttempt = await tx.assignmentUserAttempt.findFirst({
//             where: {
//                 assignmentId,
//                 userId,
//                 isSubmitted: false,
//             },
//             orderBy: {
//                 createdAt: "desc",
//             },
//         })

//         if (!assignmentUserAttempt) {
//             throw new Error("Assignment user attempt not found")
//         }

//         for (const answer of data) {
//             switch (answer.type) {
//                 case AssignmentQuestionType.MULTIPLE_CHOICE:
//                     await tx.assignmentUserAttemptQuestionAnswer.update({
//                         where: {
//                             assignmentUserAttemptId_assignmentQuestionId: {
//                                 assignmentUserAttemptId: assignmentUserAttempt.id,
//                                 assignmentQuestionId: answer.assignmentQuestionId,
//                             },
//                         },
//                         data: {
//                             assignmentQuestionOptionId: answer.optionAnswerId,
//                         },
//                     })
//                     break
//                 case AssignmentQuestionType.ESSAY:
//                     await tx.assignmentUserAttemptQuestionAnswer.update({
//                         where: {
//                             assignmentUserAttemptId_assignmentQuestionId: {
//                                 assignmentUserAttemptId: assignmentUserAttempt.id,
//                                 assignmentQuestionId: answer.assignmentQuestionId,
//                             },
//                         },
//                         data: {
//                             essayAnswer: answer.essayAnswer,
//                         },
//                     })
//                     break
//                 case AssignmentQuestionType.TRUE_FALSE:
//                     await tx.assignmentUserAttemptQuestionAnswer.update({
//                         where: {
//                             assignmentUserAttemptId_assignmentQuestionId: {
//                                 assignmentUserAttemptId: assignmentUserAttempt.id,
//                                 assignmentQuestionId: answer.assignmentQuestionId,
//                             },
//                         },
//                         data: {
//                             trueFalseAnswer: answer.trueFalseAnswer,
//                         },
//                     })
//                     break
//                 default:
//                     break
//             }
//         }
//     })
// }

export async function getAllUserAttemptAnswers(
	assignmentUserAttemptId: string,
) {
	return await prisma.assignmentUserAttemptQuestionAnswer.findMany({
		where: {
			assignmentUserAttemptId,
		},
		include: {
			assignmentQuestionOption: true,
			selectedOptions: true,
		},
	})
}

export async function markAsSubmitted(assignmentUserAttemptId: string) {
	return await prisma.assignmentUserAttempt.update({
		where: {
			id: assignmentUserAttemptId,
		},
		data: {
			isSubmitted: true,
			submittedAt: new Date(),
		},
	})
}

export async function submitAssignment(
	assignmentUserAttemptId: string,
	score: number,
	percentageScore?: number,
) {
	return await prisma.assignmentUserAttempt.update({
		where: {
			id: assignmentUserAttemptId,
		},
		data: {
			isSubmitted: true,
			score: score,
			percentageScore: percentageScore,
			submittedAt: new Date(),
		},
	})
}

export async function getById(assignmentUserAttemptId: string) {
	return await prisma.assignmentUserAttempt.findUnique({
		where: {
			id: assignmentUserAttemptId,
		},
	})
}

export async function setCorrectAnswer(
	assignmentUserAttemptId: string,
	assignmentQuestionId: string,
	isCorrect: boolean,
	aiGradingReasoning?: string,
) {
	return await prisma.assignmentUserAttemptQuestionAnswer.update({
		where: {
			assignmentUserAttemptId_assignmentQuestionId: {
				assignmentUserAttemptId,
				assignmentQuestionId,
			},
		},
		data: {
			isAnswerCorrect: isCorrect,
			...(aiGradingReasoning && { aiGradingReasoning }),
		},
	})
}

export async function getByAssignmentUserAttemptIdAndAssignmentQuestionId(
	assignmentUserAttemptId: string,
	assignmentQuestionId: string,
) {
	return await prisma.assignmentUserAttemptQuestionAnswer.findUnique({
		where: {
			assignmentUserAttemptId_assignmentQuestionId: {
				assignmentUserAttemptId,
				assignmentQuestionId,
			},
		},
	})
}

export async function getByUserIdAndAssignmentId(
	userId: string,
	assignmentId: string,
) {
	return await prisma.assignmentUserAttempt.findUnique({
		where: {
			userId_assignmentId: {
				userId,
				assignmentId,
			},
		},
	})
}

export async function getUnsubmittedAssignmentUserAttempts() {
	return await prisma.assignmentUserAttempt.findMany({
		where: {
			isSubmitted: false,
		},
		include: {
			assignment: true,
		},
	})
}

export async function isAttemptTimeValid(
	assignmentUserAttemptId: string,
	gracePeriodMs: number = 60000,
): Promise<boolean> {
	const attempt = await prisma.assignmentUserAttempt.findUnique({
		where: { id: assignmentUserAttemptId },
		include: { assignment: true },
	})

	if (!attempt || !attempt.assignment) {
		return false
	}

	// Calculate expiration: createdAt + gracePeriod + duration
	const expirationTime =
		attempt.createdAt.getTime() +
		gracePeriodMs +
		attempt.assignment.durationInMinutes * 60000

	return Date.now() < expirationTime
}

export async function getHistoryUserAssignmentAttempts(
	userId: string,
	assignmentId: string,
) {
	return await prisma.assignmentUserAttempt.findUnique({
		where: {
			userId_assignmentId: {
				userId,
				assignmentId,
			},
			isSubmitted: true,
		},
		include: {
			assignment: {
				include: {
					assignmentQuestions: {
						include: {
							assignmentQuestionOptions: true,
							assignmentQuestionEssayReferenceAnswer: true,
							assignmentQuestionTrueFalseAnswer: true,
						},
					},
				},
			},
			assignmentUserAttemptQuestionAnswers: {
				include: {
					selectedOptions: true,
					assignmentQuestionOption: true,
				},
			},
		},
	})
}

export async function getUserTotalPointAssignment(
	userId: string,
	tenantId: string,
) {
	return await prisma.$queryRaw`
        SELECT
            SUM(aua.score)
        FROM "AssignmentUserAttempt" aua
        JOIN "Assignment" a ON aua."assignmentId" = a.id
        WHERE a."tenantId" = ${tenantId}
        AND aua."userId" = ${userId}
        AND aua."isSubmitted" = true
    `
}
export async function getSubmittedAttemptsByAssignmentId(assignmentId: string) {
	return await prisma.assignmentUserAttempt.findMany({
		where: {
			assignmentId,
			isSubmitted: true,
		},
	})
}

export async function getAllSubmittedAttemptsByAssignmentId(
	assignmentId: string,
) {
	return await prisma.assignmentUserAttempt.findMany({
		where: {
			assignmentId,
			isSubmitted: true,
		},
	})
}

export async function getUserById(userId: string) {
	return await prisma.user.findUniqueOrThrow({
		where: {
			id: userId,
		},
	})
}

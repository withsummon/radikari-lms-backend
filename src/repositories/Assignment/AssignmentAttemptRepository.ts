import { prisma } from "$pkg/prisma"
import { ulid } from "ulid"
import { AssignmentQuestionType, Prisma } from "../../../generated/prisma/client"
import { AssignmentUserAttemptAnswerDTO } from "$entities/Assignment"

export async function create(assignmentId: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
        const assginmentAttempt = await tx.assignmentUserAttempt.create({
            data: {
                id: ulid(),
                assignmentId,
                userId,
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
    data: AssignmentUserAttemptAnswerDTO
) {
    const assignmentQuestion = await prisma.assignmentQuestion.findUnique({
        where: {
            id: data.assignmentQuestionId,
        },
    })

    let dataToUpdate: any = {}

    switch (assignmentQuestion!.type) {
        case AssignmentQuestionType.MULTIPLE_CHOICE:
            dataToUpdate = {
                assignmentQuestionOptionId: data.optionAnswerId,
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

    return await prisma.assignmentUserAttemptQuestionAnswer.update({
        where: {
            assignmentUserAttemptId_assignmentQuestionId: {
                assignmentUserAttemptId,
                assignmentQuestionId: data.assignmentQuestionId,
            },
        },
        data: dataToUpdate,
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

export async function getAllUserAttemptAnswers(assignmentUserAttemptId: string) {
    return await prisma.assignmentUserAttemptQuestionAnswer.findMany({
        where: {
            assignmentUserAttemptId,
        },
        include: {
            assignmentQuestionOption: true,
        },
    })
}

export async function submitAssignment(assignmentUserAttemptId: string, score: number) {
    return await prisma.assignmentUserAttempt.update({
        where: {
            id: assignmentUserAttemptId,
        },
        data: {
            isSubmitted: true,
            score: score,
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
    isCorrect: boolean
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
        },
    })
}

export async function getByAssignmentUserAttemptIdAndAssignmentQuestionId(
    assignmentUserAttemptId: string,
    assignmentQuestionId: string
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

export async function getByUserIdAndAssignmentId(userId: string, assignmentId: string) {
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

export async function getHistoryUserAssignmentAttempts(userId: string, assignmentId: string) {
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
            assignmentUserAttemptQuestionAnswers: true,
        },
    })
}

export async function getUserTotalPointAssignment(userId: string, tenantId: string) {
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

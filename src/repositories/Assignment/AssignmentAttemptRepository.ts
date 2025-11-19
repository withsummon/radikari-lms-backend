import { prisma } from "$pkg/prisma"
import { ulid } from "ulid"
import { AssignmentQuestionType, Prisma } from "../../../generated/prisma/client"

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

        const assginmentUserAttemptOptionAnswersCreateManyInput: Prisma.AssignmentUserAttemptOptionAnswerCreateManyInput[] =
            []
        const assginmentUserAttemptEssayAnswersCreateManyInput: Prisma.AssignmentUserAttemptEssayAnswerCreateManyInput[] =
            []
        const assginmentUserAttemptTrueFalseAnswersCreateManyInput: Prisma.AssignmentUserAttemptTrueFalseAnswerCreateManyInput[] =
            []

        for (const question of questions) {
            switch (question.type) {
                case AssignmentQuestionType.MULTIPLE_CHOICE:
                    assginmentUserAttemptOptionAnswersCreateManyInput.push({
                        id: ulid(),
                        assignmentUserAttemptId: assginmentAttempt.id,
                        assignmentQuestionId: question.id,
                    })
                    break
                case AssignmentQuestionType.ESSAY:
                    assginmentUserAttemptEssayAnswersCreateManyInput.push({
                        id: ulid(),
                        assignmentUserAttemptId: assginmentAttempt.id,
                        assignmentQuestionId: question.id,
                    })
                    break
                case AssignmentQuestionType.TRUE_FALSE:
                    assginmentUserAttemptTrueFalseAnswersCreateManyInput.push({
                        id: ulid(),
                        assignmentUserAttemptId: assginmentAttempt.id,
                        assignmentQuestionId: question.id,
                    })
                    break
                default:
                    break
            }
        }

        await tx.assignmentUserAttemptOptionAnswer.createMany({
            data: assginmentUserAttemptOptionAnswersCreateManyInput,
        })
        await tx.assignmentUserAttemptEssayAnswer.createMany({
            data: assginmentUserAttemptEssayAnswersCreateManyInput,
        })
        await tx.assignmentUserAttemptTrueFalseAnswer.createMany({
            data: assginmentUserAttemptTrueFalseAnswersCreateManyInput,
        })

        return assginmentAttempt
    })
}

export async function currentAssignmentAttempt(assignmentId: string, userId: string) {
    return await prisma.assignmentUserAttempt.findFirst({
        where: {
            assignmentId,
            userId,
            isSubmitted: false,
        },
        orderBy: {
            createdAt: "desc",
        },
    })
}

// export async function updateAssignmentUserAttemptAnswers(assignmentId: string, userId: string, data: AssignmentUserAttemptAnswersDTO) {
//     return await prisma.$transaction(async (tx) => {
//         const assignmentUserAttempt = await tx.assignmentUserAttempt.findFirst({
//             where: {
//                 assignmentId,
//                 userId,
//             },
//         })
//     })
// }

import {
	AssignmentQuestionType,
	Prisma,
} from "../../../generated/prisma/client"
import { AssignmentQuestionDTO } from "$entities/Assignment"
import { ulid } from "ulid"
import { prisma } from "$pkg/prisma"

export async function createMany(
	tx: Prisma.TransactionClient,
	data: AssignmentQuestionDTO[],
	assignmentId: string,
) {
	const questionCreateManyInput: Prisma.AssignmentQuestionCreateManyInput[] = []
	const questionOptionCreateManyInput: Prisma.AssignmentQuestionOptionCreateManyInput[] =
		[]
	const questionTrueFalseAnswerCreateManyInput: Prisma.AssignmentQuestionTrueFalseAnswerCreateManyInput[] =
		[]
	const questionEssayReferenceAnswerCreateManyInput: Prisma.AssignmentQuestionEssayReferenceAnswerCreateManyInput[] =
		[]

	for (const item of data) {
		const { options, trueFalseAnswer, essayReferenceAnswer, ...rest } = item

		const questionId = ulid()
		questionCreateManyInput.push({
			...rest,
			id: questionId,
			assignmentId,
		})

		switch (item.type) {
			case AssignmentQuestionType.MULTIPLE_CHOICE:
				questionOptionCreateManyInput.push(
					...options.map((option) => ({
						...option,
						assignmentQuestionId: questionId,
						id: ulid(),
					})),
				)
				break
			case AssignmentQuestionType.TRUE_FALSE:
				questionTrueFalseAnswerCreateManyInput.push({
					...trueFalseAnswer!,
					assignmentQuestionId: questionId,
					id: ulid(),
				})
				break
			case AssignmentQuestionType.ESSAY:
				questionEssayReferenceAnswerCreateManyInput.push({
					...essayReferenceAnswer!,
					assignmentQuestionId: questionId,
					id: ulid(),
				})
				break
		}
	}

	await tx.assignmentQuestion.createMany({
		data: questionCreateManyInput,
	})
	await tx.assignmentQuestionOption.createMany({
		data: questionOptionCreateManyInput,
	})
	await tx.assignmentQuestionTrueFalseAnswer.createMany({
		data: questionTrueFalseAnswerCreateManyInput,
	})
	await tx.assignmentQuestionEssayReferenceAnswer.createMany({
		data: questionEssayReferenceAnswerCreateManyInput,
	})
}

export async function updateMany(
	tx: Prisma.TransactionClient,
	data: AssignmentQuestionDTO[],
	assignmentId: string,
) {
	const existingQuestions = await tx.assignmentQuestion.findMany({
		where: {
			assignmentId,
		},
	})

	const incomingQuestionOrders = data
		.filter((question) => question.id !== undefined)
		.map((question) => question.order)
	const toDeleteQuestionOrders = existingQuestions
		.filter((question) => !incomingQuestionOrders.includes(question.order))
		.map((question) => question.order)
	const toUpdateQuestionOrders = existingQuestions
		.filter((question) => incomingQuestionOrders.includes(question.order))
		.map((question) => question.order)

	await tx.assignmentQuestion.deleteMany({
		where: {
			assignmentId,
			order: {
				in: toDeleteQuestionOrders,
			},
		},
	})

	const questionCreateManyInput: Prisma.AssignmentQuestionCreateManyInput[] = []
	const questionOptionCreateManyInput: Prisma.AssignmentQuestionOptionCreateManyInput[] =
		[]
	const questionTrueFalseAnswerCreateManyInput: Prisma.AssignmentQuestionTrueFalseAnswerCreateManyInput[] =
		[]
	const questionEssayReferenceAnswerCreateManyInput: Prisma.AssignmentQuestionEssayReferenceAnswerCreateManyInput[] =
		[]

	for (const question of data) {
		if (toUpdateQuestionOrders.includes(question.order)) {
			const updatedQuestion = await tx.assignmentQuestion.update({
				where: {
					assignmentId_order: {
						assignmentId,
						order: question.order,
					},
				},
				data: {
					content: question.content,
					type: question.type,
				},
			})

			switch (question.type) {
				case AssignmentQuestionType.MULTIPLE_CHOICE:
					await tx.assignmentQuestionOption.deleteMany({
						where: {
							assignmentQuestionId: updatedQuestion.id,
						},
					})
					questionOptionCreateManyInput.push(
						...question.options.map((option) => ({
							...option,
							assignmentQuestionId: updatedQuestion.id,
							id: ulid(),
						})),
					)
					break
				case AssignmentQuestionType.ESSAY:
					await tx.assignmentQuestionEssayReferenceAnswer.update({
						where: {
							assignmentQuestionId: updatedQuestion.id,
						},
						data: {
							content: question.essayReferenceAnswer!.content,
						},
					})
					break
				case AssignmentQuestionType.TRUE_FALSE:
					await tx.assignmentQuestionTrueFalseAnswer.update({
						where: {
							assignmentQuestionId: updatedQuestion.id,
						},
						data: {
							correctAnswer: question.trueFalseAnswer!.correctAnswer,
						},
					})
					break
				default:
					break
			}
		} else {
			const questionId = ulid()

			questionCreateManyInput.push({
				content: question.content,
				type: question.type,
				order: question.order,
				assignmentId,
				id: questionId,
			})

			switch (question.type) {
				case AssignmentQuestionType.MULTIPLE_CHOICE:
					questionOptionCreateManyInput.push(
						...question.options.map((option) => ({
							...option,
							assignmentQuestionId: questionId,
							id: ulid(),
						})),
					)
					break
				case AssignmentQuestionType.ESSAY:
					questionEssayReferenceAnswerCreateManyInput.push({
						...question.essayReferenceAnswer!,
						assignmentQuestionId: questionId,
						id: ulid(),
					})
					break
				case AssignmentQuestionType.TRUE_FALSE:
					questionTrueFalseAnswerCreateManyInput.push({
						...question.trueFalseAnswer!,
						assignmentQuestionId: questionId,
						id: ulid(),
					})
					break
				default:
					break
			}
		}
	}

	await tx.assignmentQuestion.createMany({
		data: questionCreateManyInput,
	})
	await tx.assignmentQuestionOption.createMany({
		data: questionOptionCreateManyInput,
	})
	await tx.assignmentQuestionTrueFalseAnswer.createMany({
		data: questionTrueFalseAnswerCreateManyInput,
	})
	await tx.assignmentQuestionEssayReferenceAnswer.createMany({
		data: questionEssayReferenceAnswerCreateManyInput,
	})
}

export async function getAllQuestions(assignmentId: string) {
	return await prisma.assignmentQuestion.findMany({
		where: {
			assignmentId,
		},
		include: {
			assignmentQuestionOptions: {
				select: {
					id: true,
					content: true,
				},
			},
			assignmentQuestionTrueFalseAnswer: true,
			assignmentQuestionEssayReferenceAnswer: true,
		},
	})
}

export async function getCorrectQuestionAnswers(assignmentId: string) {
	return await prisma.assignmentQuestion.findMany({
		where: {
			assignmentId,
		},
		include: {
			assignmentQuestionOptions: {
				where: {
					isCorrectAnswer: true,
				},
			},
			assignmentQuestionTrueFalseAnswer: true,
			assignmentQuestionEssayReferenceAnswer: true,
		},
	})
}

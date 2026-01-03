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
			points: item.points,
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
	// 1. Validate / Get existing questions to map by ID
	const existingQuestions = await tx.assignmentQuestion.findMany({
		where: {
			assignmentId,
		},
		include: {
			assignmentQuestionOptions: true, // Need options to do smart diffing
		},
	})

	const existingQuestionMap = new Map<string, (typeof existingQuestions)[0]>()
	existingQuestions.forEach((q) => existingQuestionMap.set(q.id, q))

	// 2. Identify Questions to Keep/Update vs Delete
	// Incoming IDs that strictly match existing DB IDs
	const incomingIds = data
		.map((d) => d.id)
		.filter(
			(id): id is string => id !== undefined && existingQuestionMap.has(id),
		)

	// Questions in DB not present in incoming payload -> DELETE
	const questionsToDelete = existingQuestions.filter(
		(q) => !incomingIds.includes(q.id),
	)

	// DELETE removed questions (and cascading children)
	if (questionsToDelete.length > 0) {
		await tx.assignmentQuestion.deleteMany({
			where: {
				id: { in: questionsToDelete.map((q) => q.id) },
			},
		})
	}

	// 3. Process Upserts (Update existing or Create new)
	for (const questionData of data) {
		// A. UPDATE Existing Question
		if (questionData.id && existingQuestionMap.has(questionData.id)) {
			const existingQ = existingQuestionMap.get(questionData.id)!

			// Update base fields
			const updatedQuestion = await tx.assignmentQuestion.update({
				where: { id: questionData.id },
				data: {
					content: questionData.content,
					type: questionData.type,
					points: questionData.points,
					order: questionData.order, // Allow reordering
				},
			})

			// Handle Relation Updates based on Type
			switch (questionData.type) {
				case AssignmentQuestionType.MULTIPLE_CHOICE: {
					// Smart Update Options to preserve IDs (and User Answers!)
					const incomingOptions = questionData.options || []
					const existingOptions = existingQ.assignmentQuestionOptions
					const existingOptionMap = new Map(
						existingOptions.map((o) => [o.id, o]),
					)

					const incomingOptionIds = incomingOptions
						.map((o) => o.id)
						.filter(
							(id): id is string =>
								id !== undefined && existingOptionMap.has(id),
						)

					// Delete removed options
					const optionsToDelete = existingOptions.filter(
						(o) => !incomingOptionIds.includes(o.id),
					)
					if (optionsToDelete.length > 0) {
						await tx.assignmentQuestionOption.deleteMany({
							where: { id: { in: optionsToDelete.map((o) => o.id) } },
						})
					}

					// Upsert Options
					for (const opt of incomingOptions) {
						if (opt.id && existingOptionMap.has(opt.id)) {
							// Update
							await tx.assignmentQuestionOption.update({
								where: { id: opt.id },
								data: {
									content: opt.content,
									isCorrectAnswer: opt.isCorrectAnswer,
								},
							})
						} else {
							// Create New Option
							await tx.assignmentQuestionOption.create({
								data: {
									id: ulid(),
									assignmentQuestionId: updatedQuestion.id,
									content: opt.content,
									isCorrectAnswer: opt.isCorrectAnswer,
								},
							})
						}
					}
					break
				}
				case AssignmentQuestionType.TRUE_FALSE:
					// True/False usually has 1-to-1 relation, straightforward update or create if missing
					// The previous logic assumed update if Question exists.
					// But if type changed from something else to TF, we might need to create.
					// Prisma's upsert is useful here.
					if (questionData.trueFalseAnswer) {
						await tx.assignmentQuestionTrueFalseAnswer.upsert({
							where: { assignmentQuestionId: updatedQuestion.id },
							create: {
								id: ulid(),
								assignmentQuestionId: updatedQuestion.id,
								correctAnswer: questionData.trueFalseAnswer.correctAnswer,
							},
							update: {
								correctAnswer: questionData.trueFalseAnswer.correctAnswer,
							},
						})
					}
					break
				case AssignmentQuestionType.ESSAY:
					if (questionData.essayReferenceAnswer) {
						await tx.assignmentQuestionEssayReferenceAnswer.upsert({
							where: { assignmentQuestionId: updatedQuestion.id },
							create: {
								id: ulid(),
								assignmentQuestionId: updatedQuestion.id,
								content: questionData.essayReferenceAnswer.content,
							},
							update: {
								content: questionData.essayReferenceAnswer.content,
							},
						})
					}
					break
			}
		}
		// B. CREATE New Question
		else {
			const newQuestionId = ulid()
			await tx.assignmentQuestion.create({
				data: {
					id: newQuestionId,
					assignmentId,
					content: questionData.content,
					type: questionData.type,
					points: questionData.points,
					order: questionData.order,
				},
			})

			// Create Relations
			switch (questionData.type) {
				case AssignmentQuestionType.MULTIPLE_CHOICE:
					if (questionData.options?.length) {
						await tx.assignmentQuestionOption.createMany({
							data: questionData.options.map((o) => ({
								id: ulid(),
								assignmentQuestionId: newQuestionId,
								content: o.content,
								isCorrectAnswer: o.isCorrectAnswer,
							})),
						})
					}
					break
				case AssignmentQuestionType.TRUE_FALSE:
					if (questionData.trueFalseAnswer) {
						await tx.assignmentQuestionTrueFalseAnswer.create({
							data: {
								id: ulid(),
								assignmentQuestionId: newQuestionId,
								correctAnswer: questionData.trueFalseAnswer.correctAnswer,
							},
						})
					}
					break
				case AssignmentQuestionType.ESSAY:
					if (questionData.essayReferenceAnswer) {
						await tx.assignmentQuestionEssayReferenceAnswer.create({
							data: {
								id: ulid(),
								assignmentQuestionId: newQuestionId,
								content: questionData.essayReferenceAnswer.content,
							},
						})
					}
					break
			}
		}
	}
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

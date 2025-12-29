import {
	AssignmentAccess,
	AssignmentQuestionType,
} from "../../generated/prisma/client"

export interface AssignmentCreateDTO {
	id: string
	title: string
	durationInMinutes: number
	tenantId: string
	createdByUserId: string
	expiredDate: string
	access: AssignmentAccess
	roleAccesses: string[]
	userEmails: string[]
	isRandomized: boolean
	questions: AssignmentQuestionDTO[]
}

export interface AssignmentDTO {
	id: string
	title: string
	durationInMinutes: number
	tenantId: string
	createdByUserId: string
	expiredDate: string
	access: AssignmentAccess
	isRandomized: boolean
}

export interface AssignmentQuestionDTO {
	id: string
	order: number
	assignmentId: string
	content: string
	type: AssignmentQuestionType
	options: AssignmentQuestionOptionDTO[]
	trueFalseAnswer?: AssignmentQuestionTrueFalseAnswerDTO
	essayReferenceAnswer?: AssignmentQuestionEssayReferenceAnswerDTO
}

export interface AssignmentQuestionOptionDTO {
	id: string
	assignmentQuestionId: string
	content: string
	isCorrectAnswer: boolean
}

export interface AssignmentQuestionTrueFalseAnswerDTO {
	id: string
	assignmentQuestionId: string
	correctAnswer: boolean
}

export interface AssignmentQuestionEssayReferenceAnswerDTO {
	id: string
	assignmentQuestionId: string
	content: string
}

export interface AssignmentAttemptDTO {
	id: string
	assignmentId: string
	userId: string
	score: number
	percentageScore: number
	isSubmitted: boolean
	submittedAt: Date
}

export interface AssignmentUserAttemptAnswerDTO {
	assignmentQuestionId: string
	optionAnswerId?: string
	essayAnswer?: string
	trueFalseAnswer?: boolean
}

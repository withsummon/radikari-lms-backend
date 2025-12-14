import {
	Assignment,
	AssignmentAccess,
	NotificationType,
} from "../../generated/prisma/client"
import { AssignmentCreateDTO } from "$entities/Assignment"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as AssignmentRepository from "$repositories/Assignment"
import {
	HandleServiceResponseCustomError,
	HandleServiceResponseSuccess,
	ResponseStatus,
	ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"
import { UserJWTDAO } from "$entities/User"
import * as TenantRoleRepository from "$repositories/TenantRoleRepository"
import * as AssignmentAttemptRepository from "$repositories/Assignment/AssignmentAttemptRepository"
import * as TenantUserRepository from "$repositories/TenantUserRepository"
import * as UserActivityLogService from "$services/UserActivityLogService"
import pubsub from "$pkg/pubsub"
import { PUBSUB_TOPICS } from "$entities/PubSub"
import * as NotificationService from "$services/NotificationService"

export async function create(
	data: AssignmentCreateDTO,
	tenantId: string,
	userId: string,
): Promise<ServiceResponse<Assignment | {}>> {
	try {
		data.tenantId = tenantId
		data.createdByUserId = userId

		const createdData = await AssignmentRepository.create(data)
		await UserActivityLogService.create(
			userId,
			"Menambahkan tugas",
			tenantId,
			`dengan judul "${createdData.title}"`,
		)

		await pubsub.sendToQueue(PUBSUB_TOPICS.ASSIGNMENT_ASSIGNED_NOTIFICATION, {
			assignmentId: createdData.id,
			tenantId: tenantId,
		})

		return HandleServiceResponseSuccess(createdData)
	} catch (err) {
		Logger.error(`AssignmentService.create : `, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getAll(
	filters: EzFilter.FilteringQuery,
	user: UserJWTDAO,
	tenantId: string,
): Promise<ServiceResponse<EzFilter.PaginatedResult<Assignment[]> | {}>> {
	try {
		const data = await AssignmentRepository.getAll(filters, user, tenantId)
		return HandleServiceResponseSuccess(data)
	} catch (err) {
		Logger.error(`AssignmentService.getAll`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getById(
	id: string,
	tenantId: string,
): Promise<ServiceResponse<Assignment | {}>> {
	try {
		let assginment = await AssignmentRepository.getById(id, tenantId)

		if (!assginment)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		return HandleServiceResponseSuccess(assginment)
	} catch (err) {
		Logger.error(`AssignmentService.getById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export type UpdateResponse = Assignment | {}
export async function update(
	id: string,
	data: AssignmentCreateDTO,
	tenantId: string,
	userId: string,
): Promise<ServiceResponse<UpdateResponse>> {
	try {
		const assginment = await AssignmentRepository.getById(id, tenantId)

		if (!assginment)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		const updatedAssginment = await AssignmentRepository.update(id, data)

		await UserActivityLogService.create(
			userId,
			"Mengedit tugas",
			tenantId,
			`dengan judul "${updatedAssginment.title}"`,
		)

		return HandleServiceResponseSuccess(updatedAssginment)
	} catch (err) {
		Logger.error(`AssignmentService.update`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function deleteById(
	id: string,
	tenantId: string,
	userId: string,
): Promise<ServiceResponse<{}>> {
	try {
		const deletedAssignment = await AssignmentRepository.getById(id, tenantId)

		if (!deletedAssignment)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		await AssignmentRepository.deleteById(id, tenantId)

		await UserActivityLogService.create(
			userId,
			"Menghapus tugas",
			tenantId,
			`dengan judul "${deletedAssignment.title}"`,
		)
		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`AssignmentService.deleteById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getSummaryByUserIdAndTenantId(
	userId: string,
	tenantId: string,
) {
	try {
		const userTenantRoles = await TenantRoleRepository.getByUserId(
			userId,
			tenantId,
		)
		const tenantRoleIds = userTenantRoles.map((tenantRole) => tenantRole.id)

		const [
			availableAssignmentCount,
			submittedAssignmentCount,
			pointAssignment,
		]: [any, any, any] = await Promise.all([
			AssignmentRepository.countAvailableAssignmentByUserIdAndTenantId(
				userId,
				tenantId,
				tenantRoleIds,
			),
			AssignmentRepository.countSubmittedAssignmentByUserIdAndTenantId(
				userId,
				tenantId,
			),
			AssignmentAttemptRepository.getUserTotalPointAssignment(userId, tenantId),
		])

		const totalAvailableAssignment = Number(availableAssignmentCount[0].count)
		const totalSubmittedAssignment = Number(submittedAssignmentCount[0].count)
		const totalUnsubmittedAssignment =
			totalAvailableAssignment - totalSubmittedAssignment
		const totalPointAssignment = Number(pointAssignment[0].sum)

		return HandleServiceResponseSuccess({
			totalAvailableAssignment,
			totalSubmittedAssignment,
			totalUnsubmittedAssignment,
			totalPointAssignment,
		})
	} catch (error) {
		Logger.error(`AssignmentService.getSummaryByUserIdAndTenantId`, { error })
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getSummaryByTenantId(tenantId: string) {
	try {
		const [AssignmentCount, CompletedAssignmentCount]: [any, any] =
			await Promise.all([
				AssignmentRepository.getTotalAssignmentByTenantId(tenantId),
				AssignmentRepository.getTotalCompletedAssignmentByTenantId(tenantId),
			])

		const totalAssignment = Number(AssignmentCount[0].count)
		const totalCompletedAssignment = Number(CompletedAssignmentCount[0].count)
		const totalUncompletedAssignment =
			totalAssignment - totalCompletedAssignment

		return HandleServiceResponseSuccess({
			totalAssignment,
			totalCompletedAssignment,
			totalUncompletedAssignment,
		})
	} catch (err) {
		Logger.error(`AssignmentService.getSummaryByTenantId`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getUserListWithAssignmentSummaryByTenantId(
	tenantId: string,
) {
	try {
		const userList: any =
			await AssignmentRepository.getUserListWithAssignmentSummaryByTenantId(
				tenantId,
			)

		const userListWithAssignmentSummary = userList.map((user: any) => ({
			id: user.id,
			fullName: user.fullName,
			email: user.email,
			phoneNumber: user.phoneNumber,
			profilePicture: user.profilePicture,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
			role: user.role,
			type: user.type,
			totalAssignment: Number(user.totalAssignment),
			totalSubmittedAssignment: Number(user.totalSubmittedAssignment),
			progressPercentage:
				Number(user.totalAssignment) > 0 &&
				Number(user.totalSubmittedAssignment) > 0
					? Math.round(
							(Number(user.totalSubmittedAssignment) /
								Number(user.totalAssignment)) *
								100,
						)
					: 0,
		}))

		return HandleServiceResponseSuccess(userListWithAssignmentSummary)
	} catch (error) {
		Logger.error(
			`AssignmentService.getUserListWithAssignmentSummaryByTenantId`,
			{ error },
		)
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getAssginmentWithUserSummaryByTenantId(tenantId: string) {
	try {
		const assignmentList: any =
			await AssignmentRepository.getAssginmentWithUserSummaryByTenantId(
				tenantId,
			)

		const assignmentListWithUserSummary = assignmentList.map(
			(assignment: any) => ({
				id: assignment.id,
				title: assignment.title,
				durationInMinutes: assignment.durationInMinutes,
				status: assignment.status,
				access: assignment.access,
				expiredDate: assignment.expiredDate,
				totalUser: Number(assignment.totalUser),
				totalUserSubmitted: Number(assignment.totalUserSubmitted),
				progressPercentage:
					Number(assignment.totalUser) > 0 &&
					Number(assignment.totalUserSubmitted) > 0
						? Math.round(
								(Number(assignment.totalUserSubmitted) /
									Number(assignment.totalUser)) *
									100,
							)
						: 0,
			}),
		)

		return HandleServiceResponseSuccess(assignmentListWithUserSummary)
	} catch (error) {
		Logger.error(`AssignmentService.getAssginmentWithUserSummaryByTenantId`, {
			error,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getUserAssignmentList(userId: string, tenantId: string) {
	try {
		const tenantUser = await TenantUserRepository.getByTenantIdAndUserId(
			tenantId,
			userId,
		)
		if (!tenantUser) {
			return HandleServiceResponseCustomError(
				"User not found",
				ResponseStatus.NOT_FOUND,
			)
		}

		const assignmentList =
			await AssignmentRepository.getAssignmentListByUserIdAndTenantIdAndTenantRoleId(
				userId,
				tenantId,
				tenantUser.tenantRoleId,
			)

		return HandleServiceResponseSuccess(assignmentList)
	} catch (error) {
		Logger.error(`AssignmentService.getUserAssignmentList`, { error })
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getDetailUserAssignmentByUserIdAndTenantId(
	userId: string,
	assignmentId: string,
) {
	try {
		const assignment =
			await AssignmentRepository.getDetailUserAssignmentByUserIdAndTenantId(
				userId,
				assignmentId,
			)

		if (!assignment) {
			return HandleServiceResponseCustomError(
				"Assignment not found",
				ResponseStatus.NOT_FOUND,
			)
		}

		const assignmentDetail = () => {
			const submittedAttempt = assignment.assignmentUserAttempts[0]

			// If user hasn't submitted, return only assignment data
			if (!submittedAttempt) {
				return {
					assignment: {
						id: assignment.id,
						title: assignment.title,
						durationInMinutes: assignment.durationInMinutes,
						status: assignment.status,
						access: assignment.access,
						expiredDate: assignment.expiredDate,
						tenantId: assignment.tenantId,
						createdAt: assignment.createdAt,
						updatedAt: assignment.updatedAt,
						createdByUserId: assignment.createdByUserId,
						isSubmitted: false,
					},
					assignmentAttempt: null,
					questions: assignment.assignmentQuestions.map((question: any) => {
						const baseQuestion = {
							id: question.id,
							order: question.order,
							content: question.content,
							type: question.type,
						}

						if (question.type === "MULTIPLE_CHOICE") {
							return {
								...baseQuestion,
								options: question.assignmentQuestionOptions.map(
									(option: any) => ({
										id: option.id,
										content: option.content,
									}),
								),
							}
						}

						return baseQuestion
					}),
				}
			}

			// If user has submitted, return with attempt data (like history endpoint)
			const mappedQuestions = assignment.assignmentQuestions.map(
				(question: any) => {
					const assignmentUserAttemptAnswer =
						submittedAttempt.assignmentUserAttemptQuestionAnswers.find(
							(answer: any) => answer.assignmentQuestionId === question.id,
						)

					const baseQuestion = {
						id: question.id,
						order: question.order,
						content: question.content,
						type: question.type,
						isCorrect: assignmentUserAttemptAnswer?.isAnswerCorrect ?? null,
					}

					if (question.type === "MULTIPLE_CHOICE") {
						return {
							...baseQuestion,
							options: question.assignmentQuestionOptions.map(
								(option: any) => ({
									id: option.id,
									content: option.content,
								}),
							),
							userAnswer:
								assignmentUserAttemptAnswer?.assignmentQuestionOptionId ?? null,
						}
					} else if (question.type === "ESSAY") {
						return {
							...baseQuestion,
							userAnswer: assignmentUserAttemptAnswer?.essayAnswer ?? null,
						}
					} else if (question.type === "TRUE_FALSE") {
						return {
							...baseQuestion,
							userAnswer: assignmentUserAttemptAnswer?.trueFalseAnswer ?? null,
						}
					}

					return baseQuestion
				},
			)

			return {
				assignment: {
					id: assignment.id,
					title: assignment.title,
					durationInMinutes: assignment.durationInMinutes,
					status: assignment.status,
					access: assignment.access,
					expiredDate: assignment.expiredDate,
					tenantId: assignment.tenantId,
					createdAt: assignment.createdAt,
					updatedAt: assignment.updatedAt,
					createdByUserId: assignment.createdByUserId,
					isSubmitted: submittedAttempt.isSubmitted,
				},
				assignmentAttempt: {
					id: submittedAttempt.id,
					score: submittedAttempt.score,
					percentageScore: submittedAttempt.percentageScore,
					isSubmitted: submittedAttempt.isSubmitted,
					submittedAt: submittedAttempt.submittedAt,
					createdAt: submittedAttempt.createdAt,
					updatedAt: submittedAttempt.updatedAt,
				},
				questions: mappedQuestions,
			}
		}
		return HandleServiceResponseSuccess(assignmentDetail())
	} catch (error) {
		Logger.error(
			`AssignmentService.getDetailUserAssignmentByUserIdAndTenantId`,
			{ error },
		)
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function sendAssignmentAssignedNotification(
	assignmentId: string,
	tenantId: string,
) {
	try {
		const assginment = await AssignmentRepository.getById(
			assignmentId,
			tenantId,
		)

		if (!assginment) {
			return
		}

		const notificationTitle = "Tugas Baru Tersedia"
		const notificationMessage = `Tugas baru "${assginment.title}" telah tersedia untuk dikerjakan.`

		switch (assginment.access) {
			case AssignmentAccess.TENANT_ROLE:
				// Notify all users in the tenant
				for (const tenantRoleAccess of assginment.assignmentTenantRoleAccesses) {
					await NotificationService.notifyTenantRoleUsers(
						tenantId,
						tenantRoleAccess.tenantRoleId,
						NotificationType.ASSIGNMENT,
						notificationTitle,
						notificationMessage,
						assginment.id,
					)
				}
				break

			case AssignmentAccess.USER:
				// Notify specific users who have access via email
				const userIds = assginment.assignmentUserAccesses.map(
					(userAccess) => userAccess.userId,
				)
				await NotificationService.notifySpecificUsers(
					userIds,
					tenantId,
					NotificationType.ASSIGNMENT,
					notificationTitle,
					notificationMessage,
					assginment.id,
				)
				break

			default:
				break
		}

		Logger.info(
			"AssignmentService.sendAssignmentAssignedNotification: Notifications sent",
			{
				assignmentId: assginment.id,
				access: assginment.access,
			},
		)
	} catch (err) {
		Logger.error(
			"AssignmentService.sendAssignmentAssignedNotification: Failed to send notifications",
			{
				error: err,
				assignmentId: assignmentId,
			},
		)
		// Don't throw - notification failure shouldn't fail the approval
	}
}
export async function getStatistics(assignmentId: string, tenantId: string) {
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

		const attempts =
			await AssignmentAttemptRepository.getSubmittedAttemptsByAssignmentId(
				assignmentId,
			)
		const totalAssignedUsers =
			await AssignmentRepository.getTotalAssignedUsers(assignmentId)

		const totalSubmitted = attempts.length
		const averageScore =
			totalSubmitted > 0
				? attempts.reduce((sum, a) => sum + (a.percentageScore || 0), 0) /
					totalSubmitted
				: 0

		const averageTimeInMinutes =
			totalSubmitted > 0
				? attempts.reduce(
						(sum, a) =>
							sum + (a.submittedAt!.getTime() - a.createdAt.getTime()) / 60000,
						0,
					) / totalSubmitted
				: 0

		const completionRate =
			totalAssignedUsers > 0 ? (totalSubmitted / totalAssignedUsers) * 100 : 0

		const stats = {
			assignmentName: assignment.title,
			averageScore: parseFloat(averageScore.toFixed(2)),
			averageTimeInMinutes: parseFloat(averageTimeInMinutes.toFixed(2)),
			completionRate: parseFloat(completionRate.toFixed(2)),
			totalAssignedUsers,
			totalSubmittedUsers: totalSubmitted,
		}

		// Question Analytics
		const questionsWithAnalytics =
			await AssignmentRepository.getQuestionAnalytics(assignmentId)

		return HandleServiceResponseSuccess({
			stats,
			questions: questionsWithAnalytics,
		})
	} catch (error) {
		Logger.error(`AssignmentService.getStatistics`, { error })
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

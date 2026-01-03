import {
	Knowledge,
	KnowledgeAccess,
	KnowledgeActivityLogAction,
	KnowledgeAttachment,
	KnowledgeStatus,
	NotificationType,
	Prisma,
	UserKnowledge,
} from "../../generated/prisma/client"
import {
	KnowledgeApprovalDTO,
	KnowledgeBulkCreateDataRow,
	KnowledgeBulkCreateDTO,
	KnowledgeBulkCreateTypeCaseDataRow,
	KnowledgeDTO,
	KnowledgeQueueDTO,
} from "$entities/Knowledge"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as KnowledgeRepository from "$repositories/KnowledgeRepository"
import {
	HandleServiceResponseCustomError,
	HandleServiceResponseSuccess,
	ResponseStatus,
	ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"
import { UserJWTDAO } from "$entities/User"
import { PUBSUB_TOPICS } from "$entities/PubSub"
import { GlobalPubSub } from "$pkg/pubsub"
import axios from "axios"
import * as XLSX from "xlsx"
import { ulid } from "ulid"
import * as TenantRepository from "$repositories/TenantRepository"
import * as OperationRepository from "$repositories/OperationRepository"
import * as UserActivityLogService from "$services/UserActivityLogService"
import * as NotificationService from "$services/NotificationService"
import { KnowledgeShareDTO } from "$entities/Knowledge"
import { prisma } from "$pkg/prisma"

export async function create(
	userId: string,
	tenantId: string,
	data: KnowledgeDTO,
): Promise<ServiceResponse<Knowledge | {}>> {
	try {
		if (data.parentId) {
			const parent = await KnowledgeRepository.getById(data.parentId)

			data.version = parent!.version + 1
		}

		const createdData = await KnowledgeRepository.create(userId, tenantId, data)

		await UserActivityLogService.create(
			userId,
			"Menambahkan pengetahuan",
			tenantId,
			`dengan headline "${data.headline}"`,
		)

		return HandleServiceResponseSuccess(createdData)
	} catch (err) {
		Logger.error(`KnowledgeService.create : `, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getAll(
	user: UserJWTDAO,
	tenantId: string,
	filters: EzFilter.FilteringQuery,
): Promise<ServiceResponse<EzFilter.PaginatedResult<Knowledge[]> | {}>> {
	try {
		console.log(filters)
		const data = await KnowledgeRepository.getAll(user, tenantId, filters)
		return HandleServiceResponseSuccess(data)
	} catch (err) {
		Logger.error(`KnowledgeService.getAll`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getAllArchived(
	user: UserJWTDAO,
	tenantId: string,
	filters: EzFilter.FilteringQuery,
): Promise<ServiceResponse<EzFilter.PaginatedResult<Knowledge[]> | {}>> {
	try {
		const data = await KnowledgeRepository.getAllArchived(
			user,
			tenantId,
			filters,
		)
		return HandleServiceResponseSuccess(data)
	} catch (err) {
		Logger.error(`KnowledgeService.getAll`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getSummary(
	user: UserJWTDAO,
	tenantId: string,
	filters: EzFilter.FilteringQuery,
): Promise<ServiceResponse<{}>> {
	try {
		const data = await KnowledgeRepository.getSummary(user, tenantId, filters)

		return HandleServiceResponseSuccess(data)
	} catch (err) {
		Logger.error(`KnowledgeService.getSummary`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getById(
	id: string,
	tenantId: string,
	userId: string,
): Promise<ServiceResponse<Knowledge | {}>> {
	try {
		let knowledge = await KnowledgeRepository.getById(id)

		if (!knowledge)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		if (knowledge.createdByUserId !== userId) {
			await KnowledgeRepository.incrementTotalViews(id)
		}

		return HandleServiceResponseSuccess(knowledge)
	} catch (err) {
		Logger.error(`KnowledgeService.getById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getAllVersionsById(
	id: string,
): Promise<
	ServiceResponse<{ id: string; version: number; headline: string }[] | {}>
> {
	try {
		const versions = await KnowledgeRepository.getAllVersionsById(id)

		if (!versions || versions.length === 0)
			return HandleServiceResponseCustomError(
				"Knowledge not found",
				ResponseStatus.NOT_FOUND,
			)

		return HandleServiceResponseSuccess(versions)
	} catch (err) {
		Logger.error(`KnowledgeService.getAllVersionsById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export type UpdateResponse = Knowledge | {}
export async function update(
	id: string,
	tenantId: string,
	data: KnowledgeDTO,
	userId: string,
): Promise<ServiceResponse<UpdateResponse>> {
	try {
		const knowledge = await KnowledgeRepository.getById(id)

		if (!knowledge)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		let status = knowledge.status

		if (status == "REJECTED" || status == "REVISION") {
			status = "PENDING"
		}

		const updatedKnowledge = await KnowledgeRepository.update(
			id,
			data,
			tenantId,
			status,
		)

		if (updatedKnowledge.status == KnowledgeStatus.APPROVED) {
			const pubsub = GlobalPubSub.getInstance().getPubSub()
			const knowledgeWithUserKnowledgeAndKnowledgeAttachment =
				await KnowledgeRepository.getById(id)

			try {
				await pubsub.sendToQueue(
					PUBSUB_TOPICS.KNOWLEDGE_UPDATE,
					generateKnowledgeQueueDTO(
						knowledgeWithUserKnowledgeAndKnowledgeAttachment as any,
					),
				)
			} catch (mqError) {
				Logger.warning(
					"KnowledgeService.update: Failed to publish update event",
					{
						error: mqError,
						knowledgeId: id,
					},
				)
			}
		}

		await UserActivityLogService.create(
			userId,
			"Mengedit pengetahuan",
			tenantId,
			`dengan headline "${updatedKnowledge.headline}"`,
		)

		return HandleServiceResponseSuccess(updatedKnowledge)
	} catch (err) {
		Logger.error(`KnowledgeService.update`, {
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
		const knowledge = await KnowledgeRepository.getById(id)

		if (!knowledge)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		await KnowledgeRepository.deleteById(id)
		const pubsub = GlobalPubSub.getInstance().getPubSub()
		try {
			await pubsub.sendToQueue(PUBSUB_TOPICS.KNOWLEDGE_DELETE, {
				knowledgeId: id,
			})
		} catch (mqError) {
			Logger.warning(
				"KnowledgeService.deleteById: Failed to publish delete event",
				{
					error: mqError,
					knowledgeId: id,
				},
			)
		}

		await UserActivityLogService.create(
			userId,
			"Menghapus pengetahuan",
			tenantId,
			`dengan headline "${knowledge.headline}"`,
		)

		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`KnowledgeService.deleteById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function approveById(
	id: string,
	tenantId: string,
	userId: string,
	data: KnowledgeApprovalDTO,
): Promise<ServiceResponse<{}>> {
	try {
		const knowledge = await KnowledgeRepository.getById(id)

		if (!knowledge)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		let status: KnowledgeStatus

		switch (data.action) {
			case KnowledgeActivityLogAction.APPROVE:
				status = KnowledgeStatus.APPROVED
				break
			case KnowledgeActivityLogAction.REJECT:
				status = KnowledgeStatus.REJECTED
				break
			case KnowledgeActivityLogAction.REVISION:
				status = KnowledgeStatus.REVISION
				break
			default:
				status = KnowledgeStatus.PENDING
				break
		}
		if (status == knowledge.status) {
			return HandleServiceResponseCustomError(
				`Knowledge is already in status ${status}`,
				ResponseStatus.BAD_REQUEST,
			)
		}

		await KnowledgeRepository.updateStatus(
			id,
			userId,
			status,
			data.action,
			data.comment,
		)

		if (data.action == KnowledgeActivityLogAction.APPROVE) {
			Logger.info(
				"KnowledgeService.approveById: Preparing to send message to queue.",
				{
					knowledgeId: knowledge.id,
					headline: knowledge.headline,
				},
			)

			const payload = generateKnowledgeQueueDTO(knowledge as any)

			Logger.info(
				"KnowledgeService.approveById: Generated payload for queue.",
				{
					payload: payload,
				},
			)

			const pubsub = GlobalPubSub.getInstance().getPubSub()

			try {
				await pubsub.sendToQueue(PUBSUB_TOPICS.KNOWLEDGE_CREATE, payload)
				await pubsub.sendToQueue(
					PUBSUB_TOPICS.KNOWLEDGE_APPROVAL_NOTIFICATION,
					{
						knowledgeId: knowledge.id,
						excludeUserId: userId,
					},
				)
			} catch (mqError) {
				Logger.warning(
					"KnowledgeService.approveById: Failed to publish approval events",
					{
						error: mqError,
						knowledgeId: knowledge.id,
					},
				)
			}
		}

		await UserActivityLogService.create(
			userId,
			"Menyetujui pengetahuan",
			tenantId,
			`dengan headline "${knowledge.headline}" dan status "${status}"`,
		)

		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`KnowledgeService.approveById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

function generateKnowledgeQueueDTO(
	knowledge: Knowledge & { userKnowledge: UserKnowledge[] } & {
		knowledgeAttachment: KnowledgeAttachment[]
	},
): KnowledgeQueueDTO {
	return {
		metadata: {
			knowledgeId: knowledge.id,
			type: knowledge.type,
			access: knowledge.access,
			headline: knowledge.headline,
			tenantId: knowledge.tenantId,
			accessUserIds:
				knowledge.access == "EMAIL"
					? Array.from(
							new Set([
								...knowledge.userKnowledge.map(
									(userKnowledge: any) => userKnowledge.user.id,
								),
								knowledge.createdByUserId,
							]),
						)
					: [],
		},
		fileType:
			knowledge.knowledgeAttachment && knowledge.knowledgeAttachment.length > 0
				? knowledge.knowledgeAttachment
						.map((attachment: any) => attachment.attachmentUrl.split(".").pop())
						.includes("pdf")
					? "PDF"
					: "IMAGE"
				: "",
		fileUrls: knowledge.knowledgeAttachment.map(
			(attachment: any) => attachment.attachmentUrl,
		),
		content: generateContentKnowledge(knowledge),
	}
}

function generateContentKnowledge(knowledge: any) {
	return `
        Headline: ${knowledge.headline}
        Category: ${knowledge.category}
        Sub Category: ${knowledge.subCategory}
        Case: ${knowledge.case}
        Knowledge Content: 
            ${knowledge.knowledgeContent
							.map(
								(content: any) =>
									`Title: ${content.title}, Description: ${content.description}`,
							)
							.join("\n")}
    `
}

export async function sendKnowledgeApprovalNotification(
	knowledgeId: string,
	excludeUserId: string,
) {
	try {
		const knowledge = await KnowledgeRepository.getById(knowledgeId)

		if (!knowledge) {
			return
		}
		const notificationTitle = "Pengetahuan Baru Tersedia"
		const notificationMessage = `Pengetahuan baru "${knowledge.headline}" telah tersedia untuk dibaca.`

		switch (knowledge.access) {
			case KnowledgeAccess.TENANT:
				if (knowledge.tenantId) {
					await NotificationService.notifyTenantUsers(
						knowledge.tenantId,
						NotificationType.KNOWLEDGE_APPROVED,
						notificationTitle,
						notificationMessage,
						knowledge.id,
						excludeUserId,
					)
				}
				break

			case KnowledgeAccess.EMAIL:
				const userIds = knowledge.userKnowledge
					.map((uk) => uk.user.id)
					.filter((id) => id !== excludeUserId)

				if (userIds.length > 0) {
					await NotificationService.notifySpecificUsers(
						userIds,
						knowledge.tenantId ?? undefined,
						NotificationType.KNOWLEDGE_APPROVED,
						notificationTitle,
						notificationMessage,
						knowledge.id,
					)
				}
				break

			case KnowledgeAccess.PUBLIC:
				if (knowledge.tenantId) {
					await NotificationService.notifyTenantUsers(
						knowledge.tenantId,
						NotificationType.KNOWLEDGE_APPROVED,
						notificationTitle,
						notificationMessage,
						knowledge.id,
						excludeUserId,
					)
				}
				break
		}

		Logger.info(
			"KnowledgeService.sendKnowledgeApprovalNotification: Notifications sent",
			{
				knowledgeId: knowledge.id,
				access: knowledge.access,
			},
		)
	} catch (err) {
		Logger.error(
			"KnowledgeService.sendKnowledgeApprovalNotification: Failed to send notifications",
			{
				error: err,
				knowledgeId: knowledgeId,
			},
		)
	}
}

export async function bulkCreate(data: KnowledgeBulkCreateDTO, userId: string) {
	try {
		const file = await axios.get(data.fileUrl, {
			responseType: "arraybuffer",
		})

		const responseData = file.data
		const workbook = XLSX.read(responseData, { type: "buffer" })
		const knowledges = workbook.Sheets[workbook.SheetNames[2]]

		const rowData: KnowledgeBulkCreateDataRow[] =
			XLSX.utils.sheet_to_json<KnowledgeBulkCreateDataRow>(knowledges)

		const knowledgeCreateManyInput: Prisma.KnowledgeCreateManyInput[] = []
		const knwoledgeAttachmentCreateManyInput: Prisma.KnowledgeAttachmentCreateManyInput[] =
			[]
		const knwoledgeContentCreateManyInput: Prisma.KnowledgeContentCreateManyInput[] =
			[]

		for (const row of rowData) {
			let tenantId: string | undefined
			if (row["Tenant Name"] && row["Tenant Name"] !== "") {
				let tenant = await TenantRepository.getByName(row["Tenant Name"])

				if (row["Tenant Name"] === "DANA") {
					tenant = await TenantRepository.getById("01K9201Z97H20E4NKTEANCFVCP")
				}
				console.log("Tenant fetched or created:", tenant)

				if (!tenant) {
					const operation = await OperationRepository.findFirst()

					tenant = await TenantRepository.create({
						id:
							row["Tenant Name"] === "DANA"
								? "01K9201Z97H20E4NKTEANCFVCP"
								: ulid(),
						name: row["Tenant Name"],
						description: row["Tenant Name"],
						operationId: operation!.id,
						headOfTenantUserId: userId,
					})
				}

				tenantId = tenant.id
			}

			const knowledgeId = ulid()
			knowledgeCreateManyInput.push({
				id: knowledgeId,
				tenantId: tenantId,
				createdByUserId: userId,
				access: data.access,
				type: data.type,
				category: row.Category,
				subCategory: row["Sub Category"],
				case: row.Case,
				headline: row.Headline,
				status: KnowledgeStatus.PENDING,
			})

			if (row.Attachments && row.Attachments !== "") {
				const attachments = row.Attachments.split(",")
				for (const attachment of attachments) {
					knwoledgeAttachmentCreateManyInput.push({
						id: ulid(),
						knowledgeId: knowledgeId,
						attachmentUrl: attachment,
					})
				}
			}

			knwoledgeContentCreateManyInput.push({
				id: ulid(),
				knowledgeId: knowledgeId,
				title: row.Headline,
				description: row.Description,
				order: 1,
			})
		}

		await KnowledgeRepository.createMany(knowledgeCreateManyInput)
		await KnowledgeRepository.createManyAttachments(
			knwoledgeAttachmentCreateManyInput,
		)
		await KnowledgeRepository.createManyContent(knwoledgeContentCreateManyInput)

		const knowledgeIds = knowledgeCreateManyInput.map((k) => k.id as string)
		const createdKnowledges = await KnowledgeRepository.getByIds(knowledgeIds)
		const pubsub = GlobalPubSub.getInstance().getPubSub()

		for (const knowledge of createdKnowledges) {
			const payload = generateKnowledgeQueueDTO(knowledge as any)
			try {
				await pubsub.sendToQueue(PUBSUB_TOPICS.KNOWLEDGE_CREATE, payload)
			} catch (mqError) {
				Logger.warning(
					"KnowledgeService.bulkCreate: Failed to publish create event",
					{
						error: mqError,
						knowledgeId: knowledge.id,
					},
				)
			}
		}

		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`KnowledgeService.bulkCreate`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function bulkCreateTypeCase(
	data: KnowledgeBulkCreateDTO,
	userId: string,
) {
	try {
		const file = await axios.get(data.fileUrl, {
			responseType: "arraybuffer",
		})

		const responseData = file.data
		const workbook = XLSX.read(responseData, { type: "buffer" })
		const knowledges = workbook.Sheets[workbook.SheetNames[2]]

		const rowData: KnowledgeBulkCreateTypeCaseDataRow[] =
			XLSX.utils.sheet_to_json<KnowledgeBulkCreateTypeCaseDataRow>(knowledges)

		const knowledgeCreateManyInput: Prisma.KnowledgeCreateManyInput[] = []
		const knwoledgeContentCreateManyInput: Prisma.KnowledgeContentCreateManyInput[] =
			[]

		for (const row of rowData) {
			let tenantId: string | undefined
			if (row["Tenant Name"] && row["Tenant Name"] !== "") {
				let tenant = await TenantRepository.getByName(row["Tenant Name"])

				if (row["Tenant Name"] === "DANA") {
					tenant = await TenantRepository.getById("01K9201Z97H20E4NKTEANCFVCP")
				}

				if (!tenant) {
					const operation = await OperationRepository.findFirst()

					tenant = await TenantRepository.create({
						id:
							row["Tenant Name"] === "DANA"
								? "01K9201Z97H20E4NKTEANCFVCP"
								: ulid(),
						name: row["Tenant Name"],
						description: row["Tenant Name"],
						operationId: operation!.id,
						headOfTenantUserId: userId,
					})
				}

				tenantId = tenant.id
			}

			const knowledgeId = ulid()
			knowledgeCreateManyInput.push({
				id: knowledgeId,
				tenantId: tenantId,
				createdByUserId: userId,
				access: data.access,
				type: data.type,
				headline: row["Detail Case"],
				case: row["Case"],
				category: row["Category"],
				subCategory: row["Sub Category"],
				status: KnowledgeStatus.PENDING,
			})

			let order = 1

			if (row["Merchant Name"] && row["Merchant Name"] !== "") {
				knwoledgeContentCreateManyInput.push({
					id: ulid(),
					knowledgeId: knowledgeId,
					title: "Merchant Name",
					description: row["Merchant Name"],
					order: order++,
				})
			}

			if (row["Aggregator Name"] && row["Aggregator Name"] !== "") {
				knwoledgeContentCreateManyInput.push({
					id: ulid(),
					knowledgeId: knowledgeId,
					title: "Aggregator Name",
					description: row["Aggregator Name"],
					order: order++,
				})
			}

			if (row["Probing"] && row["Probing"] !== "") {
				knwoledgeContentCreateManyInput.push({
					id: ulid(),
					knowledgeId: knowledgeId,
					title: "Probing",
					description: row["Probing"],
					order: order++,
				})
			}

			if (row["NEED KBA?"] && row["NEED KBA?"] !== "") {
				knwoledgeContentCreateManyInput.push({
					id: ulid(),
					knowledgeId: knowledgeId,
					title: "NEED KBA?",
					description: row["NEED KBA?"],
					order: order++,
				})
			}

			if (row["FCR"] && row["FCR"] !== "") {
				knwoledgeContentCreateManyInput.push({
					id: ulid(),
					knowledgeId: knowledgeId,
					title: "FCR",
					description: row["FCR"],
					order: order++,
				})
			}

			if (row["Guidance"] && row["Guidance"] !== "") {
				knwoledgeContentCreateManyInput.push({
					id: ulid(),
					knowledgeId: knowledgeId,
					title: "Guidance",
					description: row["Guidance"],
					order: order++,
				})
			}

			if (row["Note"] && row["Note"] !== "") {
				knwoledgeContentCreateManyInput.push({
					id: ulid(),
					knowledgeId: knowledgeId,
					title: "Note",
					description: row["Note"],
					order: order++,
				})
			}

			if (row["SLA ESCALATION"] && row["SLA ESCALATION"] !== "") {
				knwoledgeContentCreateManyInput.push({
					id: ulid(),
					knowledgeId: knowledgeId,
					title: "SLA ESCALATION",
					description: row["SLA ESCALATION"],
					order: order++,
				})
			}

			if (row["Assign"] && row["Assign"] !== "") {
				knwoledgeContentCreateManyInput.push({
					id: ulid(),
					knowledgeId: knowledgeId,
					title: "Assign",
					description: row["Assign"],
					order: order++,
				})
			}

			if (row["Keterangan"] && row["Keterangan"] !== "") {
				knwoledgeContentCreateManyInput.push({
					id: ulid(),
					knowledgeId: knowledgeId,
					title: "Keterangan",
					description: row["Keterangan"],
					order: order++,
				})
			}
		}

		await KnowledgeRepository.createMany(knowledgeCreateManyInput)
		await KnowledgeRepository.createManyContent(knwoledgeContentCreateManyInput)

		const knowledgeIds = knowledgeCreateManyInput.map((k) => k.id as string)
		const createdKnowledges = await KnowledgeRepository.getByIds(knowledgeIds)
		const pubsub = GlobalPubSub.getInstance().getPubSub()

		for (const knowledge of createdKnowledges) {
			const payload = generateKnowledgeQueueDTO(knowledge as any)
			try {
				await pubsub.sendToQueue(PUBSUB_TOPICS.KNOWLEDGE_CREATE, payload)
			} catch (mqError) {
				Logger.warning(
					"KnowledgeService.bulkCreateTypeCase: Failed to publish create event",
					{
						error: mqError,
						knowledgeId: knowledge.id,
					},
				)
			}
		}

		return HandleServiceResponseSuccess({})
	} catch (error) {
		Logger.error(`KnowledgeService.bulkCreateTypeCase`, {
			error: error,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function archiveOrUnarchiveKnowledge(
	id: string,
	userId: string,
	tenantId: string,
) {
	try {
		const knowledge = await KnowledgeRepository.getById(id)

		if (!knowledge)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		await KnowledgeRepository.archiveOrUnarchiveKnowledge(
			id,
			!knowledge.isArchived,
		)
		await UserActivityLogService.create(
			userId,
			"Mengarsipkan pengetahuan",
			tenantId,
			`dengan headline "${knowledge.headline}"`,
		)
		return HandleServiceResponseSuccess({})
	} catch (error) {
		Logger.error(`KnowledgeService.archiveOrUnarchiveKnowledge`, {
			error: error,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function shareKnowledge(
	userId: string,
	tenantId: string,
	knowledgeId: string,
	data: KnowledgeShareDTO,
): Promise<ServiceResponse<{}>> {
	try {
		const knowledge = await KnowledgeRepository.getById(knowledgeId)
		if (!knowledge) {
			return HandleServiceResponseCustomError(
				"Knowledge not found",
				ResponseStatus.NOT_FOUND,
			)
		}

		const existingUsers = await KnowledgeRepository.findUsersByEmails(
			data.emails,
		)

		const recipientsPayload = data.emails.map((email) => {
			const matchedUser = existingUsers.find((u) => u.email === email)
			return {
				email: email,
				userId: matchedUser ? matchedUser.id : null,
			}
		})

		const shareRecord = await KnowledgeRepository.createShare(
			knowledgeId,
			userId,
			data.note,
			recipientsPayload,
		)

		await UserActivityLogService.create(
			userId,
			"Membagikan pengetahuan",
			tenantId,
			`berjudul "${knowledge.headline}" kepada ${data.emails.length} orang`,
		)

		return HandleServiceResponseSuccess(shareRecord)
	} catch (err) {
		Logger.error(`KnowledgeService.shareKnowledge`, { error: err })
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getShareHistory(
	userId: string,
	tenantId: string,
	filters: EzFilter.FilteringQuery,
): Promise<ServiceResponse<{}>> {
	try {
		const whereClause: Prisma.KnowledgeShareWhereInput = {
			AND: [
				{
					knowledge: { tenantId: tenantId },
				},
				{
					OR: [
						{ sharedByUserId: userId },
						{
							recipients: {
								some: {
									recipientUserId: userId,
								},
							},
						},
					],
				},
			],
		}

		const [total, entries] = await prisma.$transaction([
			prisma.knowledgeShare.count({ where: whereClause }),
			prisma.knowledgeShare.findMany({
				where: whereClause,
				orderBy: {
					createdAt: "desc",
				},
				include: {
					knowledge: {
						select: {
							id: true,
							headline: true,
							type: true,
							status: true,
							tenantId: true,
						},
					},
					recipients: {
						include: {
							recipientUser: {
								select: {
									fullName: true,
									email: true,
								},
							},
						},
					},
					sharedByUser: {
						select: {
							fullName: true,
							email: true,
						},
					},
				},
			}),
		])

		return HandleServiceResponseSuccess({
			entries,
			totalData: total,
		})
	} catch (err) {
		Logger.error(`KnowledgeService.getShareHistory`, { error: err })
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

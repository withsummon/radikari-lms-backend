import { ulid } from "ulid"
import {
	AssignmentAccess,
	AssignmentQuestionType,
	PrismaClient,
} from "../../generated/prisma/client"
import { DateTime } from "luxon"

interface SeedAssignmentQuestion {
	id: string
	order: number
	content: string
	type: AssignmentQuestionType
	options?: {
		id: string
		content: string
		isCorrectAnswer: boolean
	}[]
	trueFalseAnswer?: {
		id: string
		correctAnswer: boolean
	}
	essayReferenceAnswer?: {
		id: string
		content: string
	}
}

interface SeedAssignment {
	id: string
	title: string
	durationInMinutes: number
	access: AssignmentAccess
	expiredDate: string
	tenantId: string
	createdByUserId: string
	roleAccessIdentifiers?: string[]
	userIds?: string[]
	questions: SeedAssignmentQuestion[]
}

export async function seedAssignment(prisma: PrismaClient) {
	const assignmentCount = await prisma.assignment.count()
	if (assignmentCount > 0) {
		console.log("Assignment already seeded")
		return
	}

	const [tenant, tenantRoles, regularUser, adminUser] = await Promise.all([
		prisma.tenant.findFirst(),
		prisma.tenantRole.findMany(),
		prisma.user.findFirst({
			where: {
				email: "user@test.com",
			},
		}),
		prisma.user.findFirst({
			where: {
				email: "admin@test.com",
			},
		}),
	])

	if (!tenant) {
		console.log("Tenant not found. Please run seedTenant first.")
		return
	}

	if (!regularUser) {
		console.log(
			'User with email "user@test.com" not found. Please run seedAdmin first.',
		)
		return
	}

	if (!adminUser) {
		console.log(
			'User with email "admin@test.com" not found. Please run seedAdmin first.',
		)
		return
	}

	const tenantRoleByIdentifier = tenantRoles.reduce<Record<string, string>>(
		(acc, role) => {
			acc[role.identifier] = role.id
			return acc
		},
		{},
	)

	const thirtyDaysLater = DateTime.now()
		.plus({ days: 30 })
		.toFormat("yyyy-MM-dd")
	const fourteenDaysLater = DateTime.now()
		.plus({ days: 14 })
		.toFormat("yyyy-MM-dd")

	const assignments: SeedAssignment[] = [
		{
			id: ulid(),
			title: "Onboarding Customer Service",
			durationInMinutes: 45,
			tenantId: tenant.id,
			access: AssignmentAccess.TENANT_ROLE,
			expiredDate: thirtyDaysLater,
			createdByUserId: adminUser.id,
			roleAccessIdentifiers: ["TRAINER", "AGENT"],
			questions: [
				{
					id: ulid(),
					order: 1,
					content:
						"Saat menghadapi pelanggan yang marah, langkah pertama yang harus dilakukan adalah?",
					type: AssignmentQuestionType.MULTIPLE_CHOICE,
					options: [
						{
							id: ulid(),
							content: "Menjelaskan kebijakan perusahaan secepat mungkin",
							isCorrectAnswer: false,
						},
						{
							id: ulid(),
							content: "Mendengarkan dengan tenang tanpa menyela",
							isCorrectAnswer: true,
						},
						{
							id: ulid(),
							content: "Memberikan diskon segera",
							isCorrectAnswer: false,
						},
						{
							id: ulid(),
							content: "Mengakhiri panggilan agar emosi mereda",
							isCorrectAnswer: false,
						},
					],
				},
				{
					id: ulid(),
					order: 2,
					content:
						"Tuliskan contoh kalimat empati yang tepat ketika pelanggan menyampaikan keluhan mengenai keterlambatan layanan.",
					type: AssignmentQuestionType.ESSAY,
					essayReferenceAnswer: {
						id: ulid(),
						content:
							"Maaf atas ketidaknyamanan yang Anda alami. Kami memahami betapa pentingnya layanan tepat waktu bagi Anda.",
					},
				},
				{
					id: ulid(),
					order: 3,
					content:
						"Follow up setelah menyelesaikan keluhan pelanggan adalah opsional.",
					type: AssignmentQuestionType.TRUE_FALSE,
					trueFalseAnswer: {
						id: ulid(),
						correctAnswer: false,
					},
				},
			],
		},
		{
			id: ulid(),
			title: "Quality Assurance Refresher",
			durationInMinutes: 30,
			tenantId: tenant.id,
			access: AssignmentAccess.USER,
			expiredDate: fourteenDaysLater,
			createdByUserId: adminUser.id,
			userIds: [regularUser.id],
			questions: [
				{
					id: ulid(),
					order: 1,
					content:
						"Apa tujuan utama dari monitoring percakapan oleh tim Quality Assurance?",
					type: AssignmentQuestionType.MULTIPLE_CHOICE,
					options: [
						{
							id: ulid(),
							content: "Menemukan kesalahan untuk diberikan sanksi",
							isCorrectAnswer: false,
						},
						{
							id: ulid(),
							content:
								"Mengoptimalkan performa layanan dan memastikan standar terpenuhi",
							isCorrectAnswer: true,
						},
						{
							id: ulid(),
							content: "Memberikan penilaian subjektif kepada agen",
							isCorrectAnswer: false,
						},
						{
							id: ulid(),
							content: "Mengurangi biaya operasional secara langsung",
							isCorrectAnswer: false,
						},
					],
				},
				{
					id: ulid(),
					order: 2,
					content:
						"Sebutkan dua metrik utama yang digunakan dalam penilaian Quality Assurance.",
					type: AssignmentQuestionType.ESSAY,
					essayReferenceAnswer: {
						id: ulid(),
						content:
							"Contoh metrik: kepatuhan skrip dan skor kepuasan pelanggan (CSAT).",
					},
				},
				{
					id: ulid(),
					order: 3,
					content:
						"Pencatatan temuan QA harus dilakukan segera setelah sesi monitoring.",
					type: AssignmentQuestionType.TRUE_FALSE,
					trueFalseAnswer: {
						id: ulid(),
						correctAnswer: true,
					},
				},
			],
		},
	]

	for (const assignment of assignments) {
		await prisma.$transaction(async (tx) => {
			await tx.assignment.create({
				data: {
					id: assignment.id,
					title: assignment.title,
					durationInMinutes: assignment.durationInMinutes,
					tenantId: assignment.tenantId,
					expiredDate: assignment.expiredDate,
					access: assignment.access,
					createdByUserId: assignment.createdByUserId,
				},
			})

			if (assignment.roleAccessIdentifiers?.length) {
				const accessData = assignment.roleAccessIdentifiers
					.map((identifier) => tenantRoleByIdentifier[identifier])
					.filter((roleId): roleId is string => Boolean(roleId))
					.map((roleId) => ({
						id: ulid(),
						assignmentId: assignment.id,
						tenantRoleId: roleId,
					}))

				if (accessData.length > 0) {
					await tx.assignmentTenantRoleAccess.createMany({
						data: accessData,
					})
				}
			}

			if (assignment.userIds?.length) {
				await tx.assignmentUserAccess.createMany({
					data: assignment.userIds.map((userId) => ({
						id: ulid(),
						assignmentId: assignment.id,
						userId,
					})),
				})
			}

			for (const question of assignment.questions) {
				await tx.assignmentQuestion.create({
					data: {
						id: question.id,
						assignmentId: assignment.id,
						content: question.content,
						order: question.order,
						type: question.type,
					},
				})

				if (question.options?.length) {
					await tx.assignmentQuestionOption.createMany({
						data: question.options.map((option) => ({
							...option,
							assignmentQuestionId: question.id,
						})),
					})
				}

				if (question.essayReferenceAnswer) {
					await tx.assignmentQuestionEssayReferenceAnswer.create({
						data: {
							id: question.essayReferenceAnswer.id,
							assignmentQuestionId: question.id,
							content: question.essayReferenceAnswer.content,
						},
					})
				}

				if (question.trueFalseAnswer) {
					await tx.assignmentQuestionTrueFalseAnswer.create({
						data: {
							id: question.trueFalseAnswer.id,
							assignmentQuestionId: question.id,
							correctAnswer: question.trueFalseAnswer.correctAnswer,
						},
					})
				}
			}

			console.log(`Assignment "${assignment.title}" seeded successfully`)
		})
	}

	console.log(`✅ All ${assignments.length} assignments seeded successfully`)
}

// /**
//  * seed.ts (single file)
//  * Run with Bun/Node depending on your setup.
//  *
//  * Example (Bun):
//  *   bun run prisma db seed
//  * or
//  *   bun run seed.ts
//  */

// import { ulid } from "ulid"
// import { DateTime } from "luxon"

// import {
// 	Prisma,
// 	PrismaClient,
// 	Roles,
// 	KnowledgeStatus,
// 	KnowledgeActivityLogAction,
// 	KnowledgeType,
// 	KnowledgeAccess,
// 	AssignmentAccess,
// 	AssignmentQuestionType,
// } from "../../generated/prisma/client"

// const prisma = new PrismaClient()

// /** Helpers */
// async function upsertUserByEmail(
// 	tx: PrismaClient,
// 	data: {
// 		email: string
// 		fullName: string
// 		passwordPlain: string
// 		role: Roles
// 		phoneNumber?: string
// 	},
// ) {
// 	const existing = await tx.user.findFirst({ where: { email: data.email } })
// 	if (existing) return existing

// 	const hashedPassword = await Bun.password.hash(data.passwordPlain, "argon2id")
// 	return tx.user.create({
// 		data: {
// 			id: ulid(),
// 			email: data.email,
// 			fullName: data.fullName,
// 			password: hashedPassword,
// 			role: data.role,
// 			phoneNumber: data.phoneNumber ?? null,
// 		},
// 	})
// }

// async function ensureTenantUserRole(
// 	tx: PrismaClient,
// 	args: { userId: string; tenantId: string; tenantRoleId: string },
// ) {
// 	const exists = await tx.tenantUser.findFirst({
// 		where: {
// 			userId: args.userId,
// 			tenantId: args.tenantId,
// 			tenantRoleId: args.tenantRoleId,
// 		},
// 	})
// 	if (exists) return exists

// 	return tx.tenantUser.create({
// 		data: {
// 			id: ulid(),
// 			userId: args.userId,
// 			tenantId: args.tenantId,
// 			tenantRoleId: args.tenantRoleId,
// 		},
// 	})
// }

// /** 1) Operation */
// async function seedOperation(tx: PrismaClient) {
// 	const count = await tx.operation.count()
// 	if (count > 0) {
// 		console.log("✅ Operation already seeded")
// 		return
// 	}

// 	// Need a USER as headOfOperationUserId
// 	let user = await tx.user.findFirst({ where: { role: Roles.USER } })
// 	if (!user) {
// 		console.log("ℹ️ USER not found, creating default USER first...")
// 		user = await upsertUserByEmail(tx, {
// 			email: "user@test.com",
// 			fullName: "Default User",
// 			passwordPlain: "user1234",
// 			role: Roles.USER,
// 			phoneNumber: "08000000001",
// 		})
// 	}

// 	await tx.operation.create({
// 		data: {
// 			id: ulid(),
// 			name: "Operation 1",
// 			description: "Operation 1",
// 			headOfOperationUserId: user.id,
// 		},
// 	})

// 	console.log("✅ Operation seeded")
// }

// /** 2) Tenant + TenantRole */
// async function seedTenant(tx: PrismaClient) {
// 	const countTenant = await tx.tenant.count()
// 	if (countTenant > 0) {
// 		console.log("✅ Tenant already seeded")
// 		return
// 	}

// 	const operation = await tx.operation.findFirst()
// 	if (!operation) {
// 		console.log("❌ Operation not found. Run seedOperation first.")
// 		return
// 	}

// 	const tenant = await tx.tenant.create({
// 		data: {
// 			id: ulid(),
// 			name: "BABAE INC",
// 			description: "BABAE INC - Indonesia",
// 			operationId: operation.id,
// 		},
// 	})

// 	const tenantRoleCreateManyInput: Prisma.TenantRoleCreateManyInput[] = [
// 		{
// 			id: ulid(),
// 			identifier: "HEAD_OF_OFFICE",
// 			name: "Head of Office",
// 			description: "Head of Office",
// 			level: 1,
// 		},
// 		{
// 			id: ulid(),
// 			identifier: "OPS_MANAGER",
// 			name: "Ops Manager",
// 			description: "Ops Manager",
// 			level: 2,
// 		},
// 		{
// 			id: ulid(),
// 			identifier: "SUPERVISOR",
// 			name: "Supervisor",
// 			description: "Supervisor",
// 			level: 3,
// 		},
// 		{
// 			id: ulid(),
// 			identifier: "TEAM_LEADER",
// 			name: "Team Leader",
// 			description: "Team Leader",
// 			level: 4,
// 		},
// 		{
// 			id: ulid(),
// 			identifier: "TRAINER",
// 			name: "Trainer",
// 			description: "Trainer",
// 			level: 4,
// 		},
// 		{
// 			id: ulid(),
// 			identifier: "QUALITY_ASSURANCE",
// 			name: "Quality Assurance",
// 			description: "Quality Assurance",
// 			level: 4,
// 		},
// 		{
// 			id: ulid(),
// 			identifier: "AGENT",
// 			name: "Agent",
// 			description: "Agent",
// 			level: 5,
// 		},
// 	]

// 	// safer: create one by one with findUnique by identifier
// 	for (const role of tenantRoleCreateManyInput) {
// 		const exists = await tx.tenantRole.findUnique({
// 			where: { identifier: role.identifier },
// 		})
// 		if (!exists) {
// 			await tx.tenantRole.create({ data: role })
// 		}
// 	}

// 	// Ensure an ADMIN exists and attach as HEAD_OF_OFFICE
// 	let admin = await tx.user.findFirst({ where: { role: Roles.ADMIN } })
// 	if (!admin) {
// 		console.log("ℹ️ ADMIN not found, creating default ADMIN first...")
// 		admin = await upsertUserByEmail(tx, {
// 			email: "admin@test.com",
// 			fullName: "Default Admin",
// 			passwordPlain: "admin1234",
// 			role: Roles.ADMIN,
// 			phoneNumber: "08000000000",
// 		})
// 	}

// 	const headRole = await tx.tenantRole.findUnique({
// 		where: { identifier: "HEAD_OF_OFFICE" },
// 	})
// 	if (headRole) {
// 		await ensureTenantUserRole(tx, {
// 			userId: admin.id,
// 			tenantId: tenant.id,
// 			tenantRoleId: headRole.id,
// 		})
// 	}

// 	console.log("✅ Tenant + TenantRole seeded")
// }

// /** 3) Make Testing Tenant Account for Prod (Trainer + QA) */
// async function seedTrainerAndQA(tx: PrismaClient) {
// 	console.log("🔧 Seeding trainer & QA test accounts...")

// 	const tenant = await tx.tenant.findFirst()
// 	if (!tenant) {
// 		console.log("❌ No tenant found. Please seed tenant first.")
// 		return
// 	}

// 	const [trainerRole, qaRole] = await Promise.all([
// 		tx.tenantRole.findUnique({ where: { identifier: "TRAINER" } }),
// 		tx.tenantRole.findUnique({ where: { identifier: "QUALITY_ASSURANCE" } }),
// 	])

// 	if (!trainerRole) {
// 		console.log("❌ Trainer tenant role not found. Please seed tenant roles first.")
// 		return
// 	}
// 	if (!qaRole) {
// 		console.log("❌ Quality Assurance tenant role not found.")
// 		return
// 	}

// 	// Trainer
// 	const trainerEmail = "trainer2@test.com"
// 	const trainerExisting = await tx.user.findFirst({ where: { email: trainerEmail } })
// 	let trainerUser = trainerExisting
// 	if (!trainerUser) {
// 		trainerUser = await upsertUserByEmail(tx, {
// 			email: trainerEmail,
// 			fullName: "Trainer",
// 			passwordPlain: "trainer1234",
// 			role: Roles.USER,
// 			phoneNumber: "08224567891",
// 		})
// 		console.log("✅ Trainer user created:", trainerEmail)
// 	} else {
// 		console.log("✅ Trainer user exists:", trainerEmail)
// 	}
// 	await ensureTenantUserRole(tx, {
// 		userId: trainerUser.id,
// 		tenantId: tenant.id,
// 		tenantRoleId: trainerRole.id,
// 	})

// 	// QA
// 	const qaEmail = "qa2@test.com"
// 	const qaExisting = await tx.user.findFirst({ where: { email: qaEmail } })
// 	let qaUser = qaExisting
// 	if (!qaUser) {
// 		qaUser = await upsertUserByEmail(tx, {
// 			email: qaEmail,
// 			fullName: "Quality Assurance",
// 			passwordPlain: "qa1234",
// 			role: Roles.USER,
// 			phoneNumber: "08224567892",
// 		})
// 		console.log("✅ QA user created:", qaEmail)
// 	} else {
// 		console.log("✅ QA user exists:", qaEmail)
// 	}
// 	await ensureTenantUserRole(tx, {
// 		userId: qaUser.id,
// 		tenantId: tenant.id,
// 		tenantRoleId: qaRole.id,
// 	})
// }

// /** 4) ACL seeder (adapted from your uploaded file) :contentReference[oaicite:1]{index=1} */
// async function seedAccessControlList(tx: PrismaClient) {
// 	console.log("[SEEDER_LOG] Seeding Access Control List")

// 	const features = [
// 		{ featureName: "USER_MANAGEMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "ACCESS_CONTROL_LIST", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "TENANT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "KNOWLEDGE", actions: ["CREATE", "VIEW", "UPDATE", "DELETE", "APPROVAL", "ARCHIVE"] },
// 		{ featureName: "OPERATION", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "BULK_UPLOAD", actions: ["CREATE"] },
// 		{ featureName: "ANNOUNCEMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "ASSIGNMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "FORUM", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "USER_ACTIVITY_LOG", actions: ["VIEW"] },
// 		{ featureName: "NOTIFICATION", actions: ["VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "AI_PROMPT", actions: ["VIEW", "UPDATE"] },
// 		{ featureName: "BROADCAST", actions: ["VIEW", "UPDATE"] },
// 	]

// 	for (const feature of features) {
// 		const existingFeature = await tx.aclFeature.findUnique({
// 			where: { name: feature.featureName },
// 		})

// 		if (!existingFeature) {
// 			await tx.aclFeature.create({
// 				data: { name: feature.featureName, isDeletable: true, isEditable: true },
// 			})
// 		}

// 		const actionCreateManyData: Prisma.AclActionCreateManyInput[] = []
// 		for (const action of feature.actions) {
// 			const exists = await tx.aclAction.findFirst({
// 				where: { name: action, featureName: feature.featureName },
// 			})
// 			if (!exists) {
// 				actionCreateManyData.push({
// 					id: ulid(),
// 					name: action,
// 					featureName: feature.featureName,
// 				})
// 			}
// 		}
// 		if (actionCreateManyData.length) {
// 			await tx.aclAction.createMany({ data: actionCreateManyData })
// 		}
// 	}

// 	const allAction = await tx.aclAction.findMany({ include: { feature: true } })

// 	const adminExist = await tx.user.findFirst({ where: { role: Roles.ADMIN } })
// 	if (!adminExist) {
// 		console.log("❌ User admin doesnt exist")
// 		return
// 	}

// 	const [
// 		headOfOfficeRole,
// 		opsManagerRole,
// 		supervisorRole,
// 		teamLeaderRole,
// 		trainerRole,
// 		qualityAssuranceRole,
// 		agentRole,
// 	] = await Promise.all([
// 		tx.tenantRole.findUnique({ where: { identifier: "HEAD_OF_OFFICE" } }),
// 		tx.tenantRole.findUnique({ where: { identifier: "OPS_MANAGER" } }),
// 		tx.tenantRole.findUnique({ where: { identifier: "SUPERVISOR" } }),
// 		tx.tenantRole.findUnique({ where: { identifier: "TEAM_LEADER" } }),
// 		tx.tenantRole.findUnique({ where: { identifier: "TRAINER" } }),
// 		tx.tenantRole.findUnique({ where: { identifier: "QUALITY_ASSURANCE" } }),
// 		tx.tenantRole.findUnique({ where: { identifier: "AGENT" } }),
// 	])

// 	const createACLIfMissing = async (tenantRoleId: string, featureName: string, actionName: string) => {
// 		const exists = await tx.accessControlList.findUnique({
// 			where: {
// 				featureName_actionName_tenantRoleId: { featureName, actionName, tenantRoleId },
// 			},
// 		})
// 		if (exists) return
// 		await tx.accessControlList.create({
// 			data: {
// 				id: ulid(),
// 				featureName,
// 				actionName,
// 				tenantRoleId,
// 				createdById: adminExist.id,
// 				updatedById: adminExist.id,
// 			},
// 		})
// 	}

// 	const mapRoleFeatures = async (
// 		role: { id: string } | null,
// 		allowed: { featureName: string; actions: string[] }[],
// 		denyOperationForRole?: boolean,
// 	) => {
// 		if (!role) return
// 		for (const action of allAction) {
// 			const ok = allowed.some(
// 				(f) => f.featureName === action.feature.name && f.actions.includes(action.name),
// 			)
// 			if (!ok) continue

// 			if (denyOperationForRole && action.feature.name === "OPERATION") {
// 				// ensure removed if exists
// 				const exists = await tx.accessControlList.findUnique({
// 					where: {
// 						featureName_actionName_tenantRoleId: {
// 							featureName: action.feature.name,
// 							actionName: action.name,
// 							tenantRoleId: role.id,
// 						},
// 					},
// 				})
// 				if (exists) {
// 					await tx.accessControlList.delete({
// 						where: {
// 							featureName_actionName_tenantRoleId: {
// 								featureName: action.feature.name,
// 								actionName: action.name,
// 								tenantRoleId: role.id,
// 							},
// 						},
// 					})
// 				}
// 				continue
// 			}

// 			await createACLIfMissing(role.id, action.feature.name, action.name)
// 		}
// 	}

// 	await mapRoleFeatures(headOfOfficeRole, [
// 		{ featureName: "USER_MANAGEMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "TENANT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "KNOWLEDGE", actions: ["VIEW"] },
// 		{ featureName: "OPERATION", actions: ["VIEW"] },
// 		{ featureName: "ANNOUNCEMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "ASSIGNMENT", actions: ["VIEW"] },
// 		{ featureName: "FORUM", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "NOTIFICATION", actions: ["VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "AI_PROMPT", actions: ["VIEW"] },
// 		{ featureName: "BROADCAST", actions: ["VIEW"] },
// 	])

// 	// ops manager + supervisor
// 	const opsSupervisorAllowed = [
// 		{ featureName: "USER_MANAGEMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "TENANT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "KNOWLEDGE", actions: ["VIEW"] },
// 		{ featureName: "OPERATION", actions: ["VIEW"] },
// 		{ featureName: "ANNOUNCEMENT", actions: ["VIEW"] },
// 		{ featureName: "ASSIGNMENT", actions: ["VIEW"] },
// 		{ featureName: "FORUM", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "NOTIFICATION", actions: ["VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "AI_PROMPT", actions: ["VIEW"] },
// 		{ featureName: "BROADCAST", actions: ["VIEW"] },
// 	]
// 	await mapRoleFeatures(opsManagerRole, opsSupervisorAllowed)
// 	await mapRoleFeatures(supervisorRole, opsSupervisorAllowed)

// 	await mapRoleFeatures(teamLeaderRole, [
// 		{ featureName: "TENANT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "KNOWLEDGE", actions: ["VIEW"] },
// 		{ featureName: "OPERATION", actions: ["VIEW"] },
// 		{ featureName: "ANNOUNCEMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "ASSIGNMENT", actions: ["VIEW"] },
// 		{ featureName: "FORUM", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "NOTIFICATION", actions: ["VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "AI_PROMPT", actions: ["VIEW"] },
// 		{ featureName: "BROADCAST", actions: ["VIEW"] },
// 	])

// 	// QA + Trainer (QA: deny OPERATION per original logic)
// 	const qaTrainerAllowed = [
// 		{ featureName: "USER_MANAGEMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "ACCESS_CONTROL_LIST", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "TENANT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "KNOWLEDGE", actions: ["CREATE", "VIEW", "UPDATE", "DELETE", "APPROVAL", "ARCHIVE"] },
// 		{ featureName: "BULK_UPLOAD", actions: ["CREATE"] },
// 		{ featureName: "ANNOUNCEMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "ASSIGNMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "FORUM", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "USER_ACTIVITY_LOG", actions: ["VIEW"] },
// 		{ featureName: "NOTIFICATION", actions: ["VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "AI_PROMPT", actions: ["VIEW", "UPDATE"] },
// 		{ featureName: "BROADCAST", actions: ["VIEW", "UPDATE"] },
// 		// OPERATION intentionally not allowed
// 	]
// 	await mapRoleFeatures(qualityAssuranceRole, qaTrainerAllowed, true)
// 	await mapRoleFeatures(trainerRole, qaTrainerAllowed)

// 	await mapRoleFeatures(agentRole, [
// 		{ featureName: "OPERATION", actions: ["VIEW"] },
// 		{ featureName: "KNOWLEDGE", actions: ["VIEW"] },
// 		{ featureName: "TENANT", actions: ["VIEW"] },
// 		{ featureName: "ANNOUNCEMENT", actions: ["VIEW"] },
// 		{ featureName: "ASSIGNMENT", actions: ["VIEW"] },
// 		{ featureName: "FORUM", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "NOTIFICATION", actions: ["VIEW", "UPDATE", "DELETE"] },
// 		{ featureName: "AI_PROMPT", actions: ["VIEW"] },
// 		{ featureName: "BROADCAST", actions: ["VIEW"] },
// 	])

// 	console.log("✅ ACL seeded")
// }

// /** 5) MasterKnowledge Category/SubCategory/Case from existing knowledge */
// async function seedMasterKnowledgeCategorySubCategoryAndCase(tx: PrismaClient) {
// 	const knowledges = await tx.knowledge.findMany()
// 	if (!knowledges.length) return

// 	const cases = knowledges.map((k) => k.case).filter((c): c is string => Boolean(c))
// 	const categories = knowledges.map((k) => k.category).filter((c): c is string => Boolean(c))
// 	const subCategories = knowledges
// 		.map((k) => k.subCategory)
// 		.filter((c): c is string => Boolean(c))

// 	const uniqueCategories = [...new Set(categories)]
// 	const uniqueSubCategories = [...new Set(subCategories)]
// 	const uniqueCases = [...new Set(cases)]

// 	for (const name of uniqueCategories) {
// 		const exists = await tx.masterKnowledgeCategory.findUnique({ where: { name } })
// 		if (!exists) await tx.masterKnowledgeCategory.create({ data: { id: ulid(), name } })
// 	}
// 	for (const name of uniqueSubCategories) {
// 		const exists = await tx.masterKnowledgeSubCategory.findUnique({ where: { name } })
// 		if (!exists) await tx.masterKnowledgeSubCategory.create({ data: { id: ulid(), name } })
// 	}
// 	for (const name of uniqueCases) {
// 		const exists = await tx.masterKnowledgeCase.findUnique({ where: { name } })
// 		if (!exists) await tx.masterKnowledgeCase.create({ data: { id: ulid(), name } })
// 	}

// 	console.log("✅ Master knowledge (category/subcategory/case) seeded")
// }

// /** 6) Knowledge */
// async function seedKnowledge(tx: PrismaClient) {
// 	const count = await tx.knowledge.count()
// 	if (count > 0) {
// 		console.log("✅ Knowledge already seeded")
// 		return
// 	}

// 	const [tenant, adminUser] = await Promise.all([
// 		tx.tenant.findFirst(),
// 		tx.user.findFirst({ where: { role: Roles.ADMIN } }),
// 	])

// 	const userInTenant = await tx.user.findFirst({ where: { role: Roles.USER } })

// 	if (!adminUser) {
// 		console.log("❌ Admin user not found. Please seed admin first.")
// 		return
// 	}

// 	const knowledgeData = [
// 		{
// 			id: ulid(),
// 			tenantId: null as string | null,
// 			category: "Category 1",
// 			subCategory: "Sub Category 1",
// 			case: "Case 1",
// 			type: KnowledgeType.ARTICLE,
// 			access: KnowledgeAccess.EMAIL,
// 			headline: "Cara Menangani Komplain Pelanggan",
// 			status: KnowledgeStatus.APPROVED,
// 			createdByUserId: adminUser.id,
// 			attachments: [{ id: ulid(), attachmentUrl: "https://example.com/attachment1.pdf" }],
// 			contents: [
// 				{
// 					id: ulid(),
// 					title: "Langkah 1: Dengarkan Keluhan",
// 					description:
// 						"Dengarkan keluhan pelanggan dengan seksama tanpa memotong pembicaraan. Tunjukkan empati dan pengertian terhadap situasi yang mereka alami.",
// 					order: 1,
// 					contentAttachments: [
// 						{
// 							id: ulid(),
// 							order: 1,
// 							attachmentUrl: "https://example.com/content1-attachment1.jpg",
// 						},
// 					],
// 				},
// 				{
// 					id: ulid(),
// 					title: "Langkah 2: Identifikasi Masalah",
// 					description:
// 						"Identifikasi akar masalah dengan mengajukan pertanyaan yang relevan. Pastikan Anda memahami masalah dengan baik sebelum memberikan solusi.",
// 					order: 2,
// 					contentAttachments: [
// 						{
// 							id: ulid(),
// 							order: 1,
// 							attachmentUrl: "https://example.com/content2-attachment1.jpg",
// 						},
// 						{
// 							id: ulid(),
// 							order: 2,
// 							attachmentUrl: "https://example.com/content2-attachment2.jpg",
// 						},
// 					],
// 				},
// 				{
// 					id: ulid(),
// 					title: "Langkah 3: Berikan Solusi",
// 					description:
// 						"Tawarkan solusi yang konkret dan dapat dilaksanakan. Jelaskan langkah-langkah yang akan diambil untuk menyelesaikan masalah.",
// 					order: 3,
// 					contentAttachments: [],
// 				},
// 			],
// 		},
// 		{
// 			id: ulid(),
// 			tenantId: tenant?.id ?? null,
// 			category: "Category 2",
// 			subCategory: "Sub Category 2",
// 			case: "Case 2",
// 			headline: "Panduan Penggunaan Sistem CRM",
// 			status: KnowledgeStatus.PENDING,
// 			type: KnowledgeType.ARTICLE,
// 			access: KnowledgeAccess.TENANT,
// 			createdByUserId: adminUser.id,
// 			attachments: [],
// 			contents: [
// 				{
// 					id: ulid(),
// 					title: "Pendahuluan CRM",
// 					description:
// 						"Sistem CRM (Customer Relationship Management) adalah tools yang digunakan untuk mengelola interaksi dengan pelanggan. Sistem ini membantu meningkatkan pelayanan dan kepuasan pelanggan.",
// 					order: 1,
// 					contentAttachments: [
// 						{
// 							id: ulid(),
// 							order: 1,
// 							attachmentUrl: "https://example.com/crm-intro.png",
// 						},
// 					],
// 				},
// 				{
// 					id: ulid(),
// 					title: "Cara Login ke Sistem",
// 					description:
// 						"Untuk login ke sistem CRM, masukkan username dan password yang telah diberikan. Pastikan koneksi internet Anda stabil.",
// 					order: 2,
// 					contentAttachments: [],
// 				},
// 			],
// 		},
// 		{
// 			id: ulid(),
// 			tenantId: null as string | null,
// 			type: KnowledgeType.CASE,
// 			access: KnowledgeAccess.PUBLIC,
// 			category: "Category 3",
// 			subCategory: "Sub Category 3",
// 			case: "Case 3",
// 			headline: "Prosedur Eskalasi Masalah",
// 			status: KnowledgeStatus.REVISION,
// 			createdByUserId: adminUser.id,
// 			attachments: [
// 				{ id: ulid(), attachmentUrl: "https://example.com/eskalasi-flowchart.pdf" },
// 				{ id: ulid(), attachmentUrl: "https://example.com/eskalasi-template.docx" },
// 			],
// 			contents: [
// 				{
// 					id: ulid(),
// 					title: "Kapan Harus Eskalasi",
// 					description:
// 						"Eskalasi dilakukan ketika masalah tidak dapat diselesaikan di level Anda atau memerlukan persetujuan dari atasan. Pastikan semua informasi terdokumentasi dengan baik.",
// 					order: 1,
// 					contentAttachments: [],
// 				},
// 				{
// 					id: ulid(),
// 					title: "Proses Eskalasi",
// 					description:
// 						"Hubungi supervisor atau manager melalui channel yang telah ditentukan. Berikan informasi lengkap mengenai kasus yang perlu dieskalasi.",
// 					order: 2,
// 					contentAttachments: [
// 						{
// 							id: ulid(),
// 							order: 1,
// 							attachmentUrl: "https://example.com/eskalasi-process.png",
// 						},
// 					],
// 				},
// 				{
// 					id: ulid(),
// 					title: "Follow Up",
// 					description:
// 						"Lakukan follow up secara berkala untuk memastikan masalah telah ditangani dengan baik.",
// 					order: 3,
// 					contentAttachments: [],
// 				},
// 			],
// 		},
// 	]

// 	for (const knowledge of knowledgeData) {
// 		await tx.$transaction(async (t) => {
// 			await t.knowledge.create({
// 				data: {
// 					id: knowledge.id,
// 					tenantId: knowledge.tenantId,
// 					type: knowledge.type,
// 					access: knowledge.access,
// 					category: knowledge.category,
// 					subCategory: knowledge.subCategory,
// 					case: knowledge.case,
// 					headline: knowledge.headline,
// 					status: knowledge.status,
// 					createdByUserId: knowledge.createdByUserId,
// 				},
// 			})

// 			if (knowledge.attachments.length) {
// 				await t.knowledgeAttachment.createMany({
// 					data: knowledge.attachments.map((a) => ({ ...a, knowledgeId: knowledge.id })),
// 				})
// 			}

// 			for (const content of knowledge.contents) {
// 				await t.knowledgeContent.create({
// 					data: {
// 						id: content.id,
// 						knowledgeId: knowledge.id,
// 						title: content.title,
// 						description: content.description,
// 						order: content.order,
// 					},
// 				})

// 				if (content.contentAttachments.length) {
// 					await t.knowledgeContentAttachment.createMany({
// 						data: content.contentAttachments.map((a) => ({
// 							...a,
// 							knowledgeContentId: content.id,
// 						})),
// 					})
// 				}
// 			}

// 			if (knowledge.access === KnowledgeAccess.EMAIL && userInTenant) {
// 				await t.userKnowledge.create({
// 					data: { id: ulid(), knowledgeId: knowledge.id, userId: userInTenant.id },
// 				})
// 			}

// 			await t.knowledgeActivityLog.create({
// 				data: {
// 					id: ulid(),
// 					knowledgeId: knowledge.id,
// 					action: KnowledgeActivityLogAction.CREATE,
// 					createdByUserId: knowledge.createdByUserId,
// 				},
// 			})

// 			if (knowledge.status === KnowledgeStatus.APPROVED) {
// 				await t.knowledgeActivityLog.create({
// 					data: {
// 						id: ulid(),
// 						knowledgeId: knowledge.id,
// 						action: KnowledgeActivityLogAction.APPROVE,
// 						createdByUserId: knowledge.createdByUserId,
// 					},
// 				})
// 			} else if (knowledge.status === KnowledgeStatus.REVISION) {
// 				await t.knowledgeActivityLog.create({
// 					data: {
// 						id: ulid(),
// 						knowledgeId: knowledge.id,
// 						action: KnowledgeActivityLogAction.REVISION,
// 						createdByUserId: knowledge.createdByUserId,
// 					},
// 				})
// 			}
// 		})

// 		console.log(`✅ Knowledge "${knowledge.headline}" seeded`)
// 	}

// 	console.log(`✅ All ${knowledgeData.length} knowledge entries seeded`)
// }

// /** 7) Forum */
// async function seedForum(tx: PrismaClient) {
// 	const count = await tx.forum.count()
// 	if (count > 0) {
// 		console.log("✅ Forum already seeded")
// 		return
// 	}

// 	const [tenant, admin] = await Promise.all([
// 		tx.tenant.findFirst(),
// 		tx.user.findFirst({ where: { role: Roles.ADMIN } }),
// 	])
// 	if (!tenant || !admin) return

// 	const forum = await tx.forum.create({
// 		data: {
// 			id: ulid(),
// 			title: "Forum 1",
// 			content: "Forum 1 content",
// 			tenantId: tenant.id,
// 			createdByUserId: admin.id,
// 		},
// 	})

// 	await tx.forumAttachment.create({
// 		data: {
// 			id: ulid(),
// 			forumId: forum.id,
// 			attachmentUrl: "https://example.com/attachment1.jpg",
// 		},
// 	})

// 	console.log("✅ Forum seeded")
// }

// /** 8) Broadcast */
// async function seedBroadcast(tx: PrismaClient) {
// 	const count = await tx.broadcast.count()
// 	if (count > 0) {
// 		console.log("✅ Broadcast already seeded")
// 		return
// 	}

// 	const tenants = await tx.tenant.findMany()
// 	for (const tenant of tenants) {
// 		await tx.broadcast.create({
// 			data: { id: ulid(), tenantId: tenant.id, content: "Hello, this is a broadcast message" },
// 		})
// 	}

// 	console.log("✅ Broadcast seeded")
// }

// /** 9) Assignment */
// async function seedAssignment(tx: PrismaClient) {
// 	const assignmentCount = await tx.assignment.count()
// 	if (assignmentCount > 0) {
// 		console.log("✅ Assignment already seeded")
// 		return
// 	}

// 	const [tenant, tenantRoles, regularUser, adminUser] = await Promise.all([
// 		tx.tenant.findFirst(),
// 		tx.tenantRole.findMany(),
// 		tx.user.findFirst({ where: { email: "user@test.com" } }),
// 		tx.user.findFirst({ where: { email: "admin@test.com" } }),
// 	])

// 	if (!tenant || !regularUser || !adminUser) {
// 		console.log("❌ Missing tenant/user/admin. Ensure seedOperation+seedTenant ran.")
// 		return
// 	}

// 	const tenantRoleByIdentifier = tenantRoles.reduce<Record<string, string>>((acc, role) => {
// 		acc[role.identifier] = role.id
// 		return acc
// 	}, {})

// 	const thirtyDaysLater = DateTime.now().plus({ days: 30 }).toFormat("yyyy-MM-dd")
// 	const fourteenDaysLater = DateTime.now().plus({ days: 14 }).toFormat("yyyy-MM-dd")

// 	const assignments = [
// 		{
// 			id: ulid(),
// 			title: "Onboarding Customer Service",
// 			durationInMinutes: 45,
// 			tenantId: tenant.id,
// 			access: AssignmentAccess.TENANT_ROLE,
// 			expiredDate: thirtyDaysLater,
// 			createdByUserId: adminUser.id,
// 			roleAccessIdentifiers: ["TRAINER", "AGENT"],
// 			questions: [
// 				{
// 					id: ulid(),
// 					order: 1,
// 					content: "Saat menghadapi pelanggan yang marah, langkah pertama yang harus dilakukan adalah?",
// 					type: AssignmentQuestionType.MULTIPLE_CHOICE,
// 					options: [
// 						{ id: ulid(), content: "Menjelaskan kebijakan perusahaan secepat mungkin", isCorrectAnswer: false },
// 						{ id: ulid(), content: "Mendengarkan dengan tenang tanpa menyela", isCorrectAnswer: true },
// 						{ id: ulid(), content: "Memberikan diskon segera", isCorrectAnswer: false },
// 						{ id: ulid(), content: "Mengakhiri panggilan agar emosi mereda", isCorrectAnswer: false },
// 					],
// 				},
// 				{
// 					id: ulid(),
// 					order: 2,
// 					content: "Tuliskan contoh kalimat empati yang tepat ketika pelanggan menyampaikan keluhan mengenai keterlambatan layanan.",
// 					type: AssignmentQuestionType.ESSAY,
// 					essayReferenceAnswer: { id: ulid(), content: "Maaf atas ketidaknyamanan yang Anda alami. Kami memahami betapa pentingnya layanan tepat waktu bagi Anda." },
// 				},
// 				{
// 					id: ulid(),
// 					order: 3,
// 					content: "Follow up setelah menyelesaikan keluhan pelanggan adalah opsional.",
// 					type: AssignmentQuestionType.TRUE_FALSE,
// 					trueFalseAnswer: { id: ulid(), correctAnswer: false },
// 				},
// 			],
// 		},
// 		{
// 			id: ulid(),
// 			title: "Quality Assurance Refresher",
// 			durationInMinutes: 30,
// 			tenantId: tenant.id,
// 			access: AssignmentAccess.USER,
// 			expiredDate: fourteenDaysLater,
// 			createdByUserId: adminUser.id,
// 			userIds: [regularUser.id],
// 			questions: [
// 				{
// 					id: ulid(),
// 					order: 1,
// 					content: "Apa tujuan utama dari monitoring percakapan oleh tim Quality Assurance?",
// 					type: AssignmentQuestionType.MULTIPLE_CHOICE,
// 					options: [
// 						{ id: ulid(), content: "Menemukan kesalahan untuk diberikan sanksi", isCorrectAnswer: false },
// 						{ id: ulid(), content: "Mengoptimalkan performa layanan dan memastikan standar terpenuhi", isCorrectAnswer: true },
// 						{ id: ulid(), content: "Memberikan penilaian subjektif kepada agen", isCorrectAnswer: false },
// 						{ id: ulid(), content: "Mengurangi biaya operasional secara langsung", isCorrectAnswer: false },
// 					],
// 				},
// 				{
// 					id: ulid(),
// 					order: 2,
// 					content: "Sebutkan dua metrik utama yang digunakan dalam penilaian Quality Assurance.",
// 					type: AssignmentQuestionType.ESSAY,
// 					essayReferenceAnswer: { id: ulid(), content: "Contoh metrik: kepatuhan skrip dan skor kepuasan pelanggan (CSAT)." },
// 				},
// 				{
// 					id: ulid(),
// 					order: 3,
// 					content: "Pencatatan temuan QA harus dilakukan segera setelah sesi monitoring.",
// 					type: AssignmentQuestionType.TRUE_FALSE,
// 					trueFalseAnswer: { id: ulid(), correctAnswer: true },
// 				},
// 			],
// 		},
// 	] as const

// 	for (const assignment of assignments) {
// 		await tx.$transaction(async (t) => {
// 			await t.assignment.create({
// 				data: {
// 					id: assignment.id,
// 					title: assignment.title,
// 					durationInMinutes: assignment.durationInMinutes,
// 					tenantId: assignment.tenantId,
// 					expiredDate: assignment.expiredDate,
// 					access: assignment.access,
// 					createdByUserId: assignment.createdByUserId,
// 				},
// 			})

// 			if ("roleAccessIdentifiers" in assignment && assignment.roleAccessIdentifiers?.length) {
// 				const accessData = assignment.roleAccessIdentifiers
// 					.map((identifier) => tenantRoleByIdentifier[identifier])
// 					.filter((roleId): roleId is string => Boolean(roleId))
// 					.map((roleId) => ({ id: ulid(), assignmentId: assignment.id, tenantRoleId: roleId }))

// 				if (accessData.length) {
// 					await t.assignmentTenantRoleAccess.createMany({ data: accessData })
// 				}
// 			}

// 			if ("userIds" in assignment && assignment.userIds?.length) {
// 				await t.assignmentUserAccess.createMany({
// 					data: assignment.userIds.map((userId) => ({
// 						id: ulid(),
// 						assignmentId: assignment.id,
// 						userId,
// 					})),
// 				})
// 			}

// 			for (const question of assignment.questions) {
// 				await t.assignmentQuestion.create({
// 					data: {
// 						id: question.id,
// 						assignmentId: assignment.id,
// 						content: question.content,
// 						order: question.order,
// 						type: question.type,
// 					},
// 				})

// 				if (question.options?.length) {
// 					await t.assignmentQuestionOption.createMany({
// 						data: question.options.map((option) => ({
// 							...option,
// 							assignmentQuestionId: question.id,
// 						})),
// 					})
// 				}

// 				if (question.essayReferenceAnswer) {
// 					await t.assignmentQuestionEssayReferenceAnswer.create({
// 						data: {
// 							id: question.essayReferenceAnswer.id,
// 							assignmentQuestionId: question.id,
// 							content: question.essayReferenceAnswer.content,
// 						},
// 					})
// 				}

// 				if (question.trueFalseAnswer) {
// 					await t.assignmentQuestionTrueFalseAnswer.create({
// 						data: {
// 							id: question.trueFalseAnswer.id,
// 							assignmentQuestionId: question.id,
// 							correctAnswer: question.trueFalseAnswer.correctAnswer,
// 						},
// 					})
// 				}
// 			}
// 		})

// 		console.log(`✅ Assignment "${assignment.title}" seeded`)
// 	}

// 	console.log(`✅ All ${assignments.length} assignments seeded`)
// }

// /** 10) Announcement */
// async function seedAnnouncement(tx: PrismaClient) {
// 	const count = await tx.announcement.count()
// 	if (count > 0) {
// 		console.log("✅ Announcement already seeded")
// 		return
// 	}

// 	const [tenant, tenantRoles, adminUser] = await Promise.all([
// 		tx.tenant.findFirst(),
// 		tx.tenantRole.findMany(),
// 		tx.user.findFirst({ where: { role: Roles.ADMIN } }),
// 	])

// 	if (!tenant || !adminUser) return

// 	await tx.announcement.create({
// 		data: {
// 			id: ulid(),
// 			title: "Announcement 1",
// 			content: "Announcement 1 content",
// 			tenantId: tenant.id,
// 			createdByUserId: adminUser.id,
// 			announcementTenantRoleAccesses: {
// 				createMany: {
// 					data: tenantRoles.map((role) => ({ id: ulid(), tenantRoleId: role.id })),
// 				},
// 			},
// 		},
// 	})

// 	console.log("✅ Announcement seeded")
// }

// /** 11) AI Prompt */
// async function seedAiPrompt(tx: PrismaClient) {
// 	const count = await tx.aiPrompt.count()
// 	if (count > 0) {
// 		console.log("✅ AI Prompt already seeded")
// 		return
// 	}

// 	const tenants = await tx.tenant.findMany()
// 	for (const tenant of tenants) {
// 		await tx.aiPrompt.create({
// 			data: {
// 				id: ulid(),
// 				tenantId: tenant.id,
// 				prompt: `Anda adalah seorang konsultan manajemen proyek senior. Saya ingin membuat rencana kerja 3 bulan untuk meluncurkan produk aplikasi edukasi keuangan baru.
// Respons Anda harus mencakup:
// Tahap 1: Persiapan (Bulan 1): Fokus pada riset pasar dan desain dasar.
// Tahap 2: Pengembangan (Bulan 2): Fokus pada coding inti (MVP/Minimum Viable Product).
// Tahap 3: Peluncuran (Bulan 3): Fokus pada pengujian beta, pemasaran awal, dan launching.
// Format: Sajikan rencana ini dalam bentuk tabel markdown dengan empat kolom: Tahap, Minggu, Aktivitas Utama, dan Indikator Keberhasilan (KPI).
// Gaya Bahasa: Gunakan bahasa Indonesia formal dan profesional, dan cetak tebal istilah-istilah kunci dalam manajemen proyek.`,
// 			},
// 		})
// 	}

// 	console.log("✅ AI Prompt seeded")
// }

// /** Runner (single entry) */
// async function runSeed() {
// 	console.log("🚀 Starting seed...")

// 	await prisma.$transaction(async (tx) => {
// 		await seedOperation(tx) //ini rusak tx nya karena
// 		await seedTenant(tx)
// 		await seedTrainerAndQA(tx)
// 		await seedAccessControlList(tx)
// 		await seedKnowledge(tx)
// 		await seedMasterKnowledgeCategorySubCategoryAndCase(tx)
// 		await seedForum(tx)
// 		await seedBroadcast(tx)
// 		await seedAssignment(tx)
// 		await seedAnnouncement(tx)
// 		await seedAiPrompt(tx)
// 	})

// 	console.log("🎉 All seeding completed")
// }

// runSeed()
// 	.catch((e) => {
// 		console.error("❌ Seed failed:", e)
// 		process.exitCode = 1
// 	})
// 	.finally(async () => {
// 		await prisma.$disconnect()
// 	})

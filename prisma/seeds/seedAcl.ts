import { Prisma, PrismaClient } from "../../generated/prisma/client"
import { ulid } from "ulid"

export async function seedAccessControlList(prisma: PrismaClient) {
	console.log("[SEEDER_LOG] Seeding Access Control List")
	const features = [
		{
			featureName: "USER_MANAGEMENT",
			actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
		},
		{
			featureName: "ACCESS_CONTROL_LIST",
			actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
		},
		{
			featureName: "TENANT",
			actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
		},
		{
			featureName: "KNOWLEDGE",
			actions: ["CREATE", "VIEW", "UPDATE", "DELETE", "APPROVAL", "ARCHIVE"],
		},
		{
			featureName: "OPERATION",
			actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
		},
		{
			featureName: "BULK_UPLOAD",
			actions: ["CREATE"],
		},
		{
			featureName: "ANNOUNCEMENT",
			actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
		},
		{
			featureName: "ASSIGNMENT",
			actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
		},
		{
			featureName: "FORUM",
			actions: ["CREATE", "VIEW", "UPDATE", "DELETE"],
		},
		{
			featureName: "USER_ACTIVITY_LOG",
			actions: ["VIEW"],
		},
		{
			featureName: "NOTIFICATION",
			actions: ["VIEW", "UPDATE", "DELETE"],
		},
		{
			featureName: "AI_PROMPT",
			actions: ["VIEW", "UPDATE"],
		},
		{
			featureName: "BROADCAST",
			actions: ["VIEW", "UPDATE"],
		},
	]

	for (const feature of features) {
		const existingFeature = await prisma.aclFeature.findUnique({
			where: {
				name: feature.featureName,
			},
		})

		if (!existingFeature) {
			await prisma.aclFeature.create({
				data: {
					name: feature.featureName,
					isDeletable: true,
					isEditable: true,
				},
			})
		}

		const actionCreateManyData: Prisma.AclActionCreateManyInput[] = []
		for (const action of feature.actions) {
			const existingSubFeature = await prisma.aclAction.findFirst({
				where: {
					name: action,
					featureName: feature.featureName,
				},
			})

			if (!existingSubFeature) {
				actionCreateManyData.push({
					id: ulid(),
					name: action,
					featureName: feature.featureName,
				})
			}
		}
		if (actionCreateManyData.length > 0) {
			await prisma.aclAction.createMany({
				data: actionCreateManyData,
			})
		}
	}

	// [CLEANUP] Remove ACCESS_CONTROL_LIST from all non-admin roles to ensure strict restriction
	console.log("  Cleaning up restricted features from existing roles...")
	await prisma.accessControlList.deleteMany({
		where: {
			featureName: "ACCESS_CONTROL_LIST",
		},
	})

	const allAction = await prisma.aclAction.findMany({
		include: {
			feature: true,
		},
	})

	const adminExist = await prisma.user.findFirst({
		where: {
			role: "ADMIN",
		},
	})

	if (!adminExist) {
		console.log("User admin doesnt exist")
		return
	}

	// Fetch ALL roles from the database to handle multiple tenants
	const allRoles = await prisma.tenantRole.findMany()
	const rolesByIdentifier = allRoles.reduce((acc, role) => {
		if (!acc[role.identifier]) acc[role.identifier] = []
		acc[role.identifier].push(role)
		return acc
	}, {} as Record<string, typeof allRoles>)

	const accessControlListCreateManyData: Prisma.AccessControlListCreateManyInput[] = []

	// Define feature sets for each role type
	const headOfOfficeFeatures = [
		{ featureName: "USER_MANAGEMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "TENANT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "KNOWLEDGE", actions: ["VIEW"] },
		{ featureName: "OPERATION", actions: ["VIEW"] },
		{ featureName: "ANNOUNCEMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "ASSIGNMENT", actions: ["VIEW"] },
		{ featureName: "FORUM", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "NOTIFICATION", actions: ["VIEW", "UPDATE", "DELETE"] },
		{ featureName: "AI_PROMPT", actions: ["VIEW"] },
		{ featureName: "BROADCAST", actions: ["VIEW"] },
	]

	const opsSupervisorFeatures = [
		{ featureName: "USER_MANAGEMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "TENANT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "KNOWLEDGE", actions: ["VIEW"] },
		{ featureName: "OPERATION", actions: ["VIEW"] },
		{ featureName: "ANNOUNCEMENT", actions: ["VIEW"] },
		{ featureName: "ASSIGNMENT", actions: ["VIEW"] },
		{ featureName: "FORUM", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "NOTIFICATION", actions: ["VIEW", "UPDATE", "DELETE"] },
		{ featureName: "AI_PROMPT", actions: ["VIEW"] },
		{ featureName: "BROADCAST", actions: ["VIEW"] },
	]

	const teamLeaderFeatures = [
		{ featureName: "TENANT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "KNOWLEDGE", actions: ["VIEW"] },
		{ featureName: "OPERATION", actions: ["VIEW"] },
		{ featureName: "ANNOUNCEMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "ASSIGNMENT", actions: ["VIEW"] },
		{ featureName: "FORUM", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "NOTIFICATION", actions: ["VIEW", "UPDATE", "DELETE"] },
		{ featureName: "AI_PROMPT", actions: ["VIEW"] },
		{ featureName: "BROADCAST", actions: ["VIEW"] },
	]

	const checkerFeatures = [
		{ featureName: "USER_MANAGEMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "KNOWLEDGE", actions: ["CREATE", "VIEW", "UPDATE", "DELETE", "APPROVAL", "ARCHIVE"] },
		{ featureName: "ASSIGNMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "FORUM", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "AI_PROMPT", actions: ["VIEW", "UPDATE"] },
		{ featureName: "NOTIFICATION", actions: ["VIEW", "UPDATE", "DELETE"] },
		{ featureName: "BROADCAST", actions: ["VIEW", "UPDATE"] },
		{ featureName: "BULK_UPLOAD", actions: ["CREATE"] },
	]

	const makerFeatures = [
		{ featureName: "AI_PROMPT", actions: ["VIEW"] },
		{ featureName: "KNOWLEDGE", actions: ["VIEW"] },
		{ featureName: "ASSIGNMENT", actions: ["CREATE", "VIEW", "UPDATE"] },
		{ featureName: "USER_MANAGEMENT", actions: ["VIEW"] },
		{ featureName: "FORUM", actions: ["VIEW"] },
		{ featureName: "NOTIFICATION", actions: ["VIEW", "UPDATE", "DELETE"] },
	]

	const consumerFeatures = [
		{ featureName: "AI_PROMPT", actions: ["VIEW"] },
		{ featureName: "KNOWLEDGE", actions: ["VIEW"] },
		{ featureName: "ASSIGNMENT", actions: ["VIEW"] },
		{ featureName: "FORUM", actions: ["VIEW"] },
		{ featureName: "NOTIFICATION", actions: ["VIEW", "UPDATE", "DELETE"] },
	]

	const qaTrainerFeatures = [
		{ featureName: "USER_MANAGEMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "TENANT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "KNOWLEDGE", actions: ["CREATE", "VIEW", "UPDATE", "DELETE", "APPROVAL", "ARCHIVE"] },
		{ featureName: "BULK_UPLOAD", actions: ["CREATE"] },
		{ featureName: "ANNOUNCEMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "ASSIGNMENT", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "FORUM", actions: ["CREATE", "VIEW", "UPDATE", "DELETE"] },
		{ featureName: "USER_ACTIVITY_LOG", actions: ["VIEW"] },
		{ featureName: "NOTIFICATION", actions: ["VIEW", "UPDATE", "DELETE"] },
		{ featureName: "AI_PROMPT", actions: ["VIEW"] },
		{ featureName: "BROADCAST", actions: ["VIEW", "UPDATE"] },
	]

	const roleMapping: Record<string, { featureName: string; actions: string[] }[]> = {
		HEAD_OF_OFFICE: headOfOfficeFeatures,
		OPS_MANAGER: opsSupervisorFeatures,
		SUPERVISOR: opsSupervisorFeatures,
		TEAM_LEADER: teamLeaderFeatures,
		QUALITY_ASSURANCE: qaTrainerFeatures,
		CHECKER: checkerFeatures,
		TRAINER: qaTrainerFeatures,
		MAKER: makerFeatures,
		AGENT: consumerFeatures,
		CONSUMER: consumerFeatures,
	}

	for (const [identifier, allowedFeatures] of Object.entries(roleMapping)) {
		const roles = rolesByIdentifier[identifier] || []
		if (roles.length === 0) continue

		console.log(`  Mapping features for identifier: ${identifier} (${roles.length} roles found)`)

		for (const role of roles) {
			for (const action of allAction) {
				const isAllowed = allowedFeatures.some(
					(f) => f.featureName === action.feature.name && f.actions.includes(action.name)
				)

				if (isAllowed) {
					// Special rule: Deny OPERATION for QA and CHECKER
					if ((identifier === "QUALITY_ASSURANCE" || identifier === "CHECKER") && action.feature.name === "OPERATION") {
						continue
					}

					const mappingExists = await prisma.accessControlList.findUnique({
						where: {
							featureName_actionName_tenantRoleId: {
								featureName: action.feature.name,
								actionName: action.name,
								tenantRoleId: role.id,
							},
						},
					})

					if (!mappingExists) {
						accessControlListCreateManyData.push({
							id: ulid(),
							featureName: action.feature.name,
							actionName: action.name,
							tenantRoleId: role.id,
							createdById: adminExist.id,
							updatedById: adminExist.id,
						})
					}
				}
			}
		}
	}

	if (accessControlListCreateManyData.length > 0) {
		const result = await prisma.accessControlList.createMany({
			data: accessControlListCreateManyData,
		})
		console.log(`Access Control List created: ${result.count} mappings added`)
	} else {
		console.log("Access Control List is up to date (no new mappings needed)")
	}
}

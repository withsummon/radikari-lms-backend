import * as UserKnowledgeReadLogRepository from "$repositories/UserKnowledgeReadLogRepository"
import { prisma } from "$pkg/prisma"

type ServiceResult<T> =
	| { status: true; data: T }
	| { status: false; message: string; code?: number; error?: unknown }

function ok<T>(data: T): ServiceResult<T> {
	return { status: true, data }
}

function fail(
	message: string,
	error?: unknown,
	code?: number,
): ServiceResult<never> {
	return { status: false, message, error, code }
}

export async function getAllByTenant(tenantId: string, filters: any) {
	try {
		const data = await UserKnowledgeReadLogRepository.getAllByTenant(
			tenantId,
			filters,
		)
		return ok(data)
	} catch (e) {
		return fail("Failed to fetch knowledge read logs", e)
	}
}

export async function getStatusInTenant(
	tenantId: string,
	userId: string,
	knowledgeId: string,
) {
	try {
		const knowledge = await prisma.knowledge.findFirst({
			where: { id: knowledgeId, tenantId },
			select: { id: true },
		})
		if (!knowledge) return fail("Knowledge not found in tenant", null, 404)

		const data = await UserKnowledgeReadLogRepository.getByUserAndKnowledge(
			userId,
			knowledgeId,
		)
		return ok(data)
	} catch (e) {
		return fail("Failed to fetch read status", e)
	}
}

export async function markViewedInTenant(
	tenantId: string,
	userId: string,
	knowledgeId: string,
) {
	try {
		const knowledge = await prisma.knowledge.findFirst({
			where: { id: knowledgeId, tenantId },
			select: { id: true },
		})
		if (!knowledge) return fail("Knowledge not found in tenant", null, 404)

		const data = await UserKnowledgeReadLogRepository.upsertView(
			userId,
			knowledgeId,
		)
		return ok(data)
	} catch (e) {
		return fail("Failed to mark knowledge as viewed", e)
	}
}

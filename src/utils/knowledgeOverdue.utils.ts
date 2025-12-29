// src/utils/knowledgeOverdue.utils.ts

export type ComputeOverdueOpts = {
	status: string
	createdAt?: string | Date | null
	thresholdHours?: number // default 24
	now?: Date // for testing
}

export function computeOverduePending(opts: ComputeOverdueOpts) {
	const { status, createdAt, thresholdHours = 24, now = new Date() } = opts

	if (status !== "PENDING") {
		return {
			isOverduePending: false,
			pendingAgeHours: 0,
			overdueAt: null as string | null,
		}
	}

	if (!createdAt) {
		return {
			isOverduePending: false,
			pendingAgeHours: 0,
			overdueAt: null as string | null,
		}
	}

	const created = createdAt instanceof Date ? createdAt : new Date(createdAt)
	const createdMs = created.getTime()
	const nowMs = now.getTime()

	if (Number.isNaN(createdMs) || nowMs < createdMs) {
		return {
			isOverduePending: false,
			pendingAgeHours: 0,
			overdueAt: null as string | null,
		}
	}

	const diffMs = nowMs - createdMs
	const pendingAgeHoursRaw = diffMs / (1000 * 60 * 60)
	const isOverduePending = pendingAgeHoursRaw >= thresholdHours

	const overdueAt = isOverduePending
		? new Date(createdMs + thresholdHours * 60 * 60 * 1000).toISOString()
		: null

	return {
		isOverduePending,
		pendingAgeHours: Math.floor(pendingAgeHoursRaw * 10) / 10, // 1 decimal
		overdueAt,
	}
}

/**
 * Menambahkan flag overdue ke bentuk response service yang umum:
 * - jika punya { entries: [...] } => patch entries
 * - jika punya { content: { entries: [...] } } => patch content.entries
 */
export function attachOverdueToKnowledgeList<T extends any>(
	data: T,
	thresholdHours = 24,
): T {
	const patchEntry = (item: any) => {
		const computed = computeOverduePending({
			status: item?.status,
			createdAt: item?.createdAt,
			thresholdHours,
		})

		return { ...item, ...computed }
	}

	// case A: data.entries
	if (
		data &&
		typeof data === "object" &&
		Array.isArray((data as any).entries)
	) {
		return {
			...(data as any),
			entries: (data as any).entries.map(patchEntry),
		}
	}

	// case B: data.content.entries
	if (
		data &&
		typeof data === "object" &&
		(data as any).content &&
		Array.isArray((data as any).content.entries)
	) {
		return {
			...(data as any),
			content: {
				...(data as any).content,
				entries: (data as any).content.entries.map(patchEntry),
			},
		}
	}

	// fallback: return as is
	return data
}

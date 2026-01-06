import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { MasterKnowledgeSubCategoryDTO } from "$entities/MasterKnowledgeSubCategory"

// ✅ FIX: Terima tenantId sebagai parameter terpisah
export async function create(
	tenantId: string,
	data: MasterKnowledgeSubCategoryDTO,
) {
	return await prisma.masterKnowledgeSubCategory.create({
		data: {
			name: data.name,
			categoryId: data.categoryId,
			tenantId: tenantId, // ✅ Inject tenantId di sini
		},
	})
}

// ✅ FIX: Terima tenantId untuk filtering data
export async function getAll(
	tenantId: string,
	filters: EzFilter.FilteringQuery,
) {
	const queryBuilder = new EzFilter.BuildQueryFilter()
	const usedFilters = queryBuilder.build(filters)

	// ✅ Inject tenantId ke dalam 'where' clause EzFilter
	const whereClause = {
		...usedFilters.query.where,
		tenantId: tenantId,
	}

	const [masterKnowledgeSubCategory, totalData] = await Promise.all([
		prisma.masterKnowledgeSubCategory.findMany({
			...(usedFilters.query as any),
			where: whereClause, // Override where dengan tenantId
			// ✅ Include Parent & Count Child (Penting untuk UI Admin & Logic Delete)
			include: {
				category: true,
				_count: {
					select: { cases: true },
				},
			},
		}),
		prisma.masterKnowledgeSubCategory.count({
			where: whereClause,
		}),
	])

	let totalPage = 1
	if (usedFilters.query.take && totalData > usedFilters.query.take) {
		totalPage = Math.ceil(totalData / usedFilters.query.take)
	}

	return {
		entries: masterKnowledgeSubCategory,
		totalData,
		totalPage,
	}
}

export async function getById(id: string) {
	return await prisma.masterKnowledgeSubCategory.findUnique({
		where: {
			id,
		},
		// ✅ Include Count Child (Penting untuk Service Delete Guard)
		include: {
			category: true,
			_count: {
				select: { cases: true },
			},
		},
	})
}

export async function update(id: string, data: MasterKnowledgeSubCategoryDTO) {
	return await prisma.masterKnowledgeSubCategory.update({
		where: {
			id,
		},
		data: {
			name: data.name,
			// categoryId & tenantId biasanya tidak diupdate di sini,
			// kecuali ada fitur 'Move Category'
		},
	})
}

export async function deleteById(id: string) {
	return await prisma.masterKnowledgeSubCategory.delete({
		where: {
			id,
		},
	})
}

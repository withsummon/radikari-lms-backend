import { MasterKnowledgeCategory } from "../../generated/prisma/client"
import { MasterKnowledgeCategoryDTO } from "$entities/MasterKnowledgeCategory"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import {
	HandleServiceResponseCustomError,
	HandleServiceResponseSuccess,
	ResponseStatus,
	ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"

export async function create(
	tenantId: string, // ✅ Terima tenantId
	data: MasterKnowledgeCategoryDTO,
): Promise<ServiceResponse<MasterKnowledgeCategory | {}>> {
	try {
		const createdData = await prisma.masterKnowledgeCategory.create({
			data: {
				name: data.name,
				tenantId: tenantId,
			},
		})
		return HandleServiceResponseSuccess(createdData)
	} catch (err) {
		Logger.error(`MasterKnowledgeCategoryService.create : `, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getAll(
	tenantId: string, // ✅ Terima tenantId
	filters: EzFilter.FilteringQuery,
): Promise<
	ServiceResponse<EzFilter.PaginatedResult<MasterKnowledgeCategory[]> | {}>
> {
	try {
		// ✅ Filter by tenantId & Include Count Child
		const queryBuilder = new EzFilter.BuildQueryFilter()
		const { filters: rawFilters, ...rest } = filters
		const usedFilters = queryBuilder.build(rest as any) // Use 'rest' to avoid double filtering if filters param string is passed

		// Manual Filters override/injection
		usedFilters.query.where = {
			...usedFilters.query.where,
			tenantId: tenantId,
		}

		// Include Count Children
		usedFilters.query.include = {
			_count: {
				select: { subCategories: true },
			},
		}

		const [data, totalData] = await Promise.all([
			prisma.masterKnowledgeCategory.findMany(usedFilters.query as any),
			prisma.masterKnowledgeCategory.count({
				where: usedFilters.query.where,
			}),
		])

		let totalPage = 1
		if (totalData > usedFilters.query.take)
			totalPage = Math.ceil(totalData / usedFilters.query.take)

		return HandleServiceResponseSuccess({
			entries: data,
			totalData,
			totalPage,
		})
	} catch (err) {
		Logger.error(`MasterKnowledgeCategoryService.getAll`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getById(
	id: string,
): Promise<ServiceResponse<MasterKnowledgeCategory | {}>> {
	try {
		const masterKnowledgeCategory =
			await prisma.masterKnowledgeCategory.findUnique({
				where: { id },
				include: {
					_count: { select: { subCategories: true } },
				},
			})

		if (!masterKnowledgeCategory)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		return HandleServiceResponseSuccess(masterKnowledgeCategory)
	} catch (err) {
		Logger.error(`MasterKnowledgeCategoryService.getById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export type UpdateResponse = MasterKnowledgeCategory | {}

export async function update(
	id: string,
	data: MasterKnowledgeCategoryDTO,
): Promise<ServiceResponse<UpdateResponse>> {
	try {
		const existing = await prisma.masterKnowledgeCategory.findUnique({
			where: { id },
		})

		if (!existing)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		const updated = await prisma.masterKnowledgeCategory.update({
			where: { id },
			data: { name: data.name },
		})

		return HandleServiceResponseSuccess(updated)
	} catch (err) {
		Logger.error(`MasterKnowledgeCategoryService.update`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function deleteById(id: string): Promise<ServiceResponse<{}>> {
	try {
		// 1. Cek dulu apakah punya anak (Sub-categories)
		const category = await prisma.masterKnowledgeCategory.findUnique({
			where: { id },
			include: {
				_count: {
					select: { subCategories: true },
				},
			},
		})

		if (!category) {
			return HandleServiceResponseCustomError("Category not found", 404)
		}

		// 2. Guard Logic
		if (category._count.subCategories > 0) {
			return HandleServiceResponseCustomError(
				"Cannot delete category because it has sub-categories attached.",
				400,
			)
		}

		// 3. Delete aman
		await prisma.masterKnowledgeCategory.delete({ where: { id } })

		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`MasterKnowledgeCategoryService.deleteById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

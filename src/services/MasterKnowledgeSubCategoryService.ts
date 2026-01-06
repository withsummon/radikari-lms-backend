import { MasterKnowledgeSubCategory } from "../../generated/prisma/client"
import { MasterKnowledgeSubCategoryDTO } from "$entities/MasterKnowledgeSubCategory"
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
	tenantId: string,
	data: MasterKnowledgeSubCategoryDTO,
): Promise<ServiceResponse<MasterKnowledgeSubCategory | {}>> {
	try {
		const parentCategory = await prisma.masterKnowledgeCategory.findFirst({
			where: {
				id: data.categoryId,
				tenantId: tenantId, // Security Check
			},
		})

		if (!parentCategory) {
			return HandleServiceResponseCustomError(
				"Invalid Parent Category or Tenant Mismatch",
				400,
			)
		}

		const createdData = await prisma.masterKnowledgeSubCategory.create({
			data: {
				name: data.name,
				categoryId: data.categoryId,
				tenantId: tenantId, // Inject Tenant ID
			},
		})
		return HandleServiceResponseSuccess(createdData)
	} catch (err) {
		Logger.error(`MasterKnowledgeSubCategoryService.create : `, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getAll(
	tenantId: string,
	filters: EzFilter.FilteringQuery,
): Promise<
	ServiceResponse<EzFilter.PaginatedResult<MasterKnowledgeSubCategory[]> | {}>
> {
	try {
		const queryOptions = EzFilter.buildFilterQuery(filters)

		const whereClause = {
			...queryOptions.where,
			tenantId: tenantId, // Wajib filter per tenant
		}

		const [data, total] = await Promise.all([
			prisma.masterKnowledgeSubCategory.findMany({
				where: whereClause,
				orderBy: queryOptions.orderBy,
				take: queryOptions.take,
				skip: queryOptions.skip,
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
		if (total > queryOptions.take)
			totalPage = Math.ceil(total / queryOptions.take)

		return HandleServiceResponseSuccess({
			entries: data,
			totalData: total,
			totalPage,
		})
	} catch (err) {
		Logger.error(`MasterKnowledgeSubCategoryService.getAll`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getById(
	id: string,
): Promise<ServiceResponse<MasterKnowledgeSubCategory | {}>> {
	try {
		const masterKnowledgeSubCategory =
			await prisma.masterKnowledgeSubCategory.findUnique({
				where: { id },
				include: {
					category: true,
					_count: { select: { cases: true } },
				},
			})

		if (!masterKnowledgeSubCategory)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		return HandleServiceResponseSuccess(masterKnowledgeSubCategory)
	} catch (err) {
		Logger.error(`MasterKnowledgeSubCategoryService.getById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export type UpdateResponse = MasterKnowledgeSubCategory | {}
export async function update(
	id: string,
	data: MasterKnowledgeSubCategoryDTO,
): Promise<ServiceResponse<UpdateResponse>> {
	try {
		const existing = await prisma.masterKnowledgeSubCategory.findUnique({
			where: { id },
		})

		if (!existing)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		const updated = await prisma.masterKnowledgeSubCategory.update({
			where: { id },
			data: {
				name: data.name,
				categoryId: data.categoryId,
			},
		})

		return HandleServiceResponseSuccess(updated)
	} catch (err) {
		Logger.error(`MasterKnowledgeSubCategoryService.update`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function deleteById(id: string): Promise<ServiceResponse<{}>> {
	try {
		// 1. Cek Child (Cases)
		const subCategory = await prisma.masterKnowledgeSubCategory.findUnique({
			where: { id },
			include: {
				_count: { select: { cases: true } },
			},
		})

		if (!subCategory) {
			return HandleServiceResponseCustomError("Sub-Category not found", 404)
		}

		// 2. Guard
		if (subCategory._count.cases > 0) {
			return HandleServiceResponseCustomError(
				"Cannot delete sub-category because it has cases attached.",
				400,
			)
		}

		// 3. Delete
		await prisma.masterKnowledgeSubCategory.delete({ where: { id } })

		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`MasterKnowledgeSubCategoryService.deleteById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

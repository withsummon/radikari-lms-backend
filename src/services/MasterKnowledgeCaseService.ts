import { MasterKnowledgeCase } from "../../generated/prisma/client"
import { MasterKnowledgeCaseDTO } from "$entities/MasterKnowledgeCase"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as MasterKnowledgeCaseRepository from "$repositories/MasterKnowledgeCaseRepository"
import { prisma } from "$pkg/prisma"
import {
	HandleServiceResponseCustomError,
	HandleServiceResponseSuccess,
	ResponseStatus,
	ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"

// Interface agar return type rapi

export async function create(
	tenantId: string,
	data: MasterKnowledgeCaseDTO,
): Promise<ServiceResponse<MasterKnowledgeCase | {}>> {
	try {
		// 1. Validasi Parent (SubCategory) harus milik Tenant yg sama
		const parentSub = await prisma.masterKnowledgeSubCategory.findFirst({
			where: {
				id: data.subCategoryId,
				tenantId: tenantId,
			},
		})

		if (!parentSub) {
			return HandleServiceResponseCustomError(
				"Invalid Sub-Category Parent or Tenant Mismatch",
				400,
			)
		}

		// 2. Create Case dengan Tenant ID
		// 2. Create Case dengan Tenant ID
		const createdData = await MasterKnowledgeCaseRepository.create({
			...data,
			tenantId,
		})
		return HandleServiceResponseSuccess(createdData)
	} catch (err) {
		Logger.error(`MasterKnowledgeCaseService.create : `, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getAll(
	tenantId: string,
	filters: EzFilter.FilteringQuery,
): Promise<
	ServiceResponse<EzFilter.PaginatedResult<MasterKnowledgeCase[]> | {}>
> {
	try {
		const queryOptions = EzFilter.buildFilterQuery(filters)

		const whereClause = {
			...queryOptions.where,
			tenantId: tenantId,
		}

		const [data, total] = await Promise.all([
			prisma.masterKnowledgeCase.findMany({
				where: whereClause,
				orderBy: queryOptions.orderBy,
				take: queryOptions.take,
				skip: queryOptions.skip,
				include: {
					subCategory: {
						include: {
							category: true, // Include Grandparent
						},
					},
				},
			}),
			prisma.masterKnowledgeCase.count({
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
		Logger.error(`MasterKnowledgeCaseService.getAll`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}
export async function getById(
	id: string,
): Promise<ServiceResponse<MasterKnowledgeCase | {}>> {
	try {
		const masterKnowledgeCase = await prisma.masterKnowledgeCase.findUnique({
			where: { id },
			include: {
				subCategory: true,
			},
		})

		if (!masterKnowledgeCase)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		return HandleServiceResponseSuccess(masterKnowledgeCase)
	} catch (err) {
		Logger.error(`MasterKnowledgeCaseService.getById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export type UpdateResponse = MasterKnowledgeCase | {}
export async function update(
	id: string,
	data: MasterKnowledgeCaseDTO,
): Promise<ServiceResponse<UpdateResponse>> {
	try {
		const existing = await prisma.masterKnowledgeCase.findUnique({
			where: { id },
		})

		if (!existing)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		const updated = await prisma.masterKnowledgeCase.update({
			where: { id },
			data: { name: data.name },
		})

		return HandleServiceResponseSuccess(updated)
	} catch (err) {
		Logger.error(`MasterKnowledgeCaseService.update`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function deleteById(id: string): Promise<ServiceResponse<{}>> {
	try {
		const existing = await prisma.masterKnowledgeCase.findUnique({
			where: { id },
		})
		if (!existing)
			return HandleServiceResponseCustomError("Case not found", 404)

		await prisma.masterKnowledgeCase.delete({
			where: { id },
		})
		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`MasterKnowledgeCaseService.deleteById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

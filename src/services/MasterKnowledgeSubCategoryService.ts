import { MasterKnowledgeSubCategory } from "../../generated/prisma/client"
import { MasterKnowledgeSubCategoryDTO } from "$entities/MasterKnowledgeSubCategory"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as MasterKnowledgeSubCategoryRepository from "$repositories/MasterKnowledgeSubCategoryRepository"
import {
	HandleServiceResponseCustomError,
	HandleServiceResponseSuccess,
	ResponseStatus,
	ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"

export async function create(
	data: MasterKnowledgeSubCategoryDTO,
): Promise<ServiceResponse<MasterKnowledgeSubCategory | {}>> {
	try {
		const createdData = await MasterKnowledgeSubCategoryRepository.create(data)
		return HandleServiceResponseSuccess(createdData)
	} catch (err) {
		Logger.error(`MasterKnowledgeSubCategoryService.create : `, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getAll(
	filters: EzFilter.FilteringQuery,
): Promise<
	ServiceResponse<EzFilter.PaginatedResult<MasterKnowledgeSubCategory[]> | {}>
> {
	try {
		const data = await MasterKnowledgeSubCategoryRepository.getAll(filters)
		return HandleServiceResponseSuccess(data)
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
		let masterKnowledgeSubCategory =
			await MasterKnowledgeSubCategoryRepository.getById(id)

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
		let masterKnowledgeSubCategory =
			await MasterKnowledgeSubCategoryRepository.getById(id)

		if (!masterKnowledgeSubCategory)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		masterKnowledgeSubCategory =
			await MasterKnowledgeSubCategoryRepository.update(id, data)

		return HandleServiceResponseSuccess(masterKnowledgeSubCategory)
	} catch (err) {
		Logger.error(`MasterKnowledgeSubCategoryService.update`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function deleteById(id: string): Promise<ServiceResponse<{}>> {
	try {
		await MasterKnowledgeSubCategoryRepository.deleteById(id)
		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`MasterKnowledgeSubCategoryService.deleteById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

import { MasterKnowledgeCase } from "../../generated/prisma/client"
import { MasterKnowledgeCaseDTO } from "$entities/MasterKnowledgeCase"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as MasterKnowledgeCaseRepository from "$repositories/MasterKnowledgeCaseRepository"
import {
	HandleServiceResponseCustomError,
	HandleServiceResponseSuccess,
	ResponseStatus,
	ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"

export async function create(
	data: MasterKnowledgeCaseDTO,
): Promise<ServiceResponse<MasterKnowledgeCase | {}>> {
	try {
		const createdData = await MasterKnowledgeCaseRepository.create(data)
		return HandleServiceResponseSuccess(createdData)
	} catch (err) {
		Logger.error(`MasterKnowledgeCaseService.create : `, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getAll(
	filters: EzFilter.FilteringQuery,
): Promise<
	ServiceResponse<EzFilter.PaginatedResult<MasterKnowledgeCase[]> | {}>
> {
	try {
		const data = await MasterKnowledgeCaseRepository.getAll(filters)
		return HandleServiceResponseSuccess(data)
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
		let masterKnowledgeCase = await MasterKnowledgeCaseRepository.getById(id)

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
		let masterKnowledgeCase = await MasterKnowledgeCaseRepository.getById(id)

		if (!masterKnowledgeCase)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		masterKnowledgeCase = await MasterKnowledgeCaseRepository.update(id, data)

		return HandleServiceResponseSuccess(masterKnowledgeCase)
	} catch (err) {
		Logger.error(`MasterKnowledgeCaseService.update`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function deleteById(id: string): Promise<ServiceResponse<{}>> {
	try {
		await MasterKnowledgeCaseRepository.deleteById(id)
		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`MasterKnowledgeCaseService.deleteById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

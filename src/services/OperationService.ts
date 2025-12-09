import { Operation } from "../../generated/prisma/client"
import { OperationDTO } from "$entities/Operation"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as OperationRepository from "$repositories/OperationRepository"
import {
	HandleServiceResponseCustomError,
	HandleServiceResponseSuccess,
	ResponseStatus,
	ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"
import * as UserActivityLogService from "$services/UserActivityLogService"

export async function create(
	data: OperationDTO,
	userId: string,
): Promise<ServiceResponse<Operation | {}>> {
	try {
		const createdData = await OperationRepository.create(data)
		await UserActivityLogService.create(
			userId,
			"Menambahkan operasi",
			"default",
			`dengan nama "${data.name}"`,
		)
		return HandleServiceResponseSuccess(createdData)
	} catch (err) {
		Logger.error(`OperationService.create : `, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getAll(
	filters: EzFilter.FilteringQuery,
): Promise<ServiceResponse<EzFilter.PaginatedResult<Operation[]> | {}>> {
	try {
		const data = await OperationRepository.getAll(filters)
		return HandleServiceResponseSuccess(data)
	} catch (err) {
		Logger.error(`OperationService.getAll`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getById(
	id: string,
): Promise<ServiceResponse<Operation | {}>> {
	try {
		let operation = await OperationRepository.getById(id)

		if (!operation)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		return HandleServiceResponseSuccess(operation)
	} catch (err) {
		Logger.error(`OperationService.getById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export type UpdateResponse = Operation | {}
export async function update(
	id: string,
	data: OperationDTO,
	userId: string,
): Promise<ServiceResponse<UpdateResponse>> {
	try {
		let operation = await OperationRepository.getById(id)

		if (!operation)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		const operationUpdated = await OperationRepository.update(id, data)

		await UserActivityLogService.create(
			userId,
			"Mengedit operasi",
			"default",
			`dengan nama "${operationUpdated.name}"`,
		)

		return HandleServiceResponseSuccess(operationUpdated)
	} catch (err) {
		Logger.error(`OperationService.update`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function deleteById(
	id: string,
	userId: string,
): Promise<ServiceResponse<{}>> {
	try {
		const operation = await OperationRepository.getById(id)
		if (!operation)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		await OperationRepository.deleteById(id)

		await UserActivityLogService.create(
			userId,
			"Menghapus operasi",
			"default",
			`dengan nama "${operation.name}"`,
		)
		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`OperationService.deleteById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

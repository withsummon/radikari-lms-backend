import { Announcement } from "../../generated/prisma/client"
import { AnnouncementCreateDTO } from "$entities/Announcement"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as AnnouncementRepository from "$repositories/AnnouncementRepository"
import {
	HandleServiceResponseCustomError,
	HandleServiceResponseSuccess,
	ResponseStatus,
	ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"
import * as UserActivityLogService from "$services/UserActivityLogService"

export async function create(
	data: AnnouncementCreateDTO,
	userId: string,
	tenantId: string,
): Promise<ServiceResponse<Announcement | {}>> {
	try {
		data.createdByUserId = userId
		data.tenantId = tenantId

		const createdData = await AnnouncementRepository.create(data)
		await UserActivityLogService.create(
			userId,
			"Menambahkan pengumuman",
			tenantId,
			`dengan judul "${data.title}"`,
		)
		return HandleServiceResponseSuccess(createdData)
	} catch (err) {
		Logger.error(`AnnouncementService.create : `, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getAll(
	filters: EzFilter.FilteringQuery,
	userId: string,
	tenantId: string,
): Promise<ServiceResponse<EzFilter.PaginatedResult<Announcement[]> | {}>> {
	try {
		const data = await AnnouncementRepository.getAll(filters, userId, tenantId)
		return HandleServiceResponseSuccess(data)
	} catch (err) {
		Logger.error(`AnnouncementService.getAll`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getById(
	id: string,
): Promise<ServiceResponse<Announcement | {}>> {
	try {
		let announcement = await AnnouncementRepository.getById(id)

		if (!announcement)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		return HandleServiceResponseSuccess(announcement)
	} catch (err) {
		Logger.error(`AnnouncementService.getById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export type UpdateResponse = Announcement | {}
export async function update(
	id: string,
	data: AnnouncementCreateDTO,
	userId: string,
	tenantId: string,
): Promise<ServiceResponse<UpdateResponse>> {
	try {
		let announcement = await AnnouncementRepository.getById(id)

		if (!announcement)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		const updatedAnnouncement = await AnnouncementRepository.update(id, data)
		await UserActivityLogService.create(
			userId,
			"Mengedit pengumuman",
			tenantId,
			`dengan judul "${updatedAnnouncement.title}"`,
		)

		return HandleServiceResponseSuccess(updatedAnnouncement)
	} catch (err) {
		Logger.error(`AnnouncementService.update`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function deleteById(
	id: string,
	userId: string,
	tenantId: string,
): Promise<ServiceResponse<{}>> {
	try {
		const deletedAnnouncement = await AnnouncementRepository.getById(id)

		if (!deletedAnnouncement)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		await AnnouncementRepository.deleteById(id)

		await UserActivityLogService.create(
			userId,
			"Menghapus pengumuman",
			tenantId,
			`dengan judul "${deletedAnnouncement.title}"`,
		)
		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`AnnouncementService.deleteById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

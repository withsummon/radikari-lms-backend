import { Tenant } from "../../generated/prisma/client"
import { TenantCreateUpdateDTO } from "$entities/Tenant"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as TenantRepository from "$repositories/TenantRepository"
import {
	HandleServiceResponseCustomError,
	HandleServiceResponseSuccess,
	ResponseStatus,
	ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"
import * as UserActivityLogService from "$services/UserActivityLogService"
import { UserJWTDAO } from "$entities/User"

export async function create(
	data: TenantCreateUpdateDTO,
	userId: string,
): Promise<ServiceResponse<Tenant | {}>> {
	try {
		// Check or Assign Mock Operation
		if (!data.operationId) {
			const MOCK_OP_NAME = "Mock Operation";
			const OperationRepository = await import("$repositories/OperationRepository");
			
			let mockOp = await OperationRepository.findByName(MOCK_OP_NAME);
			
			if (!mockOp) {
				// Create Mock Operation if not exists
				// We need a dummy user ID for headOfOperationUserId or use the current userId
				mockOp = await OperationRepository.create({
					name: MOCK_OP_NAME,
					description: "Default Mock Operation for simplified tenants",
					headOfOperationUserId: userId, // assigning current user as head for now
				} as any); // Type assertion if DTO doesn't match exactly, or verify OperationDTO
			}
			
			data.operationId = mockOp.id;
		}

		const createdData = await TenantRepository.create(data as any)

		await UserActivityLogService.create(
			userId,
			"Menambahkan tenant",
			"default",
			`dengan nama "${createdData.name}"`,
		)

		return HandleServiceResponseSuccess(createdData)
	} catch (err) {
		Logger.error(`TenantService.create : `, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getAll(
	filters: EzFilter.FilteringQuery,
): Promise<ServiceResponse<EzFilter.PaginatedResult<Tenant[]> | {}>> {
	try {
		const data = await TenantRepository.getAll(filters)
		return HandleServiceResponseSuccess(data)
	} catch (err) {
		Logger.error(`TenantService.getAll`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getById(
	id: string,
): Promise<ServiceResponse<Tenant | {}>> {
	try {
		let tenant = await TenantRepository.getById(id)

		if (!tenant)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		return HandleServiceResponseSuccess(tenant)
	} catch (err) {
		Logger.error(`TenantService.getById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export type UpdateResponse = Tenant | {}
export async function update(
	id: string,
	data: TenantCreateUpdateDTO,
	userId: string,
): Promise<ServiceResponse<UpdateResponse>> {
	try {
		const tenant = await TenantRepository.getById(id)

		if (!tenant)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		const updatedTenant = await TenantRepository.update(id, data)

		await UserActivityLogService.create(
			userId,
			"Mengedit tenant",
			"default",
			`dengan nama "${updatedTenant.name}"`,
		)

		return HandleServiceResponseSuccess(updatedTenant)
	} catch (err) {
		Logger.error(`TenantService.update`, {
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
		const tenant = await TenantRepository.getById(id)
		if (!tenant)
			return HandleServiceResponseCustomError(
				"Invalid ID",
				ResponseStatus.NOT_FOUND,
			)

		await TenantRepository.deleteById(id)

		await UserActivityLogService.create(
			userId,
			"Menghapus tenant",
			"default",
			`dengan nama "${tenant.name}"`,
		)

		return HandleServiceResponseSuccess({})
	} catch (err) {
		Logger.error(`TenantService.deleteById`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getAllByUserId(
	filters: EzFilter.FilteringQuery,
	user: UserJWTDAO,
): Promise<ServiceResponse<EzFilter.PaginatedResult<Tenant[]> | {}>> {
	try {
		const tenants = await TenantRepository.getAllByUserId(filters, user)
		return HandleServiceResponseSuccess(tenants)
	} catch (err) {
		Logger.error(`TenantService.getAllByUserId`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

// --- FUNGSI ADD MEMBER ---
export async function addMember(
	tenantId: string,
	userId: string,
	tenantRoleId: string,
): Promise<ServiceResponse<{}>> {
	try {
		// 1. Validasi Tenant
		const tenant = await TenantRepository.getById(tenantId)
		if (!tenant) {
			return HandleServiceResponseCustomError(
				"Tenant tidak ditemukan",
				ResponseStatus.NOT_FOUND,
			)
		}

		// 2. Simpan ke Database via Repository
		await TenantRepository.addTenantUser(tenantId, userId, tenantRoleId)

		return HandleServiceResponseSuccess({})
	} catch (err: any) {
		// Handle Unique Constraint Error (P2002 dari Prisma)
		// Artinya kombinasi tenantId dan userId sudah ada
		if (err.code === "P2002") {
			return HandleServiceResponseCustomError(
				"User sudah menjadi member di tenant ini",
				ResponseStatus.BAD_REQUEST,
			)
		}



		Logger.error(`TenantService.addMember`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getUserPoints(
	tenantId: string,
	userId: string,
): Promise<ServiceResponse<{ totalPoints: number } | {}>> {
	try {
        const AssignmentAttemptRepository = await import("$repositories/Assignment/AssignmentAttemptRepository");
		const points = await AssignmentAttemptRepository.getUserTotalPointAssignment(
			userId,
			tenantId,
		)

        // Points is returned as [{sum: number}] or similar from raw query
        // Need to check the return type of prisma.$queryRaw
        const totalPoints = points && (points as any)[0]?.sum ? Number((points as any)[0].sum) : 0;

		return HandleServiceResponseSuccess({ totalPoints })
	} catch (err) {
		Logger.error(`TenantService.getUserPoints`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function upsertSetting(
	tenantId: string,
	key: string,
	value: string,
	userId: string,
): Promise<ServiceResponse<{}>> {
	try {
		const setting = await TenantRepository.upsertSetting(tenantId, key, value)

		await UserActivityLogService.create(
			userId,
			"Update Tenant Setting",
			"default",
			`Key: ${key}`,
		)

		return HandleServiceResponseSuccess(setting)
	} catch (err) {
		Logger.error(`TenantService.upsertSetting`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

export async function getSettings(
	tenantId: string,
): Promise<ServiceResponse<any[] | {}>> {
	try {
		const settings = await TenantRepository.getAllSettings(tenantId)
		return HandleServiceResponseSuccess(settings)
	} catch (err) {
		Logger.error(`TenantService.getSettings`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

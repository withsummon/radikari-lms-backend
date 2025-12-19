import { AiPrompt } from "../../generated/prisma/client"
import { AiPromptDTO } from "$entities/AiPrompt"
import * as AiPromptRepository from "$repositories/AiPromptRepository"
import {
	HandleServiceResponseCustomError,
	HandleServiceResponseSuccess,
	ResponseStatus,
	ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"
import * as TenantRepository from "$repositories/TenantRepository"

export async function getByTenantId(
  tenantId: string,
): Promise<ServiceResponse<AiPrompt | { prompt: string }>> {
  try {
    const aiPrompt = await AiPromptRepository.getByTenantId(tenantId);

    if (!aiPrompt) {
      return HandleServiceResponseSuccess({ prompt: "" }) as any;
    }

    return HandleServiceResponseSuccess(aiPrompt) as any;
  } catch (err) {
    Logger.error(`AiPromptService.getByTenantId`, { error: err });
    return HandleServiceResponseCustomError("Internal Server Error", 500) as any;
  }
}


export type UpdateResponse = AiPrompt | {}
export async function upsertByTenantId(
	tenantId: string,
	data: AiPromptDTO,
	userId: string,
): Promise<ServiceResponse<UpdateResponse>> {
	try {
		const tenant = await TenantRepository.getById(tenantId)
		if (!tenant)
			return HandleServiceResponseCustomError(
				"Invalid Tenant ID",
				ResponseStatus.NOT_FOUND,
			)

		data.createdByUserId = userId
		data.updatedByUserId = userId
		data.tenantId = tenantId
		const aiPrompt = await AiPromptRepository.upsertByTenantId(tenantId, data)

		return HandleServiceResponseSuccess(aiPrompt)
	} catch (err) {
		Logger.error(`AiPromptService.upsertByTenantId`, {
			error: err,
		})
		return HandleServiceResponseCustomError("Internal Server Error", 500)
	}
}

import { UserKnowledgeReadLog } from "../../generated/prisma/client"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as UserKnowledgeReadLogRepository from "$repositories/UserKnowledgeReadLogRepository"
import {
  HandleServiceResponseCustomError,
  HandleServiceResponseSuccess,
  ResponseStatus,
  ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"

export async function getAll(
  filters: EzFilter.FilteringQuery,
): Promise<
  ServiceResponse<EzFilter.PaginatedResult<UserKnowledgeReadLog[]> | {}>
> {
  try {
    const data = await UserKnowledgeReadLogRepository.getAll(filters)
    return HandleServiceResponseSuccess(data)
  } catch (err) {
    Logger.error(`UserKnowledgeReadLogService.getAll`, { error: err })
    return HandleServiceResponseCustomError("Internal Server Error", 500)
  }
}

export async function getByUserAndKnowledge(
  userId: string,
  knowledgeId: string,
): Promise<ServiceResponse<UserKnowledgeReadLog | {}>> {
  try {
    const data =
      await UserKnowledgeReadLogRepository.getByUserAndKnowledge(
        userId,
        knowledgeId,
      )

    if (!data)
      return HandleServiceResponseCustomError(
        "Data not found",
        ResponseStatus.NOT_FOUND,
      )

    return HandleServiceResponseSuccess(data)
  } catch (err) {
    Logger.error(`UserKnowledgeReadLogService.getByUserAndKnowledge`, {
      error: err,
    })
    return HandleServiceResponseCustomError("Internal Server Error", 500)
  }
}

export async function markViewed(
  userId: string,
  knowledgeId: string,
): Promise<ServiceResponse<UserKnowledgeReadLog | {}>> {
  try {
    const data = await UserKnowledgeReadLogRepository.upsertView(
      userId,
      knowledgeId,
    )

    return HandleServiceResponseSuccess(data)
  } catch (err) {
    Logger.error(`UserKnowledgeReadLogService.markViewed`, { error: err })
    return HandleServiceResponseCustomError("Internal Server Error", 500)
  }
}

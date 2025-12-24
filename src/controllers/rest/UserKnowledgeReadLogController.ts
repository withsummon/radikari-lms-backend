import { Context } from "hono"
import * as UserKnowledgeReadLogService from "$services/UserKnowledgeReadLogService"
import { response_success, handleServiceErrorWithResponse } from "$utils/response.utils"

export async function getAll(c: Context) {
  const filters = c.req.query()
  const result = await UserKnowledgeReadLogService.getAll(filters as any)

  if (!result.status) return handleServiceErrorWithResponse(c, result)
  return response_success(c, result.data, "Successfully fetched knowledge read logs")
}

export async function getStatus(c: Context) {
  const user = c.get("jwtPayload")
  const knowledgeId = c.req.param("knowledgeId")

  const result = await UserKnowledgeReadLogService.getByUserAndKnowledge(
    user.id,
    knowledgeId,
  )

  if (!result.status) return handleServiceErrorWithResponse(c, result)
  return response_success(c, result.data, "Successfully fetched read status")
}

export async function markViewed(c: Context) {
  const user = c.get("jwtPayload")
  const { knowledgeId } = await c.req.json()

  const result = await UserKnowledgeReadLogService.markViewed(
    user.id,
    knowledgeId,
  )

  if (!result.status) return handleServiceErrorWithResponse(c, result)
  return response_success(c, result.data, "Knowledge marked as viewed")
}

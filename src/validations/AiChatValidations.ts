import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import { AiChatRoomDTO } from "$entities/AiChatRoom"
import {
	AiChatRoomMessageSchema,
	AiChatRoomSchema,
} from "./schema/AiChatRoomSchema"
import * as Helpers from "./helper"
import { AiChatRoomMessageDTO } from "$entities/AiChatRoomMessage"

export async function validateAiChatRoomSchema(c: Context, next: Next) {
	const data: AiChatRoomDTO = await c.req.json()
	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		AiChatRoomSchema,
		data,
	)

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	await next()
}

export async function validateAiChatRoomMessageSchema(c: Context, next: Next) {
	const data: AiChatRoomMessageDTO = await c.req.json()
	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		AiChatRoomMessageSchema,
		data,
	)

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	await next()
}

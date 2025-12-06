import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import { ForumCommentDTO, ForumDTO } from "$entities/Forum"
import { ForumCommentSchema, ForumSchema } from "./schema/ForumSchema"
import * as Helpers from "./helper"
import { prisma } from "$pkg/prisma"

export async function validateForumSchema(c: Context, next: Next) {
	const data: ForumDTO = await c.req.json()
	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		ForumSchema,
		data,
	)

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	await next()
}

export async function validateForumCommentSchema(c: Context, next: Next) {
	const data: ForumCommentDTO = await c.req.json()
	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		ForumCommentSchema,
		data,
	)

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	if (data.replyToCommentId) {
		const replyToComment = await prisma.forumComment.findUnique({
			where: {
				id: data.replyToCommentId,
			},
		})

		if (!replyToComment) {
			invalidFields.push({
				field: "replyToCommentId",
				message: "Reply to comment not found",
			})
		} else {
			if (replyToComment.replyToCommentId) {
				invalidFields.push({
					field: "replyToCommentId",
					message:
						"Reply to comment is not allowed to reply to another comment",
				})
			}
		}
	}

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	await next()
}

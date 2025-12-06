import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import { AnnouncementCreateDTO } from "$entities/Announcement"
import { AnnouncementSchema } from "./schema/AnnouncementSchema"
import * as Helpers from "./helper"
import { prisma } from "$pkg/prisma"

export async function validateAnnouncementSchema(c: Context, next: Next) {
	const data: AnnouncementCreateDTO = await c.req.json()
	let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
		AnnouncementSchema,
		data,
	)

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	for (const tenantRoleId of data.tenantRoleIds) {
		const tenantRole = await prisma.tenantRole.findUnique({
			where: {
				id: tenantRoleId,
			},
		})
		if (!tenantRole) {
			invalidFields.push(
				Helpers.generateErrorStructure(
					"tenantRoleIds",
					"tenant role not found",
				),
			)
			break
		}
	}

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Validation Error", invalidFields)
	}

	await next()
}

import { Context, Next } from "hono";
import { prisma } from "$pkg/prisma";
import { response_bad_request } from "$utils/response.utils";
import * as Helpers from "./helper";
import { ErrorStructure } from "./helper";
import {
	UserValidationCreateSchema,
	UserValidationUpdateSchema,
} from "./schema/UserSchema";

// DTO untuk create user + assign role tenant
type CreateUserInTenantDTO = {
	fullName: string;
	email: string;
	phoneNumber: string;
	password?: string;
	tenantRoleId: string;
};

export async function validateCreateInTenantDTO(c: Context, next: Next) {
	const data: CreateUserInTenantDTO = await c.req.json();

	// reuse schema create user, lalu manual cek tenantRoleId
	const invalidFields: ErrorStructure[] = Helpers.validateSchema(
		UserValidationCreateSchema,
		data as any,
	);

	if (!data.tenantRoleId || String(data.tenantRoleId).trim().length === 0) {
		invalidFields.push({ field: "tenantRoleId", message: "tenantRoleId is required" });
	}

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Bad Request", invalidFields);
	}

	// email uniqueness
	const userExist = await prisma.user.findUnique({
		where: { email: data.email },
	});
	if (userExist != null) {
		invalidFields.push({ field: "email", message: "email already used" });
	}

	// tenantRoleId valid
	const roleExist = await prisma.tenantRole.findUnique({
		where: { id: data.tenantRoleId },
	});
	if (!roleExist) {
		invalidFields.push({ field: "tenantRoleId", message: "tenant role not found" });
	}

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Bad Request", invalidFields);
	}

	await next();
}

export async function validateUpdateUserDTO(c: Context, next: Next) {
	const data = await c.req.json();
	const invalidFields: ErrorStructure[] = Helpers.validateSchema(
		UserValidationUpdateSchema,
		data,
	);

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Bad Request", invalidFields);
	}

	// cek email dipakai user lain
	const id = c.req.param("id");
	if (data?.email) {
		const userExist = await prisma.user.findUnique({
			where: { email: data.email },
		});

		if (userExist != null && userExist.id !== id) {
			invalidFields.push({ field: "email", message: "email already used" });
		}
	}

	if (invalidFields.length > 0) {
		return response_bad_request(c, "Bad Request", invalidFields);
	}

	await next();
}

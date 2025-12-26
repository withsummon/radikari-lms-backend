import { Context, TypedResponse } from "hono"
import * as AccessControlListService from "$services/AccessListControlListService"
import {
	handleServiceErrorWithResponse,
	response_bad_request,
	response_created,
	response_forbidden,
	response_success,
} from "$utils/response.utils"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import { UserJWTDAO } from "$entities/User"
import { AccessControlListDTO } from "$entities/AccessControlList"
import { TenantRoleDTO } from "$entities/TenantRole"
import { Roles } from "../../../generated/prisma/client"
import { prisma } from "$pkg/prisma"

export async function createRole(c: Context): Promise<TypedResponse> {
	const data: TenantRoleDTO = await c.req.json()
	const user: UserJWTDAO = c.get("jwtPayload")

	// Security Check: Non-admins (Checkers) can only create roles for their own tenant
	// and must have the ACCESS_CONTROL_LIST.CREATE permission
	if (user.role !== Roles.ADMIN) {
		const tenantUser = await prisma.tenantUser.findFirst({
			where: {
				userId: user.id,
				tenantId: data.tenantId,
			},
			include: {
				tenantRole: true,
			},
		})

		if (!tenantUser) {
			return response_forbidden(
				c,
				"You are not authorized to create roles for this tenant!",
			)
		}

		// Check for specific permission in the ACL
		const hasPermission = await prisma.accessControlList.findFirst({
			where: {
				tenantRoleId: tenantUser.tenantRoleId,
				featureName: "ACCESS_CONTROL_LIST",
				actionName: "CREATE",
			},
		})

		if (!hasPermission) {
			return response_forbidden(
				c,
				"You do not have permission to create roles in this tenant!",
			)
		}
	}

	const serviceResponse = await AccessControlListService.createRole(data)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_created(
		c,
		serviceResponse.data,
		"Successfully created new Tenant Role!",
	)
}

export async function updateRoleAccess(c: Context): Promise<TypedResponse> {
	const data: AccessControlListDTO = await c.req.json()
	const tenantRoleId = c.req.param("tenantRoleId")
	const user: UserJWTDAO = c.get("jwtPayload")

	// Security Check: Non-admins must have permission to update access
	if (user.role !== Roles.ADMIN) {
		// First find the tenant of the role being updated
		const targetRole = await prisma.tenantRole.findUnique({
			where: { id: tenantRoleId },
		})

		if (!targetRole) {
			return response_bad_request(c, "Target role not found!")
		}

		// Check if the user is a member of that tenant
		const tenantUser = await prisma.tenantUser.findFirst({
			where: {
				userId: user.id,
				tenantId: targetRole.tenantId,
			},
		})

		if (!tenantUser) {
			return response_forbidden(
				c,
				"You are not authorized to update roles for this tenant!",
			)
		}

		// Check for specific permission in the ACL
		const hasPermission = await prisma.accessControlList.findFirst({
			where: {
				tenantRoleId: tenantUser.tenantRoleId,
				featureName: "ACCESS_CONTROL_LIST",
				actionName: "UPDATE",
			},
		})

		if (!hasPermission) {
			return response_forbidden(
				c,
				"You do not have permission to update role access in this tenant!",
			)
		}
	}

	const serviceResponse = await AccessControlListService.updateRoleAccess(
		tenantRoleId,
		data,
		user.id,
	)

	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully updated Tenant Role Access!",
	)
}

export async function getEnabledFeaturesByTenantRoleId(
	c: Context,
): Promise<TypedResponse> {
	const id = c.req.param("tenantRoleId")

	const serviceResponse =
		await AccessControlListService.getEnabledFeaturesByRoleId(id)
	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(c, serviceResponse)
	}

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetch enabled features by role id",
	)
}

export async function getAllFeatures(c: Context): Promise<TypedResponse> {
	const serviceResponse = await AccessControlListService.getAllFeatures()
	if (!serviceResponse.status)
		return handleServiceErrorWithResponse(c, serviceResponse)

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetch all features",
	)
}

export async function getAllRoles(c: Context): Promise<TypedResponse> {
	const user: UserJWTDAO = c.get("jwtPayload")
	const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(
		c.req.query(),
	)

	// Security Check: Non-admins can only see roles for tenants they belong to
	if (user.role !== Roles.ADMIN) {
		const tenantUsers = await prisma.tenantUser.findMany({
			where: { userId: user.id },
			select: { tenantId: true },
		})
		const myTenantIds = tenantUsers.map((tu) => tu.tenantId)

		const f = filters as any
		if (!f.where) f.where = {}

		// If they provided a tenantId filter, ensure they belong to it
		if (f.where.tenantId) {
			if (typeof f.where.tenantId === "string") {
				if (!myTenantIds.includes(f.where.tenantId)) {
					return response_forbidden(
						c,
						"You are not authorized to view roles for this tenant!",
					)
				}
			} else if (
				Array.isArray(f.where.tenantId) ||
				typeof f.where.tenantId === "object"
			) {
				// Handle complex filters if necessary, but keep it simple for now
				// Force myTenantIds if it's too complex or missing
				f.where.tenantId = { in: myTenantIds }
			}
		} else {
			// Force filter to only their tenants
			f.where.tenantId = { in: myTenantIds }
		}
	}

	const serviceResponse = await AccessControlListService.getAllRoles(filters)

	if (!serviceResponse.status)
		return handleServiceErrorWithResponse(c, serviceResponse)

	return response_success(
		c,
		serviceResponse.data,
		"Successfully fetched Tenant Role(s)",
	)
}

export async function checkAccess(c: Context): Promise<TypedResponse> {
	const user: UserJWTDAO = c.get("jwtPayload")
	const feature = c.req.query("feature")

	if (!feature) {
		return response_bad_request(c, "feature is required")
	}

	const serviceResponse = await AccessControlListService.checkAccess(
		user,
		feature as string,
	)
	if (!serviceResponse.status)
		return handleServiceErrorWithResponse(c, serviceResponse)

	return response_success(
		c,
		serviceResponse.data,
		"Successfully checked access to feature",
	)
}

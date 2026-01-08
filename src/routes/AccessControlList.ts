import { Hono } from "hono"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as AccessControlListController from "$controllers/rest/AccessControlListController"
import * as AccessControlListValidation from "$validations/AccessControlListValidation"

const AccessControlListRoutes = new Hono()

AccessControlListRoutes.post(
	"/tenant-roles",
	AuthMiddleware.checkJwt,
	AccessControlListValidation.validateAccessControlListCreateRoleSchema,
	AccessControlListController.createRole,
)

AccessControlListRoutes.put(
	"/tenant-roles/:tenantRoleId/access",
	AuthMiddleware.checkJwt,
	AccessControlListValidation.validateAccessControlListUpdateAccessSchema,
	AccessControlListController.updateRoleAccess,
)

AccessControlListRoutes.get(
	"/tenant-roles",
	AuthMiddleware.checkJwt,
	AccessControlListController.getAllRoles,
)

AccessControlListRoutes.get(
	"/features",
	AuthMiddleware.checkJwt,
	AccessControlListController.getAllFeatures,
)

AccessControlListRoutes.get(
	"/tenant-roles/:tenantRoleId/features",
	AuthMiddleware.checkJwt,
	AccessControlListController.getEnabledFeaturesByTenantRoleId,
)

AccessControlListRoutes.get(
	"/check-access",
	AuthMiddleware.checkJwt,
	AccessControlListController.checkAccess,
)

export default AccessControlListRoutes

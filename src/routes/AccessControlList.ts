import { Hono } from "hono"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as AccessControlListController from "$controllers/rest/AccessControlListController"

const AccessControlListRoutes = new Hono()

AccessControlListRoutes.get(
    "/tenant-roles",
    AuthMiddleware.checkJwt,
    AccessControlListController.getAllRoles
)

AccessControlListRoutes.get(
    "/features",
    AuthMiddleware.checkJwt,
    AccessControlListController.getAllFeatures
)

AccessControlListRoutes.get(
    "tenant-roles/:tenantRoleId/features",
    AuthMiddleware.checkJwt,
    AccessControlListController.getEnabledFeaturesByTenantRoleId
)

AccessControlListRoutes.get(
    "/check-access",
    AuthMiddleware.checkJwt,
    AccessControlListController.checkAccess
)

export default AccessControlListRoutes

import { Hono } from "hono"
import * as BroadcastController from "$controllers/rest/BroadcastController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as Validations from "$validations/BroadcastValidation"

const BroadcastRoutes = new Hono()

BroadcastRoutes.get(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	BroadcastController.getByTenantId,
)

BroadcastRoutes.put(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	Validations.validateBroadcastSchema,
	BroadcastController.createOrUpdateByTenantId,
)

export default BroadcastRoutes

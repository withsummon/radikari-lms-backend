import { Hono } from "hono"
import * as AiPromptController from "$controllers/rest/AiPromptController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as Validations from "$validations/AiPromptValidation"

const AiPromptRoutes = new Hono()

AiPromptRoutes.get(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	AiPromptController.getByTenantId,
)

AiPromptRoutes.put(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	Validations.validateAiPromptSchema,
	AiPromptController.createOrUpdateByTenantId,
)

export default AiPromptRoutes

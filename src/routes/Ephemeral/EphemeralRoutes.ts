import { Hono } from "hono"
import * as EphemeralChatController from "$controllers/rest/EphemeralChatController"

const EphemeralRoutes = new Hono()

// No AuthMiddleware.checkJwt - unauthenticated access
// Tenant isolation enforced via path + origin validation in controller
EphemeralRoutes.post(
	"/tenants/:tenantId/threads",
	EphemeralChatController.createThread,
)
EphemeralRoutes.post(
	"/tenants/:tenantId/threads/:threadId/stream",
	EphemeralChatController.sendMessage,
)

export default EphemeralRoutes

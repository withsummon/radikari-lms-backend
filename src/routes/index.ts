import * as AuthController from "$controllers/rest/AuthController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import { response_not_found, response_success } from "$utils/response.utils"
import * as AuthValidation from "$validations/AuthValidations"
import { Context, Hono } from "hono"
import RoutesRegistry from "./registry"

const router = new Hono()

router.post("/login", AuthValidation.validateLoginDTO, AuthController.login)
router.get("/google-login", AuthController.googleLogin)
router.get("/google", AuthController.googleCallback)
router.post("/verify-token", AuthController.verifyToken)
router.put(
	"/update-password",
	AuthMiddleware.checkJwt,
	AuthController.changePassword,
)

router.route("/users", RoutesRegistry.UserRoutes)
router.route("/tenants", RoutesRegistry.TenantRoutes)

router.route(
	"/tenants/:tenantId/master-knowledge-categories",
	RoutesRegistry.MasterKnowledgeCategoryRoutes,
)
router.route(
	"/tenants/:tenantId/master-knowledge-sub-categories",
	RoutesRegistry.MasterKnowledgeSubCategoryRoutes,
)
router.route(
	"/tenants/:tenantId/master-knowledge-cases",
	RoutesRegistry.MasterKnowledgeCaseRoutes,
)

router.route(
	"/tenants/:tenantId/users/manage",
	RoutesRegistry.TenantUserManagementRoutes,
)

router.route("/tenants/:tenantId/knowledges", RoutesRegistry.KnowledgeRoutes)
router.route("/tenants/:tenantId/assignments", RoutesRegistry.AssignmentRoutes)
router.route(
	"/tenants/:tenantId/announcements",
	RoutesRegistry.AnnouncementRoutes,
)
router.route("/tenants/:tenantId/forums", RoutesRegistry.ForumRoutes)
router.route("/tenants/:tenantId/ai-prompts", RoutesRegistry.AiPromptRoutes)
router.route("/tenants/:tenantId/broadcasts", RoutesRegistry.BroadcastRoutes)

router.route("/bulk", RoutesRegistry.BulkKnowledgeRoutes)
router.route("/access-control-lists", RoutesRegistry.AccessControlListRoutes)
router.route("/user-activity-logs", RoutesRegistry.UserActivityLogRoutes)
router.route("/notifications", RoutesRegistry.NotificationRoutes)
router.route("/analytics", RoutesRegistry.AnalyticsRoutes)

router.route("/ai-chat", RoutesRegistry.ChatRoutes)
router.route("/ephemeral", RoutesRegistry.EphemeralRoutes)
router.route("/storage", RoutesRegistry.StorageRoutes)

router.get("/", (c: Context) => {
	return response_success(c, "main routes!")
})

router.get("/robots.txt", (c: Context) => {
	return c.text(`User-agent: *\nAllow: /`)
})

router.get("/ping", (c: Context) => {
	return response_success(c, "pong!")
})

router.all("*", (c: Context) => {
	return response_not_found(c)
})

export default router

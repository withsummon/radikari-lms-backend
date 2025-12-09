import { Hono } from "hono"
import * as UserActivityLogController from "$controllers/rest/UserActivityLogController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import { Roles } from "../../generated/prisma/client"

const UserActivityLogRoutes = new Hono()

UserActivityLogRoutes.get(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRole([Roles.ADMIN]),
	UserActivityLogController.getAll,
)

UserActivityLogRoutes.get(
	"/:id",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRole([Roles.ADMIN]),
	UserActivityLogController.getById,
)

export default UserActivityLogRoutes

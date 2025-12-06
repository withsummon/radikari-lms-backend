import { Hono } from "hono"
import * as AnnouncementController from "$controllers/rest/AnnouncementController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as AnnouncementValidation from "$validations/AnnouncementValidation"

const AnnouncementRoutes = new Hono()

AnnouncementRoutes.get(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	AnnouncementController.getAll,
)

AnnouncementRoutes.get(
	"/:id",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	AnnouncementController.getById,
)

AnnouncementRoutes.post(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	AnnouncementValidation.validateAnnouncementSchema,
	AnnouncementController.create,
)

AnnouncementRoutes.put(
	"/:id",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	AnnouncementValidation.validateAnnouncementSchema,
	AnnouncementController.update,
)

AnnouncementRoutes.delete(
	"/:id",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleInTenant,
	AnnouncementController.deleteById,
)

export default AnnouncementRoutes

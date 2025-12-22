import * as UserController from "$controllers/rest/UserController"
import * as Validations from "$validations/UserValidation"
import { Hono } from "hono"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import { Roles } from "../../generated/prisma/client"

const UserRoutes = new Hono()

UserRoutes.get(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRole([Roles.ADMIN]),
	UserController.getAll,
)

UserRoutes.get(
	"/:id",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRole([Roles.ADMIN]),
	UserController.getById,
)

UserRoutes.post(
	"/",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRole([Roles.ADMIN]),
	Validations.validateCreateDTO,
	UserController.create,
)

UserRoutes.put(
	"/:id",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRoleOrSameUser([Roles.ADMIN]),
	Validations.validateUpdateDTO,
	UserController.update,
)

UserRoutes.delete(
	"/:id",
	AuthMiddleware.checkJwt,
	AuthMiddleware.checkRole([Roles.ADMIN]),
	UserController.deleteById,
)

export default UserRoutes

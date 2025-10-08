import * as UserController from "$controllers/rest/UserController"
import * as Validations from "$validations/UserValidation"
import { Hono } from "hono"
import * as AuthMiddleware from "$middlewares/authMiddleware"

const UserRoutes = new Hono()

UserRoutes.get("/", AuthMiddleware.checkJwt, UserController.getAll)

UserRoutes.get("/:id", AuthMiddleware.checkJwt, UserController.getById)

UserRoutes.post("/", AuthMiddleware.checkJwt, Validations.validateCreateDTO, UserController.create)

UserRoutes.put(
    "/:id",
    AuthMiddleware.checkJwt,
    Validations.validateUpdateDTO,
    UserController.update
)

UserRoutes.delete("/:id", AuthMiddleware.checkJwt, UserController.deleteById)

export default UserRoutes

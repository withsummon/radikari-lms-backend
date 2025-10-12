import { Hono } from "hono"
import * as OperationController from "$controllers/rest/OperationController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import { Roles } from "../../generated/prisma/client"
import * as Validations from "$validations/OperationValidation"

const OperationRoutes = new Hono()

OperationRoutes.get(
    "/",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRole([Roles.ADMIN]),
    OperationController.getAll
)

OperationRoutes.get(
    "/:id",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRole([Roles.ADMIN]),
    OperationController.getById
)

OperationRoutes.post(
    "/",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRole([Roles.ADMIN]),
    Validations.validateOperationSchema,
    OperationController.create
)

OperationRoutes.put(
    "/:id",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRole([Roles.ADMIN]),
    Validations.validateOperationSchema,
    OperationController.update
)

OperationRoutes.delete(
    "/:id",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRole([Roles.ADMIN]),
    OperationController.deleteById
)

export default OperationRoutes

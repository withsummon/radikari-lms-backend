import { Hono } from "hono"
import * as OperationController from "$controllers/rest/OperationController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as Validations from "$validations/OperationValidation"

const OperationRoutes = new Hono()

OperationRoutes.get("/", AuthMiddleware.checkJwt, OperationController.getAll)

OperationRoutes.get("/:id", AuthMiddleware.checkJwt, OperationController.getById)

OperationRoutes.post(
    "/",
    AuthMiddleware.checkJwt,
    Validations.validateOperationSchema,
    OperationController.create
)

OperationRoutes.put(
    "/:id",
    AuthMiddleware.checkJwt,
    Validations.validateOperationSchema,
    OperationController.update
)

OperationRoutes.delete("/:id", AuthMiddleware.checkJwt, OperationController.deleteById)

export default OperationRoutes

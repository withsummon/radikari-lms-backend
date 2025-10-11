import { Hono } from "hono"
import * as TenantController from "$controllers/rest/TenantController"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import * as Validations from "$validations/TenantValidation"

const TenantRoutes = new Hono()

TenantRoutes.get("/", AuthMiddleware.checkJwt, TenantController.getAll)

TenantRoutes.get("/:id", AuthMiddleware.checkJwt, TenantController.getById)

TenantRoutes.post(
    "/",
    AuthMiddleware.checkJwt,
    Validations.validateTenantSchema,
    TenantController.create
)

TenantRoutes.put(
    "/:id",
    AuthMiddleware.checkJwt,
    Validations.validateTenantSchema,
    TenantController.update
)

TenantRoutes.get("/:id/roles", AuthMiddleware.checkJwt, TenantController.getTenantRole)
TenantRoutes.get("/:id/users", AuthMiddleware.checkJwt, TenantController.getUserInTenant)

TenantRoutes.put(
    "/:id/users",
    AuthMiddleware.checkJwt,
    Validations.validateTenantUserUpdateSchema,
    TenantController.assignUserToTenant
)

TenantRoutes.delete("/:id", AuthMiddleware.checkJwt, TenantController.deleteById)

export default TenantRoutes

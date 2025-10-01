
import * as UserController from "$controllers/rest/UserController";
import * as Validations from "$validations/UserValidation";
import { Hono } from "hono";

const UserRoutes = new Hono();


UserRoutes.get("/",
    UserController.getAll
)


UserRoutes.get("/:id",
    UserController.getById
)


UserRoutes.post("/",
    Validations.validateCreateDTO,
    UserController.create
)

UserRoutes.put("/:id",
    UserController.update
)

UserRoutes.delete("/:id",
    UserController.deleteById
)

export default UserRoutes

import * as AuthController from "$controllers/rest/AuthController";
import * as AuthMiddleware from '$middlewares/authMiddleware';
import { response_not_found, response_success } from "$utils/response.utils";
import * as AuthValidation from "$validations/AuthValidations";
import { Context, Hono } from "hono";
import RoutesRegistry from './registry';


const router = new Hono();

router.post("/login", AuthValidation.validateLoginDTO, AuthController.login);
router.post("/register", AuthValidation.validateRegisterDTO, AuthController.register);
router.post("/verify-token", AuthController.verifyToken);
router.put("/update-password", AuthMiddleware.checkJwt, AuthController.changePassword);

router.route("/users", RoutesRegistry.UserRoutes)
router.route("/example/buffer", RoutesRegistry.ExampleBufferRoutes)

router.get("/", (c: Context) => {
  return response_success(c, "main routes!");
})

router.get('/robots.txt', (c: Context) => {
  return c.text(
    `User-agent: *\nAllow: /`);
});

router.get("/ping", (c: Context) => {
  return response_success(c, "pong!");
});

router.all("*", (c: Context) => {
  return response_not_found(c);
});

export default router;

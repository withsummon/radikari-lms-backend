import * as ExampleBufferController from "$controllers/rest/ExampleBufferController";
import { Hono } from "hono";

const ExampleBufferRoutes = new Hono();

ExampleBufferRoutes.get("/pdf", ExampleBufferController.getPDF)
ExampleBufferRoutes.get("/xlsx", ExampleBufferController.getXLSX)

export default ExampleBufferRoutes
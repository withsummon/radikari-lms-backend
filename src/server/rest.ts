
import { httpLogger } from "$middlewares/httpMiddleware";
import { PrismaInstance } from "$pkg/prisma";
import routes from "$routes/index";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { prettyJSON } from 'hono/pretty-json';

export default function createRestServer() {
  let allowedOrigins: string[] = ["*"]
  let corsOptions: any = {}
  if (process.env.ALLOWED_ORIGINS == "*") {
    corsOptions = {}
  } else {
    if (process.env.ALLOWED_ORIGINS) {
      allowedOrigins = process.env.ALLOWED_ORIGINS!.split(",")
      corsOptions.origin = allowedOrigins
    }
  }

  const app = new Hono();
  app.use(cors(corsOptions));
  app.use(httpLogger)

  app.use(prettyJSON({ space: 4 }));
  app.route("/", routes);

  PrismaInstance.getInstance()

  return app;
}

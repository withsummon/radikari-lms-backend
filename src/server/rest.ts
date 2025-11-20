
import { httpLogger } from "$middlewares/httpMiddleware";
import { PrismaInstance } from "$pkg/prisma";
import routes from "$routes/index";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { prettyJSON } from 'hono/pretty-json';

export default function createRestServer() {
  const app = new Hono();

  app.use(
    cors({
      origin: (origin) => {
        const allowedOrigins = [
          "http://localhost:3000",
          ...(process.env.ALLOWED_ORIGINS?.split(",") || []),
        ];
        if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
          return origin;
        }
        return null;
      },
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "OPTIONS"],
      credentials: true,
    })
  );

  app.use(httpLogger);

  app.use(prettyJSON({ space: 4 }));
  app.route("/", routes);

  PrismaInstance.getInstance()

  return app;
}

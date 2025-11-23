
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
          "https://radikari.withsummon.com",
          ...(process.env.ALLOWED_ORIGINS?.split(",") || []),
        ];
        console.log("CORS DEBUG:", { origin, allowedOrigins });
        
        // If origin is empty/undefined, it's likely not a CORS request or strict-origin policy hid it.
        // Returning null prevents sending Access-Control-Allow-Origin header.
        if (!origin) return null;

        if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
          return origin;
        }
        return null;
      },
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
    })
  );

  app.use(httpLogger);

  app.use(prettyJSON({ space: 4 }));
  app.route("/", routes);

  PrismaInstance.getInstance()

  return app;
}

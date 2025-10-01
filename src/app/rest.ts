
import * as Graceful from "$pkg/graceful";
import server from "$server/instance";

export function startRestApp() {
  const app = server.restServer()
  const restServer = Bun.serve({
    fetch: app.fetch,
    port: Number(process.env.PORT) || 3150,
  })


  Graceful.registerProcessForShutdown("rest-server", () => {
    restServer.stop()
  })
}



import * as Graceful from "$pkg/graceful";
import server from "$server/instance";

export function startRestApp() {
  const app = server.restServer()
  const actualPort = Number(process.env.REST_PORT) || 3150;
  
  // Debug logging to identify port configuration issue
  console.log('=== DEBUG: Backend Port Configuration ===');
  console.log('process.env.PORT:', process.env.PORT);
  console.log('Actual port used:', actualPort);
  console.log('==========================================');
  
  const restServer = Bun.serve({
    fetch: app.fetch,
    port: actualPort,
  })


  Graceful.registerProcessForShutdown("rest-server", () => {
    restServer.stop()
  })
}


import * as Graceful from "$pkg/graceful"
import server from "$server/instance"

export function startRestApp() {
	const app = server.restServer()

	// Debug logging to identify port configuration issue
	console.log("=== DEBUG: Backend Port Configuration ===")
	console.log("process.env.PORT:", process.env.PORT)
	console.log("Actual port used:", process.env.REST_PORT)
	console.log("==========================================")

	const restServer = Bun.serve({
		fetch: app.fetch,
		port: process.env.PORT,
	})

	Graceful.registerProcessForShutdown("rest-server", () => {
		restServer.stop()
	})
}

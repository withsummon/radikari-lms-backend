import Logger from "$pkg/logger"
import { initHttpTracerData, tracerStorage } from "$pkg/logger/tracer"
import { Context, Next } from "hono"
import loggableRoutes from "./loggableRoutes.json"

export function shouldLogRequest(path: string) {
	// Remove query parameters from path for matching
	const pathWithoutQuery = path.split("?")[0]

	// Check if any regex pattern matches
	const shouldLog = loggableRoutes.loggableRoutes.some((pattern: string) =>
		new RegExp(pattern).test(pathWithoutQuery),
	)

	return shouldLog
}

export async function httpLogger(c: Context, next: Next) {
	if (!shouldLogRequest(c.req.path)) {
		await next()
		return
	}

	const tracerData = initHttpTracerData(c)

	// Set up AsyncLocalStorage for this request
	await tracerStorage.run(tracerData, async () => {
		// Log request start
		Logger.info("Request started", {
			method: tracerData.method,
			url: tracerData.url,
			timestamp: new Date().toISOString(),
		})

		await next()

		// Log request completion
		const duration = Date.now() - tracerData.startTime
		Logger.info("Request completed", {
			method: tracerData.method,
			url: tracerData.url,
			duration: `${duration}ms`,
			timestamp: new Date().toISOString(),
		})
	})
}

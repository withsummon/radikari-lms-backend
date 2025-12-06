import { AsyncLocalStorage } from "async_hooks"
import { Context } from "hono"
import { ulid } from "ulid"

export interface TracerData {
	spanId: string
	resource: string
	startTime: number
	method?: string
	url?: string
}

// Create AsyncLocalStorage instance
export const tracerStorage = new AsyncLocalStorage<TracerData>()

// Initialize tracer data
export function initHttpTracerData(c: Context): TracerData {
	const tracerData: TracerData = {
		spanId: ulid(),
		resource: c.req.path || `${process.env.SERVICE_NAME}` || "unknown",
		startTime: Date.now(),
		method: c.req?.method,
		url: c.req?.url,
	}

	return tracerData
}

// Get current tracer data
export function getTracerData(): TracerData {
	let tracerData = tracerStorage.getStore()
	if (!tracerData) {
		console.log("No tracer data found, creating new one")
		tracerData = {
			spanId: ulid(),
			resource: `${process.env.SERVICE_NAME}` || "unknown",
			startTime: Date.now(),
			method: "N/A",
			url: "N/A",
		}

		tracerStorage.enterWith(tracerData)
	}
	return tracerData
}

// Get span ID
export function getSpanId(): string {
	const tracerData = getTracerData()
	return tracerData?.spanId || ulid()
}

// Get resource
export function getResource(): string {
	const tracerData = getTracerData()
	return tracerData?.resource || `${process.env.SERVICE_NAME}`
}

import { Context, TypedResponse } from "hono"
import { EphemeralChatService } from "$services/Ephemeral/EphemeralChatService"
import * as TenantService from "$services/TenantService"
import {
	response_created,
	response_internal_server_error,
	response_forbidden,
	response_bad_request,
} from "$utils/response.utils"
import { z } from "zod"
import { ModelMessage } from "ai"
import Logger from "$pkg/logger"

// Validation schemas
const SendMessageSchema = z.object({
	messages: z
		.array(
			z.object({
				role: z.enum(["user", "assistant", "system"]),
				content: z.string().optional(),
				parts: z.array(z.any()).optional(),
			}),
		)
		.min(1),
})

// Initialize service
const service = EphemeralChatService.getInstance()

/**
 * Create new ephemeral thread
 * POST /ephemeral/tenants/:tenantId/threads
 */
export async function createThread(c: Context): Promise<TypedResponse> {
	try {
		const tenantId = c.req.param("tenantId")

		// Validate tenantId
		if (!tenantId) {
			return response_bad_request(c, "tenantId is required")
		}

		// Validate origin (CORS + allowlist)
		const origin = c.req.header("origin")
		if (!validateOrigin(tenantId, origin)) {
			Logger.info("EphemeralChatController.createThread.invalidOrigin", {
				tenantId,
				origin,
			})
			return response_forbidden(c, "Invalid origin for tenant")
		}

		const result = service.createThread(tenantId)

		return response_created(c, result, "Ephemeral thread created successfully")
	} catch (error) {
		Logger.error("EphemeralChatController.createThread.error", { error })
		return response_internal_server_error(
			c,
			error instanceof Error ? error.message : "Failed to create thread",
		)
	}
}

/**
 * Send message to ephemeral thread (streaming)
 * POST /ephemeral/tenants/:tenantId/threads/:threadId/stream
 */
export async function sendMessage(c: Context): Promise<any> {
	try {
		const tenantId = c.req.param("tenantId")
		const threadId = c.req.param("threadId")

		// Validate parameters
		if (!tenantId || !threadId) {
			return response_bad_request(c, "tenantId and threadId are required")
		}

		// Validate origin
		const origin = c.req.header("origin")
		if (!validateOrigin(tenantId, origin)) {
			Logger.info("EphemeralChatController.sendMessage.invalidOrigin", {
				tenantId,
				threadId,
				origin,
			})
			return response_forbidden(c, "Invalid origin for tenant")
		}

		// Parse request body
		const body = await c.req.json()
		const parseResult = SendMessageSchema.safeParse(body)

		if (!parseResult.success) {
			Logger.info("EphemeralChatController.sendMessage.invalidBody", {
				tenantId,
				threadId,
				error: parseResult.error,
			})
			return response_bad_request(c, "Invalid request body")
		}

		// Convert to ModelMessage format
		const messages: ModelMessage[] = parseResult.data.messages.map((m: any) => {
			let content = m.content
			if (!content && m.parts) {
				content = m.parts
					.filter((p: any) => p.type === "text")
					.map((p: any) => p.text)
					.join("")
			}
			return {
				role: m.role as "user" | "assistant" | "system",
				content: content || "",
			}
		})

		// Send message via service (returns streaming response)
		return await service.sendMessage(tenantId, threadId, messages)
	} catch (error) {
		Logger.error("EphemeralChatController.sendMessage.error", { error })
		return response_internal_server_error(
			c,
			error instanceof Error ? error.message : "Failed to stream message",
		)
	}
}

/**
 * Origin validation helper
 * Checks if the request origin is allowed for the given tenant
 */
async function validateOrigin(
	tenantId: string,
	origin?: string,
): Promise<boolean> {
	if (!origin) return false

	try {
		// First, try to get dynamic whitelisted domains from tenant settings
		const settingsResponse = await TenantService.getSettings(tenantId)

		if (settingsResponse.status && settingsResponse.data) {
			const responseData = settingsResponse.data as {
				content?: Array<{
					id: string
					key: string
					value: string
					tenantId: string
				}>
				message?: string
				errors?: any[]
			}

			const whitelistSetting = (responseData.content || []).find(
				(setting: any) => setting.key === "WHITELISTED_DOMAINS",
			)

			if (whitelistSetting?.value) {
				try {
					const whitelistedDomains = JSON.parse(whitelistSetting.value)
					if (Array.isArray(whitelistedDomains)) {
						const allowedDomains = whitelistedDomains.map(
							(item: any) => item.domain,
						)
						return allowedDomains.includes(origin)
					}
				} catch (parseError) {
					Logger.info("EphemeralChatController.validateOrigin.parseError", {
						tenantId,
						error: parseError,
					})
				}
			}
		}

		// Fallback to environment variable for backward compatibility
		const allowlistEnv = process.env.TENANT_ORIGIN_ALLOWLIST

		if (!allowlistEnv) {
			// If no allowlist configured, default to deny for safety
			return false
		}

		// Try to parse as JSON first (for tenant-specific configuration)
		try {
			const allowlist = JSON.parse(allowlistEnv)
			const allowedOrigins = allowlist[tenantId]

			if (!allowedOrigins || !Array.isArray(allowedOrigins)) {
				// If no allowlist configured for tenant, default to deny for safety
				return false
			}

			return allowedOrigins.includes(origin)
		} catch (parseError) {
			// If JSON parsing fails, treat the entire string as a single allowed origin
			// This maintains backward compatibility with the simple string format
			return allowlistEnv === origin
		}
	} catch (error) {
		Logger.error("EphemeralChatController.validateOrigin.error", { error })
		return false
	}
}

import { ModelMessage } from "ai"
import { EphemeralThreadStore } from "./EphemeralThreadStore"
import { runEphemeralRag } from "./EphemeralRagRunner"
import Logger from "$pkg/logger"

export interface CreateThreadResponse {
	threadId: string
	tenantId: string
	expiresAt: Date
}

export interface SendMessageRequest {
	messages: ModelMessage[]
}

export interface SendMessageResponse {
	threadId: string
	tenantId: string
	messageCount: number
}

export class EphemeralChatService {
	private static instance: EphemeralChatService
	private store: EphemeralThreadStore

	private constructor() {
		this.store = EphemeralThreadStore.getInstance()
	}

	static getInstance(): EphemeralChatService {
		if (!EphemeralChatService.instance) {
			EphemeralChatService.instance = new EphemeralChatService()
		}
		return EphemeralChatService.instance
	}

	/**
	 * Create new ephemeral thread
	 */
	createThread(tenantId: string): CreateThreadResponse {
		Logger.info("EphemeralChatService.createThread", { tenantId })

		// Validate tenantId format
		if (!tenantId || typeof tenantId !== "string" || tenantId.length === 0) {
			throw new Error("Invalid tenantId")
		}

		const thread = this.store.createThread(tenantId)

		return {
			threadId: thread.threadId,
			tenantId: thread.tenantId,
			expiresAt: thread.expiresAt,
		}
	}

	/**
	 * Send message to ephemeral thread
	 * Returns streaming response
	 */
	async sendMessage(
		tenantId: string,
		threadId: string,
		messages: ModelMessage[],
	): Promise<Response> {
		Logger.info("EphemeralChatService.sendMessage", {
			tenantId,
			threadId,
			messageCount: messages.length,
		})

		// Validate tenantId matches thread origin
		this.validateTenantOwnership(tenantId, threadId)

		// Run ephemeral RAG
		return runEphemeralRag({
			messages,
			tenantId,
			threadId,
		})
	}

	/**
	 * Validate that tenantId matches thread's origin tenant
	 */
	private validateTenantOwnership(tenantId: string, threadId: string): void {
		// Try to get thread - will return null if not found or expired
		const thread = this.store.getThread(tenantId, threadId)

		if (!thread) {
			Logger.info("EphemeralChatService.validateTenantOwnership.failed", {
				tenantId,
				threadId,
			})
			throw new Error("Thread not found or expired")
		}

		// Additional validation: ensure thread's stored tenantId matches request
		if (thread.tenantId !== tenantId) {
			Logger.error("EphemeralChatService.validateTenantOwnership.mismatch", {
				requestTenantId: tenantId,
				threadTenantId: thread.tenantId,
				threadId,
			})
			throw new Error("Tenant ID mismatch")
		}
	}

	/**
	 * Get thread metrics (for monitoring/admin)
	 */
	getMetrics() {
		return this.store.getMetrics()
	}

	/**
	 * Emergency cleanup for a tenant
	 */
	deleteAllThreadsForTenant(tenantId: string): number {
		Logger.info("EphemeralChatService.deleteAllThreadsForTenant", { tenantId })
		return this.store.deleteAllThreadsForTenant(tenantId)
	}
}

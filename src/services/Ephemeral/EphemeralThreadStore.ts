import { ModelMessage } from "ai"
import { ulid } from "ulid"
import Logger from "$pkg/logger"

export interface EphemeralThreadData {
	threadId: string
	tenantId: string
	messages: ModelMessage[]
	createdAt: Date
	lastAccessed: Date
	expiresAt: Date
}

export class EphemeralThreadStore {
	private static instance: EphemeralThreadStore
	private threads: Map<string, EphemeralThreadData>
	private readonly keyPrefix = "ephemeral"

	private constructor() {
		this.threads = new Map()
	}

	static getInstance(): EphemeralThreadStore {
		if (!EphemeralThreadStore.instance) {
			EphemeralThreadStore.instance = new EphemeralThreadStore()
		}
		return EphemeralThreadStore.instance
	}

	/**
	 * Generate thread ID with ephem_ prefix
	 */
	private generateThreadId(): string {
		return `ephem_${ulid()}`
	}

	/**
	 * Build storage key
	 */
	private buildKey(tenantId: string, threadId: string): string {
		return `${this.keyPrefix}:${tenantId}:${threadId}`
	}

	/**
	 * Create new ephemeral thread
	 */
	createThread(tenantId: string): EphemeralThreadData {
		const threadId = this.generateThreadId()
		const now = new Date()
		const ttlSeconds = parseInt(process.env.EPHEMERAL_THREAD_TTL || "86400")

		const threadData: EphemeralThreadData = {
			threadId,
			tenantId,
			messages: [],
			createdAt: now,
			lastAccessed: now,
			expiresAt: new Date(now.getTime() + ttlSeconds * 1000),
		}

		const key = this.buildKey(tenantId, threadId)
		this.threads.set(key, threadData)

		Logger.info("EphemeralThreadStore.createThread", {
			threadId,
			tenantId,
			expiresAt: threadData.expiresAt,
		})

		return threadData
	}

	/**
	 * Get thread by ID
	 * Returns null if not found or expired
	 */
	getThread(tenantId: string, threadId: string): EphemeralThreadData | null {
		const key = this.buildKey(tenantId, threadId)
		const thread = this.threads.get(key)

		if (!thread) {
			Logger.info("EphemeralThreadStore.getThread.notFound", {
				tenantId,
				threadId,
			})
			return null
		}

		// Check expiration
		if (new Date() > thread.expiresAt) {
			Logger.info("EphemeralThreadStore.getThread.expired", {
				threadId,
				tenantId,
				expiresAt: thread.expiresAt,
			})
			this.threads.delete(key)
			return null
		}

		// Update last accessed
		thread.lastAccessed = new Date()
		this.threads.set(key, thread)

		return thread
	}

	/**
	 * Add message to thread
	 */
	addMessage(
		tenantId: string,
		threadId: string,
		message: ModelMessage,
	): boolean {
		const thread = this.getThread(tenantId, threadId)
		if (!thread) {
			return false
		}

		thread.messages.push(message)
		thread.lastAccessed = new Date()

		Logger.debug("EphemeralThreadStore.addMessage", {
			threadId,
			tenantId,
			messageCount: thread.messages.length,
		})

		return true
	}

	/**
	 * Delete expired threads
	 * Returns count of deleted threads
	 */
	deleteExpiredThreads(): number {
		const now = new Date()
		let deletedCount = 0

		for (const [key, thread] of this.threads.entries()) {
			if (now > thread.expiresAt) {
				this.threads.delete(key)
				deletedCount++
				Logger.debug("EphemeralThreadStore.deleteExpiredThreads", {
					threadId: thread.threadId,
					tenantId: thread.tenantId,
				})
			}
		}

		if (deletedCount > 0) {
			Logger.info("EphemeralThreadStore.deleteExpiredThreads", {
				deletedCount,
				remainingCount: this.threads.size,
			})
		}

		return deletedCount
	}

	/**
	 * Get metrics for monitoring
	 */
	getMetrics(): {
		totalThreads: number
		activeThreads: number
		expiredThreads: number
	} {
		const now = new Date()
		let expiredCount = 0

		for (const thread of this.threads.values()) {
			if (now > thread.expiresAt) {
				expiredCount++
			}
		}

		return {
			totalThreads: this.threads.size,
			activeThreads: this.threads.size - expiredCount,
			expiredThreads: expiredCount,
		}
	}

	/**
	 * Emergency cleanup - delete all threads for a tenant
	 */
	deleteAllThreadsForTenant(tenantId: string): number {
		let deletedCount = 0
		const prefix = `${this.keyPrefix}:${tenantId}:`

		for (const key of this.threads.keys()) {
			if (key.startsWith(prefix)) {
				this.threads.delete(key)
				deletedCount++
			}
		}

		Logger.info("EphemeralThreadStore.deleteAllThreadsForTenant", {
			tenantId,
			deletedCount,
		})

		return deletedCount
	}

	/**
	 * Clear all threads (for testing)
	 */
	clear(): void {
		this.threads.clear()
		Logger.info("EphemeralThreadStore.clear", {
			message: "All ephemeral threads have been cleared",
		})
	}
}

import { describe, it, expect, beforeEach, mock } from "bun:test"
import { EphemeralThreadStore } from "./EphemeralThreadStore"
import { ModelMessage } from "ai"

// Mock logger
mock.module("$pkg/logger", () => ({
	default: {
		info: mock(() => {}),
		error: mock(() => {}),
		debug: mock(() => {}),
		warn: mock(() => {}),
	},
}))

describe("EphemeralThreadStore", () => {
	let store: EphemeralThreadStore

	beforeEach(() => {
		store = EphemeralThreadStore.getInstance()
		store.clear()

		// Set short TTL for testing
		process.env.EPHEMERAL_THREAD_TTL = "1" // 1 second
	})

	describe("createThread", () => {
		it("should create thread with ephem_ prefix", () => {
			const thread = store.createThread("test-tenant")

			expect(thread.threadId).toMatch(/^ephem_/)
			expect(thread.tenantId).toBe("test-tenant")
			expect(thread.messages).toEqual([])
			expect(thread.createdAt).toBeInstanceOf(Date)
			expect(thread.expiresAt).toBeInstanceOf(Date)
		})

		it("should set correct TTL", () => {
			const thread = store.createThread("test-tenant")
			const now = new Date()

			const expectedExpiry = new Date(now.getTime() + 1000) // 1 second TTL
			expect(thread.expiresAt.getTime()).toBeCloseTo(
				expectedExpiry.getTime(),
				-2,
			)
		})
	})

	describe("getThread", () => {
		it("should retrieve existing thread", () => {
			const created = store.createThread("test-tenant")
			const retrieved = store.getThread("test-tenant", created.threadId)

			expect(retrieved).not.toBeNull()
			expect(retrieved?.threadId).toBe(created.threadId)
		})

		it("should return null for non-existent thread", () => {
			const result = store.getThread("test-tenant", "non-existent")
			expect(result).toBeNull()
		})

		it("should return null and delete expired thread", async () => {
			const thread = store.createThread("test-tenant")

			// Wait for expiration
			await new Promise((resolve) => setTimeout(resolve, 1100))

			const result = store.getThread("test-tenant", thread.threadId)
			expect(result).toBeNull()

			// Verify thread was deleted
			const checkAgain = store.getThread("test-tenant", thread.threadId)
			expect(checkAgain).toBeNull()
		})

		it("should update lastAccessed on retrieval", async () => {
			const thread = store.createThread("test-tenant")
			const firstAccessed = thread.lastAccessed

			// Wait a bit to ensure time passes
			await new Promise((resolve) => setTimeout(resolve, 10))

			const retrieved = store.getThread("test-tenant", thread.threadId)
			expect(retrieved?.lastAccessed.getTime()).toBeGreaterThan(
				firstAccessed.getTime(),
			)
		})
	})

	describe("addMessage", () => {
		it("should add message to thread", () => {
			const thread = store.createThread("test-tenant")
			const message: ModelMessage = { role: "user", content: "Hello" }

			const result = store.addMessage("test-tenant", thread.threadId, message)

			expect(result).toBe(true)

			const updatedThread = store.getThread("test-tenant", thread.threadId)
			expect(updatedThread?.messages).toHaveLength(1)
			expect(updatedThread?.messages[0]).toEqual(message)
		})

		it("should return false for non-existent thread", () => {
			const message: ModelMessage = { role: "user", content: "Hello" }
			const result = store.addMessage("test-tenant", "non-existent", message)

			expect(result).toBe(false)
		})
	})

	describe("deleteExpiredThreads", () => {
		it("should delete expired threads", async () => {
			// Create threads
			const thread1 = store.createThread("test-tenant")
			const thread2 = store.createThread("test-tenant")

			// Wait for expiration
			await new Promise((resolve) => setTimeout(resolve, 1100))

			// Create a new thread that shouldn't expire
			const thread3 = store.createThread("test-tenant")

			const deletedCount = store.deleteExpiredThreads()

			expect(deletedCount).toBe(2)

			// Verify expired threads are gone
			expect(store.getThread("test-tenant", thread1.threadId)).toBeNull()
			expect(store.getThread("test-tenant", thread2.threadId)).toBeNull()

			// Verify non-expired thread still exists
			expect(store.getThread("test-tenant", thread3.threadId)).not.toBeNull()
		})
	})

	describe("getMetrics", () => {
		it("should return correct metrics", () => {
			store.createThread("test-tenant")
			store.createThread("test-tenant")

			const metrics = store.getMetrics()

			expect(metrics.totalThreads).toBe(2)
			expect(metrics.activeThreads).toBe(2)
			expect(metrics.expiredThreads).toBe(0)
		})
	})

	describe("deleteAllThreadsForTenant", () => {
		it("should delete all threads for tenant", () => {
			store.createThread("tenant-1")
			store.createThread("tenant-1")
			store.createThread("tenant-2")

			const deletedCount = store.deleteAllThreadsForTenant("tenant-1")

			expect(deletedCount).toBe(2)

			// Verify tenant-1 threads are gone
			const metrics = store.getMetrics()
			expect(metrics.totalThreads).toBe(1) // Only tenant-2 thread remains
		})
	})

	describe("tenant isolation", () => {
		it("should isolate threads by tenant", () => {
			store.createThread("tenant-1")
			const thread2 = store.createThread("tenant-2")

			// Tenant 1 should not access tenant 2's thread
			const result = store.getThread("tenant-1", thread2.threadId)
			expect(result).toBeNull()

			// But tenant 2 can access its own thread
			const result2 = store.getThread("tenant-2", thread2.threadId)
			expect(result2).not.toBeNull()
		})
	})
})

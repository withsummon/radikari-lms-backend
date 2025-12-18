import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test"
import { Context } from "hono"

// Mock dependencies BEFORE importing the controller
mock.module("$pkg/logger", () => ({
	default: {
		info: mock(() => {}),
		error: mock(() => {}),
		warn: mock(() => {}),
		debug: mock(() => {}),
	},
}))

// Mock the EphemeralChatService BEFORE importing the controller
const mockCreateThread = mock(() => ({
	threadId: "ephem_test-thread-id",
	tenantId: "test-tenant-id",
	expiresAt: new Date(Date.now() + 3600000),
}))

mock.module("$services/Ephemeral/EphemeralChatService", () => ({
	EphemeralChatService: {
		getInstance: mock(() => ({
			createThread: mockCreateThread,
		})),
	},
}))

// Import the controller after setting up mocks
import { createThread } from "./EphemeralChatController"

describe("EphemeralChatController Origin Validation", () => {
	const originalEnv = process.env

	beforeEach(() => {
		// Reset process.env before each test
		process.env = { ...originalEnv }
		// Clear mocks
		mockCreateThread.mockClear()
	})

	afterEach(() => {
		// Restore original process.env after each test
		process.env = originalEnv
	})

	describe("Simple string format (backward compatibility)", () => {
		it("should allow origin when it matches the simple string format", async () => {
			process.env.TENANT_ORIGIN_ALLOWLIST = "http://localhost:5173"

			// Create a mock context
			const mockContext = {
				req: {
					param: () => "test-tenant-id",
					header: (name: string) =>
						name === "origin" ? "http://localhost:5173" : undefined,
				},
				status: mock(() => {}),
				json: mock(() => ({ status: 201 })),
			} as unknown as Context

			// This should not throw an error and should succeed
			const result = await createThread(mockContext)

			// The function should not return a forbidden response
			expect(result).not.toHaveProperty("status", 403)
			expect(mockCreateThread).toHaveBeenCalled()
		})

		it("should deny origin when it does not match the simple string format", async () => {
			process.env.TENANT_ORIGIN_ALLOWLIST = "http://localhost:5173"

			const mockContext = {
				req: {
					param: () => "test-tenant-id",
					header: (name: string) =>
						name === "origin" ? "http://malicious-site.com" : undefined,
				},
				status: mock(() => {}),
				json: mock(() => ({ status: 403 })),
			} as unknown as Context

			const result = await createThread(mockContext)

			// Should return forbidden (403)
			expect(result).toHaveProperty("status", 403)
			expect(mockCreateThread).not.toHaveBeenCalled()
		})
	})

	describe("JSON object format (tenant-specific)", () => {
		it("should allow origin when tenant is in JSON allowlist", async () => {
			process.env.TENANT_ORIGIN_ALLOWLIST = JSON.stringify({
				"tenant-1": ["http://localhost:5173", "https://app.example.com"],
				"tenant-2": ["https://app.example.com"],
			})

			const mockContext = {
				req: {
					param: () => "tenant-1",
					header: (name: string) =>
						name === "origin" ? "http://localhost:5173" : undefined,
				},
				status: mock(() => {}),
				json: mock(() => ({ status: 201 })),
			} as unknown as Context

			const result = await createThread(mockContext)

			// Should not return forbidden
			expect(result).not.toHaveProperty("status", 403)
			expect(mockCreateThread).toHaveBeenCalled()
		})

		it("should deny origin when tenant is not in JSON allowlist", async () => {
			process.env.TENANT_ORIGIN_ALLOWLIST = JSON.stringify({
				"tenant-1": ["http://localhost:5173"],
			})

			const mockContext = {
				req: {
					param: () => "tenant-2",
					header: (name: string) =>
						name === "origin" ? "http://localhost:5173" : undefined,
				},
				status: mock(() => {}),
				json: mock(() => ({ status: 403 })),
			} as unknown as Context

			const result = await createThread(mockContext)

			// Should return forbidden
			expect(result).toHaveProperty("status", 403)
			expect(mockCreateThread).not.toHaveBeenCalled()
		})

		it("should deny origin when origin is not in tenant allowlist array", async () => {
			process.env.TENANT_ORIGIN_ALLOWLIST = JSON.stringify({
				"tenant-1": ["http://localhost:5173"],
			})

			const mockContext = {
				req: {
					param: () => "tenant-1",
					header: (name: string) =>
						name === "origin" ? "http://malicious-site.com" : undefined,
				},
				status: mock(() => {}),
				json: mock(() => ({ status: 403 })),
			} as unknown as Context

			const result = await createThread(mockContext)

			// Should return forbidden
			expect(result).toHaveProperty("status", 403)
			expect(mockCreateThread).not.toHaveBeenCalled()
		})
	})

	describe("Edge cases", () => {
		it("should deny when no origin header is provided", async () => {
			process.env.TENANT_ORIGIN_ALLOWLIST = "http://localhost:5173"

			const mockContext = {
				req: {
					param: () => "test-tenant-id",
					header: (name: string) => undefined,
				},
				status: mock(() => {}),
				json: mock(() => ({ status: 403 })),
			} as unknown as Context

			const result = await createThread(mockContext)

			// Should return forbidden
			expect(result).toHaveProperty("status", 403)
			expect(mockCreateThread).not.toHaveBeenCalled()
		})

		it("should deny when no allowlist is configured", async () => {
			delete process.env.TENANT_ORIGIN_ALLOWLIST

			const mockContext = {
				req: {
					param: () => "test-tenant-id",
					header: (name: string) =>
						name === "origin" ? "http://localhost:5173" : undefined,
				},
				status: mock(() => {}),
				json: mock(() => ({ status: 403 })),
			} as unknown as Context

			const result = await createThread(mockContext)

			// Should return forbidden
			expect(result).toHaveProperty("status", 403)
			expect(mockCreateThread).not.toHaveBeenCalled()
		})
	})
})

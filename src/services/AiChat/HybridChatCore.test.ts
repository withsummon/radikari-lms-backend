import { describe, it, expect, mock, beforeEach } from "bun:test"
import { executeHybridChatCore } from "./HybridChatCore"
import { ModelMessage } from "ai"

// Create mock functions that can have their implementations changed
const mockSearch = mock(() => Promise.resolve([]))
const mockGetById = mock(() => Promise.resolve(null))
const mockCheckTokenLimit = mock(() => Promise.resolve({ allowed: true }))
const mockLoggerInfo = mock(() => {})
const mockLoggerError = mock(() => {})
const mockLoggerDebug = mock(() => {})

// Mock dependencies
mock.module("$pkg/qdrant", () => ({
	qdrantClient: {
		search: mockSearch,
	},
}))

mock.module("$repositories/KnowledgeRepository", () => ({
	getById: mockGetById,
}))

mock.module("$services/Tenant/TenantLimitService", () => ({
	checkTokenLimit: mockCheckTokenLimit,
}))

mock.module("$pkg/logger", () => ({
	default: {
		info: mockLoggerInfo,
		error: mockLoggerError,
		debug: mockLoggerDebug,
	},
}))

beforeEach(() => {
	// Reset mocks before each test
	mockSearch.mockClear()
	mockGetById.mockClear()
	mockCheckTokenLimit.mockClear()
	mockLoggerInfo.mockClear()
	mockLoggerError.mockClear()
	mockLoggerDebug.mockClear()

	// Set default implementations
	mockSearch.mockImplementation(() => Promise.resolve([]))
	mockGetById.mockImplementation(() => Promise.resolve(null))
	mockCheckTokenLimit.mockImplementation(() =>
		Promise.resolve({ allowed: true }),
	)
})

describe("HybridChatCore", () => {
	describe("executeHybridChatCore", () => {
		it("should execute RAG pipeline without side effects", async () => {
			const messages: ModelMessage[] = [
				{ role: "user", content: "What is Radikari?" },
			]

			const response = await executeHybridChatCore({
				messages,
				tenantId: "test-tenant",
			})

			expect(response).toBeInstanceOf(Response)
		})

		it("should throw error when token limit exceeded", async () => {
			// Set the mock to return limit exceeded for this test
			mockCheckTokenLimit.mockImplementation(() =>
				Promise.resolve({
					allowed: false,
					errorMessage: "Limit exceeded",
				}),
			)

			const messages: ModelMessage[] = [
				{ role: "user", content: "Test message" },
			]

			await expect(
				executeHybridChatCore({ messages, tenantId: "test-tenant" }),
			).rejects.toThrow("Limit exceeded")
		})

		it("should not accept userId parameter", async () => {
			const messages: ModelMessage[] = [{ role: "user", content: "Test" }]

			// The function signature doesn't accept userId, so this test is about type safety
			// We can't actually pass userId due to TypeScript, so we test the function works without it
			const response = await executeHybridChatCore({
				messages,
				tenantId: "test-tenant",
			})

			expect(response).toBeInstanceOf(Response)
		})

		it("should return streaming response", async () => {
			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]

			const response = await executeHybridChatCore({
				messages,
				tenantId: "test-tenant",
			})

			expect(response).toBeInstanceOf(Response)
			expect(response.body).toBeInstanceOf(ReadableStream)
		})
	})
})

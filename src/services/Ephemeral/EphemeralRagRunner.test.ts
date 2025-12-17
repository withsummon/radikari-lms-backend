import { describe, it, expect, mock, beforeEach } from "bun:test"
import { runEphemeralRag } from "./EphemeralRagRunner"
import { ModelMessage } from "ai"
import { EphemeralThreadData } from "./EphemeralThreadStore"

// Create mocks outside the module mock to keep them in scope
// Use explicit return type for getThread mock to allow null
const storeMock = {
	getThread: mock((): EphemeralThreadData | null => ({
		threadId: "ephem_test123",
		tenantId: "test-tenant",
		messages: [],
		createdAt: new Date(),
		lastAccessed: new Date(),
		expiresAt: new Date(Date.now() + 86400000),
	})),
	addMessage: mock(() => true),
}

// Use explicit signature for executeHybridChatCore mock to satisfy TS
const executeHybridChatCoreMock = mock((_args: any) =>
	Promise.resolve(new Response()),
)

// Mock dependencies
mock.module("../AiChat/HybridChatCore", () => ({
	executeHybridChatCore: executeHybridChatCoreMock,
}))

mock.module("$pkg/logger", () => ({
	default: {
		info: mock(() => {}),
		error: mock(() => {}),
		warn: mock(() => {}),
		debug: mock(() => {}),
	},
}))

mock.module("./EphemeralThreadStore", () => ({
	EphemeralThreadStore: {
		getInstance: mock(() => storeMock),
	},
}))

describe("EphemeralRagRunner", () => {
	beforeEach(() => {
		storeMock.getThread.mockClear()
		storeMock.addMessage.mockClear()
		executeHybridChatCoreMock.mockClear()

		// Default successful thread mock
		storeMock.getThread.mockImplementation(() => ({
			threadId: "ephem_test123",
			tenantId: "test-tenant",
			messages: [],
			createdAt: new Date(),
			lastAccessed: new Date(),
			expiresAt: new Date(Date.now() + 86400000),
		}))
	})

	describe("runEphemeralRag", () => {
		it("should execute RAG without identity parameters", async () => {
			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]

			const response = await runEphemeralRag({
				messages,
				tenantId: "test-tenant",
				threadId: "ephem_test123",
			})

			expect(response).toBeInstanceOf(Response)
		})

		it("should throw error if thread not found", async () => {
			storeMock.getThread.mockImplementation(() => null)

			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]

			await expect(
				runEphemeralRag({
					messages,
					tenantId: "test-tenant",
					threadId: "non-existent",
				}),
			).rejects.toThrow("Thread not found or expired")
		})

		it("should add user message to thread", async () => {
			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]

			await runEphemeralRag({
				messages,
				tenantId: "test-tenant",
				threadId: "ephem_test123",
			})

			expect(storeMock.addMessage).toHaveBeenCalled()
		})

		it("should call HybridChatCore with correct parameters", async () => {
			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]

			await runEphemeralRag({
				messages,
				tenantId: "test-tenant",
				threadId: "ephem_test123",
			})

			expect(executeHybridChatCoreMock).toHaveBeenCalledWith(
				expect.objectContaining({
					messages,
					tenantId: "test-tenant",
					onFinish: expect.any(Function),
				}),
			)
		})

		it("should not pass userId to HybridChatCore", async () => {
			let capturedArgs: any = null
			executeHybridChatCoreMock.mockImplementation((args: any) => {
				capturedArgs = args
				return Promise.resolve(new Response())
			})

			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]

			await runEphemeralRag({
				messages,
				tenantId: "test-tenant",
				threadId: "ephem_test123",
			})

			expect(capturedArgs).not.toBeNull()
			expect(capturedArgs).not.toHaveProperty("userId")
			expect(capturedArgs).not.toHaveProperty("user_id")
			expect(capturedArgs.tenantId).toBe("test-tenant")
			expect(capturedArgs.messages).toEqual(messages)
		})
	})
})

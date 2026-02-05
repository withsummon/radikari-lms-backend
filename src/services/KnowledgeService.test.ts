import { describe, it, expect, mock, beforeEach } from "bun:test";
import { approveById } from "./KnowledgeService";
import {
  KnowledgeActivityLogAction,
  KnowledgeAccess,
} from "../../generated/prisma/client";

// Mocks
const mockGetById = mock(() => Promise.resolve(null));
const mockUpdateStatus = mock(() => Promise.resolve(null));
const mockLogCreate = mock(() => Promise.resolve(null));
const mockNotifyTenantUsers = mock(() => Promise.resolve(null));
const mockNotifySpecificUsers = mock(() => Promise.resolve(null));
const mockSendToQueue = mock(() => Promise.resolve(null));
const mockLoggerInfo = mock(() => {});
const mockLoggerError = mock(() => {});
const mockLoggerWarning = mock(() => {});

// Mock Dependencies
mock.module("$repositories/KnowledgeRepository", () => ({
  getById: mockGetById,
  updateStatus: mockUpdateStatus,
}));

mock.module("$services/UserActivityLogService", () => ({
  create: mockLogCreate,
}));

mock.module("$services/NotificationService", () => ({
  notifyTenantUsers: mockNotifyTenantUsers,
  notifySpecificUsers: mockNotifySpecificUsers,
}));

mock.module("$pkg/pubsub", () => ({
  GlobalPubSub: {
    getInstance: () => ({
      getPubSub: () => ({
        sendToQueue: mockSendToQueue,
      }),
    }),
  },
  PUBSUB_TOPICS: {
    KNOWLEDGE_CREATE: "KNOWLEDGE_CREATE",
    KNOWLEDGE_APPROVAL_NOTIFICATION: "KNOWLEDGE_APPROVAL_NOTIFICATION",
  },
}));

mock.module("$pkg/logger", () => ({
  default: {
    info: mockLoggerInfo,
    error: mockLoggerError,
    warning: mockLoggerWarning,
  },
}));

describe("KnowledgeService RAG Verification", () => {
  beforeEach(() => {
    mockGetById.mockClear();
    mockUpdateStatus.mockClear();
    mockSendToQueue.mockClear();
  });

  const userId = "user-123";
  const tenantId = "tenant-123";

  it("should send Excel/Markdown content to RAG queue on approval", async () => {
    // 1. Mock Data: Knowledge created from Excel (Markdown Table in description)
    const mockKnowledgeExcel = {
      id: "know-excel-1",
      headline: "Q1 Sales Report",
      status: "PENDING",
      createdByUserId: "creator-1",
      tenantId: tenantId,
      access: KnowledgeAccess.TENANT,
      type: "ARTICLE",
      category: "Sales",
      subCategory: "Reports",
      case: "Quarterly",
      userKnowledge: [],
      knowledgeAttachment: [{ attachmentUrl: "https://storage.com/data.xlsx" }],
      knowledgeContent: [
        {
          title: "Q1 Sales Data",
          description:
            "| Product | Qty | Revenue |\n|---|---|---|\n| Widget A | 100 | $1000 |",
        },
      ],
    };

    mockGetById.mockResolvedValue(mockKnowledgeExcel as any);

    // 2. Action: Approve the Knowledge
    const result = await approveById(mockKnowledgeExcel.id, tenantId, userId, {
      action: KnowledgeActivityLogAction.APPROVE,
      comment: "Looks good",
    });

    // 3. Verification
    expect(result.status).toBe(true);

    // Verify PubSub was called with KNOWLEDGE_CREATE topic
    expect(mockSendToQueue).toHaveBeenCalled();

    // Check Payload content
    const calls = mockSendToQueue.mock.calls;
    const createCall = calls.find(
      (call: any[]) => call[0] === "KNOWLEDGE_CREATE",
    );
    expect(createCall).toBeDefined();

    const payload = (createCall as any[])[1];

    // Verify RAG Content contains the Markdown Table
    expect(payload?.content).toContain("Headline: Q1 Sales Report");
    expect(payload?.content).toContain("| Product | Qty | Revenue |"); // The table header
    expect(payload?.content).toContain("| Widget A | 100 | $1000 |"); // The data row
  });

  it("should send Video metadata to RAG queue on approval", async () => {
    // 1. Mock Data: Knowledge created from Video
    const mockKnowledgeVideo = {
      id: "know-video-1",
      headline: "Server Setup Tutorial",
      status: "PENDING",
      createdByUserId: "creator-1",
      tenantId: tenantId,
      access: KnowledgeAccess.TENANT,
      type: "ARTICLE", // or VIDEO if supported, assuming ARTICLE for now based on implementation
      category: "IT",
      subCategory: "Infrastructure",
      case: "Setup",
      userKnowledge: [],
      knowledgeAttachment: [
        { attachmentUrl: "https://storage.com/tutorial.mp4" },
      ],
      knowledgeContent: [
        {
          title: "Video Description",
          description: "Watch this video to learn how to setup the server.",
        },
      ],
    };

    mockGetById.mockResolvedValue(mockKnowledgeVideo as any);

    // 2. Action: Approve the Knowledge
    const result = await approveById(mockKnowledgeVideo.id, tenantId, userId, {
      action: KnowledgeActivityLogAction.APPROVE,
      comment: "Approved video",
    });

    // 3. Verification
    expect(result.status).toBe(true);

    const calls = mockSendToQueue.mock.calls;
    const createCall = calls.find(
      (call: any[]) => call[0] === "KNOWLEDGE_CREATE",
    );
    expect(createCall).toBeDefined();

    const payload = (createCall as any[])[1];

    // Verify RAG Payload has video metadata
    expect(payload?.content).toContain("Headline: Server Setup Tutorial");
    expect(payload?.fileUrls).toContain("https://storage.com/tutorial.mp4");

    // Ideally checking generated fileType logic (optional based on implementation)
    // Ensure the system treats this as valid content for RAG
  });
});

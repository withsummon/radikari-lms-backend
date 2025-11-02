import {
    KnowledgeAccess,
    KnowledgeActivityLogAction,
    KnowledgeStatus,
    KnowledgeType,
} from "../../generated/prisma/client"

export interface KnowledgeDTO {
    id: string
    tenantId?: string
    category: string
    subCategory: string
    case: string
    headline: string
    type: KnowledgeType
    access: KnowledgeAccess
    status: KnowledgeStatus
    createdByUserId?: string
    emails?: string[]
    attachments: KnowledgeAttachmentDTO[]
    contents: KnowledgeContentDTO[]
}

export interface KnowledgeAttachmentDTO {
    id: string
    knowledgeId: string
    attachmentUrl: string
}
export interface KnowledgeContentDTO {
    id: string
    knowledgeId: string
    title: string
    description: string
    order: number
    attachments: KnowledgeContentAttachmentDTO[]
}
export interface KnowledgeContentAttachmentDTO {
    id: string
    knowledgeContentId: string
    order: number
    attachmentUrl: string
}

export interface KnowledgeApprovalDTO {
    action: KnowledgeActivityLogAction
    comment?: string
}

export interface KnowledgeQueueDTO {
    metadata: {
        knowledgeId: string
        type: KnowledgeType
        access: KnowledgeAccess
        tenantId: string | null
        accessUserIds: string[]
    }
    content: string
    fileType: string
    fileUrls: string[]
}

export interface KnowledgeBulkCreateDTO {
    access: KnowledgeAccess
    type: KnowledgeType
    emails: string[]
    fileUrl: string
}

export interface KnowledgeBulkCreateDataRow {
    "Tenant Name": string
    Description: string
    Headline: string
    Category: string
    "Sub Category": string
    Case: string
    Attachments: string
}
export interface KnowledgeBulkCreateTypeCaseDataRow {
    "Tenant Name": string
    Category: string
    "Sub Category": string
    Case: string
    "Detail Case": string
    "Merchant Name": string
    "Aggregator Name": string
    Probing: string
    "NEED KBA?": string
    FCR: string
    Guidance: string
    Note: string
    "SLA ESCALATION": string
    Assign: string
    Keterangan: string
}

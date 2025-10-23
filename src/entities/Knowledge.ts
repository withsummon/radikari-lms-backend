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

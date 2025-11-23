export interface ForumDTO {
    id: string
    title: string
    content: string
    tenantId: string
    createdByUserId: string
    attachmentUrls: string[]
}

export interface ForumCommentDTO {
    id: string
    forumId: string
    content: string
    createdByUserId: string
    replyToCommentId?: string
}

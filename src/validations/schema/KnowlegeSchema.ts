import { z } from "zod"
import {
    KnowledgeAccess,
    KnowledgeActivityLogAction,
    KnowledgeType,
} from "../../../generated/prisma/client"
export const KnowlegeSchema = z
    .strictObject({
        category: z.string({ required_error: "category is required" }),
        subCategory: z.string({ required_error: "subCategory is required" }),
        type: z.enum([KnowledgeType.ARTICLE, KnowledgeType.CASE], {
            required_error: "type is required",
        }),
        access: z.enum([KnowledgeAccess.PUBLIC, KnowledgeAccess.TENANT, KnowledgeAccess.EMAIL], {
            required_error: "access is required",
        }),
        case: z.string({ required_error: "case is required" }),
        headline: z.string({ required_error: "headline is required" }),
        attachments: z
            .array(
                z.object({
                    attachmentUrl: z.string({ required_error: "attachmentUrl is required" }),
                })
            )
            .optional(),
        contents: z.array(
            z.object({
                title: z.string({ required_error: "title is required" }),
                description: z.string({ required_error: "description is required" }),
                order: z.number({ required_error: "order is required" }),
                attachments: z
                    .array(
                        z.object({
                            order: z.number({ required_error: "order is required" }),
                            attachmentUrl: z.string({
                                required_error: "attachmentUrl is required",
                            }),
                        })
                    )
                    .optional(),
            })
        ),
        emails: z.array(z.string({ required_error: "emails is required" })).optional(),
    })
    .strict()

export const KnowledgeApprovalSchema = z
    .strictObject({
        action: z.enum(
            [
                KnowledgeActivityLogAction.APPROVE,
                KnowledgeActivityLogAction.REJECT,
                KnowledgeActivityLogAction.REVISION,
            ],
            { required_error: "action is required" }
        ),
        comment: z.string({ required_error: "comment is required" }).optional(),
    })
    .strict()

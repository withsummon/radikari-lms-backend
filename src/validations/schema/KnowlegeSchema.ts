import { z } from "zod"
import { KnowledgeActivityLogAction } from "../../../generated/prisma/client"
export const KnowlegeSchema = z
    .strictObject({
        tenantRoleId: z.string({ required_error: "tenantRoleId is required" }),
        category: z.string({ required_error: "category is required" }),
        subCategory: z.string({ required_error: "subCategory is required" }),
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

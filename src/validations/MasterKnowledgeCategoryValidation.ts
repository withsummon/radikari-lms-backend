import { Context, Next } from "hono"
import { response_bad_request } from "$utils/response.utils"
import { MasterKnowledgeCategoryDTO } from "$entities/MasterKnowledgeCategory"
import { MasterKnowledgeCategorySchema } from "./schema/MasterKnowledgeCategory"
import * as Helpers from "./helper"
import { prisma } from "$pkg/prisma"

export async function validateMasterKnowledgeCategory(c: Context, next: Next) {
    const data: MasterKnowledgeCategoryDTO = await c.req.json()
    let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
        MasterKnowledgeCategorySchema,
        data
    )

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    const categoryExist = await prisma.masterKnowledgeCategory.findUnique({
        where: {
            name: data.name,
        },
    })

    if (categoryExist) {
        invalidFields.push({ field: "name", message: "name already used" })
    }

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    await next()
}

export async function validateUpdateMasterKnowledgeCategory(c: Context, next: Next) {
    const data: MasterKnowledgeCategoryDTO = await c.req.json()
    const id = c.req.param("id")
    let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(
        MasterKnowledgeCategorySchema,
        data
    )

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    const categoryExist = await prisma.masterKnowledgeCategory.findUnique({
        where: {
            name: data.name,
        },
    })

    if (categoryExist && categoryExist.id !== id) {
        invalidFields.push({ field: "name", message: "name already used" })
    }

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }

    await next()
}

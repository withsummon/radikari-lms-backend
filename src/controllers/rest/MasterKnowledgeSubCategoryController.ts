import {Context, TypedResponse} from "hono"
import * as MasterKnowledgeSubCategoryService from "$services/MasterKnowledgeSubCategoryService"
import { handleServiceErrorWithResponse, response_created, response_success } from "$utils/response.utils"
import { MasterKnowledgeSubCategoryDTO } from "$entities/MasterKnowledgeSubCategory"
import * as EzFilter from "@nodewave/prisma-ezfilter"


export async function create(c:Context): Promise<TypedResponse> {
    const data: MasterKnowledgeSubCategoryDTO = await c.req.json();

    const serviceResponse = await MasterKnowledgeSubCategoryService.create(data);

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_created(c, serviceResponse.data, "Successfully created new MasterKnowledgeSubCategory!");
}

export async function getAll(c:Context): Promise<TypedResponse> {
    const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(c.req.query())
    const serviceResponse = await MasterKnowledgeSubCategoryService.getAll(filters)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched all MasterKnowledgeSubCategory!")
}

export async function getById(c:Context): Promise<TypedResponse> {
    const id = c.req.param('id')

    const serviceResponse = await MasterKnowledgeSubCategoryService.getById(id)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched MasterKnowledgeSubCategory by id!")
}

export async function update(c:Context): Promise<TypedResponse> {
    const data: MasterKnowledgeSubCategoryDTO = await c.req.json()
    const id = c.req.param('id')

    const serviceResponse = await MasterKnowledgeSubCategoryService.update(id, data)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully updated MasterKnowledgeSubCategory!")
}

export async function deleteById(c:Context): Promise<TypedResponse> {
    const id = c.req.param('id')

    const serviceResponse = await MasterKnowledgeSubCategoryService.deleteById(id)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully deleted MasterKnowledgeSubCategory!")
}
    
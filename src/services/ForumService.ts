import { Forum, ForumComment } from "../../generated/prisma/client"
import { ForumCommentDTO, ForumDTO } from "$entities/Forum"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import * as ForumRepository from "$repositories/ForumRepository"
import {
    HandleServiceResponseCustomError,
    HandleServiceResponseSuccess,
    ResponseStatus,
    ServiceResponse,
} from "$entities/Service"
import Logger from "$pkg/logger"

export async function create(
    data: ForumDTO,
    tenantId: string,
    userId: string
): Promise<ServiceResponse<Forum | {}>> {
    try {
        data.createdByUserId = userId
        data.tenantId = tenantId
        console.log(data)
        const createdData = await ForumRepository.create(data)
        return HandleServiceResponseSuccess(createdData)
    } catch (err) {
        Logger.error(`ForumService.create : `, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getAll(
    filters: EzFilter.FilteringQuery,
    tenantId: string,
    userId: string
): Promise<ServiceResponse<EzFilter.PaginatedResult<Forum[]> | {}>> {
    try {
        const data = await ForumRepository.getAll(filters, tenantId, userId)
        return HandleServiceResponseSuccess(data)
    } catch (err) {
        Logger.error(`ForumService.getAll`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getById(
    id: string,
    tenantId: string,
    userId: string
): Promise<ServiceResponse<Forum | {}>> {
    try {
        let forum: any = await ForumRepository.getById(id, tenantId, userId)

        if (!forum) return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        const userForumLike = await ForumRepository.getUserForumLike(id, userId)

        if (userForumLike) {
            forum.isLiked = true
        } else {
            forum.isLiked = false
        }

        forum.isPinned = forum.forumPinneds.length > 0

        const countComments = await ForumRepository.getCountForumComments(id)
        forum.countComments = countComments

        return HandleServiceResponseSuccess(forum)
    } catch (err) {
        Logger.error(`ForumService.getById`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export type UpdateResponse = Forum | {}
export async function update(
    id: string,
    data: ForumDTO,
    tenantId: string,
    userId: string
): Promise<ServiceResponse<UpdateResponse>> {
    try {
        let forum = await ForumRepository.getById(id, tenantId, userId)

        if (!forum) return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        if (forum.createdByUserId !== userId)
            return HandleServiceResponseCustomError("Unauthorized", ResponseStatus.UNAUTHORIZED)

        const updatedForum = await ForumRepository.update(id, data)

        return HandleServiceResponseSuccess(updatedForum)
    } catch (err) {
        Logger.error(`ForumService.update`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function deleteById(
    id: string,
    tenantId: string,
    userId: string
): Promise<ServiceResponse<{}>> {
    try {
        let forum = await ForumRepository.getById(id, tenantId, userId)

        if (!forum) return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        if (forum.createdByUserId !== userId)
            return HandleServiceResponseCustomError("Unauthorized", ResponseStatus.UNAUTHORIZED)

        await ForumRepository.deleteById(id)
        return HandleServiceResponseSuccess({})
    } catch (err) {
        Logger.error(`ForumService.deleteById`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function likeForum(
    id: string,
    tenantId: string,
    userId: string
): Promise<ServiceResponse<{}>> {
    try {
        let forum = await ForumRepository.getById(id, tenantId, userId)

        if (!forum) return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        await ForumRepository.likeOrUnlikeForum(id, userId)
        return HandleServiceResponseSuccess({})
    } catch (err) {
        Logger.error(`ForumService.likeForum`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function commentForum(
    id: string,
    data: ForumCommentDTO,
    userId: string,
    tenantId: string
): Promise<ServiceResponse<{}>> {
    try {
        const forum = await ForumRepository.getById(id, tenantId, userId)
        if (!forum) return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        data.createdByUserId = userId
        data.forumId = id

        const comment = await ForumRepository.commentForum(data)

        return HandleServiceResponseSuccess(comment)
    } catch (error) {
        Logger.error(`ForumService.commentForum`, {
            error: error,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getForumComments(
    id: string,
    filters: EzFilter.FilteringQuery,
    userId: string
): Promise<ServiceResponse<ForumComment[] | {}>> {
    try {
        const comments = await ForumRepository.getForumComments(id, filters, userId)

        return HandleServiceResponseSuccess(comments)
    } catch (error) {
        Logger.error(`ForumService.getForumComments`, {
            error: error,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getForumCommentReplies(
    id: string,
    filters: EzFilter.FilteringQuery
): Promise<ServiceResponse<ForumComment[] | {}>> {
    try {
        const replies = await ForumRepository.getForumCommentReplies(id, filters)
        return HandleServiceResponseSuccess(replies)
    } catch (error) {
        Logger.error(`ForumService.getForumCommentReplies`, {
            error: error,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function deleteForumComment(id: string, userId: string): Promise<ServiceResponse<{}>> {
    try {
        const comment = await ForumRepository.getForumCommentById(id)
        if (!comment)
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        if (comment.createdByUserId !== userId)
            return HandleServiceResponseCustomError("Unauthorized", ResponseStatus.UNAUTHORIZED)

        await ForumRepository.deleteForumComment(id)
        return HandleServiceResponseSuccess({})
    } catch (error) {
        Logger.error(`ForumService.deleteForumComment`, {
            error: error,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function likeOrUnlikeForumComment(
    id: string,
    userId: string
): Promise<ServiceResponse<{}>> {
    try {
        const comment = await ForumRepository.getForumCommentById(id)
        if (!comment)
            return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        await ForumRepository.likeOrUnlikeForumComment(id, userId)
        return HandleServiceResponseSuccess({})
    } catch (error) {
        Logger.error(`ForumService.likeOrUnlikeForumComment`, {
            error: error,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function pinOrUnpinForum(
    forumId: string,
    tenantId: string,
    userId: string
): Promise<ServiceResponse<{}>> {
    try {
        const forum = await ForumRepository.getById(forumId, tenantId, userId)

        if (!forum) return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        await ForumRepository.pinOrUnpinForum(forumId, userId)
        return HandleServiceResponseSuccess({})
    } catch (error) {
        Logger.error(`ForumService.pinOrUnpinForum`, {
            error: error,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

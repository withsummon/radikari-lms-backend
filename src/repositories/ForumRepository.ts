import * as EzFilter from "@nodewave/prisma-ezfilter"
import { prisma } from "$pkg/prisma"
import { ForumCommentDTO, ForumDTO } from "$entities/Forum"
import { ulid } from "ulid"

export async function create(data: ForumDTO) {
    const { attachmentUrls, ...rest } = data
    return await prisma.$transaction(async (tx) => {
        const forum = await tx.forum.create({
            data: {
                ...rest,
            },
        })

        await tx.forumAttachment.createMany({
            data: attachmentUrls.map((url) => ({
                id: ulid(),
                forumId: forum.id,
                attachmentUrl: url,
            })),
        })
        return forum
    })
}

export async function getAll(filters: EzFilter.FilteringQuery, tenantId: string) {
    const queryBuilder = new EzFilter.BuildQueryFilter()
    const usedFilters = queryBuilder.build(filters)

    usedFilters.query.where.AND.push({
        tenantId,
    })

    usedFilters.query.include = {
        createdByUser: {
            select: {
                id: true,
                fullName: true,
            },
        },
    }
    const [forum, totalData] = await Promise.all([
        prisma.forum.findMany(usedFilters.query as any),
        prisma.forum.count({
            where: usedFilters.query.where,
        }),
    ])

    let totalPage = 1
    if (totalData > usedFilters.query.take)
        totalPage = Math.ceil(totalData / usedFilters.query.take)

    return {
        entries: forum,
        totalData,
        totalPage,
    }
}

export async function getById(id: string, tenantId: string) {
    return await prisma.forum.findUnique({
        where: {
            id,
            tenantId,
        },
        include: {
            createdByUser: {
                select: {
                    id: true,
                    fullName: true,
                },
            },
            forumComments: true,
            forumAttachments: true,
        },
    })
}

export async function update(id: string, data: ForumDTO) {
    const { attachmentUrls, ...rest } = data
    return await prisma.$transaction(async (tx) => {
        const forum = await tx.forum.update({
            where: {
                id,
            },
            data: rest,
        })

        await tx.forumAttachment.deleteMany({
            where: {
                forumId: id,
            },
        })
        await tx.forumAttachment.createMany({
            data: attachmentUrls.map((url) => ({
                id: ulid(),
                forumId: id,
                attachmentUrl: url,
            })),
        })
        return forum
    })
}

export async function deleteById(id: string) {
    return await prisma.forum.delete({
        where: {
            id,
        },
    })
}

export async function likeOrUnlikeForum(id: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
        const forumLike = await tx.forumLike.findUnique({
            where: {
                userId_forumId: {
                    userId,
                    forumId: id,
                },
            },
        })

        if (forumLike) {
            await tx.forumLike.delete({
                where: {
                    id: forumLike.id,
                },
            })

            await tx.$queryRaw`
                SELECT *
                FROM "Forum"
                WHERE id = ${id}
                FOR UPDATE
            `

            await tx.forum.update({
                where: {
                    id,
                },
                data: {
                    likesCount: { decrement: 1 },
                },
            })
        } else {
            await tx.forumLike.create({
                data: {
                    id: ulid(),
                    userId,
                    forumId: id,
                },
            })

            await tx.$queryRaw`
                SELECT *
                FROM "Forum"
                WHERE id = ${id}
                FOR UPDATE
            `

            await tx.forum.update({
                where: {
                    id,
                },
                data: {
                    likesCount: { increment: 1 },
                },
            })
        }
    })
}

export async function getUserForumLike(id: string, userId: string) {
    return await prisma.forumLike.findUnique({
        where: {
            userId_forumId: {
                userId,
                forumId: id,
            },
        },
    })
}

export async function commentForum(data: ForumCommentDTO) {
    return await prisma.forumComment.create({
        data,
    })
}

export async function getForumComments(
    forumId: string,
    filters: EzFilter.FilteringQuery,
    userId: string
) {
    const queryBuilder = new EzFilter.BuildQueryFilter()
    const usedFilters = queryBuilder.build(filters)

    usedFilters.query.where = {
        forumId,
        replyToCommentId: null,
    }

    usedFilters.query.include = {
        createdByUser: {
            select: {
                id: true,
                fullName: true,
            },
        },
    }

    const [comments, totalData] = await Promise.all([
        prisma.forumComment.findMany(usedFilters.query as any),
        prisma.forumComment.count({
            where: usedFilters.query.where,
        }),
    ])

    const mappedComments = []

    for (const comment of comments) {
        const [userForumCommentLike, replies] = await Promise.all([
            getUserForumCommentLike(comment.id, userId),
            getForumCommentReplies(comment.id, filters),
        ])

        if (userForumCommentLike) {
            mappedComments.push({
                ...comment,
                isLiked: true,
                hasReplies: replies.totalData > 0,
            })
        } else {
            mappedComments.push({
                ...comment,
                isLiked: false,
                hasReplies: replies.totalData > 0,
            })
        }
    }

    let totalPage = 1
    if (totalData > usedFilters.query.take)
        totalPage = Math.ceil(totalData / usedFilters.query.take)

    return {
        entries: mappedComments,
        totalData,
        totalPage,
    }
}

export async function getForumCommentReplies(commentId: string, filters: EzFilter.FilteringQuery) {
    const queryBuilder = new EzFilter.BuildQueryFilter()
    const usedFilters = queryBuilder.build(filters)

    usedFilters.query.where = {
        replyToCommentId: commentId,
    }

    usedFilters.query.include = {
        createdByUser: {
            select: {
                id: true,
                fullName: true,
            },
        },
    }

    const [replies, totalData] = await Promise.all([
        prisma.forumComment.findMany(usedFilters.query as any),
        prisma.forumComment.count({
            where: usedFilters.query.where,
        }),
    ])

    let totalPage = 1
    if (totalData > usedFilters.query.take)
        totalPage = Math.ceil(totalData / usedFilters.query.take)

    return {
        entries: replies,
        totalData,
        totalPage,
    }
}

export async function deleteForumComment(id: string) {
    return await prisma.forumComment.delete({
        where: {
            id,
        },
    })
}

export async function getForumCommentById(id: string) {
    return await prisma.forumComment.findUnique({
        where: {
            id,
        },
    })
}

export async function getCountForumComments(forumId: string) {
    return await prisma.forumComment.count({
        where: {
            forumId,
        },
    })
}

export async function likeOrUnlikeForumComment(id: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
        const forumCommentLike = await tx.forumCommentLike.findUnique({
            where: {
                userId_forumCommentId: {
                    userId,
                    forumCommentId: id,
                },
            },
        })

        if (forumCommentLike) {
            await tx.forumCommentLike.delete({
                where: {
                    id: forumCommentLike.id,
                },
            })

            await tx.$queryRaw`
                SELECT *
                FROM "ForumComment"
                WHERE id = ${id}
                FOR UPDATE
            `

            await tx.forumComment.update({
                where: {
                    id,
                },
                data: {
                    likesCount: { decrement: 1 },
                },
            })
        } else {
            await tx.forumCommentLike.create({
                data: {
                    id: ulid(),
                    userId,
                    forumCommentId: id,
                },
            })

            await tx.$queryRaw`
                SELECT *
                FROM "ForumComment"
                WHERE id = ${id}
                FOR UPDATE
            `

            await tx.forumComment.update({
                where: {
                    id,
                },
                data: {
                    likesCount: { increment: 1 },
                },
            })
        }
    })
}

export async function getUserForumCommentLike(commentId: string, userId: string) {
    return await prisma.forumCommentLike.findUnique({
        where: {
            userId_forumCommentId: {
                userId,
                forumCommentId: commentId,
            },
        },
    })
}

import * as EzFilter from "@nodewave/prisma-ezfilter";
import { prisma } from '$pkg/prisma';
import { MasterKnowledgeCategoryDTO } from '$entities/MasterKnowledgeCategory';

export async function create(data: MasterKnowledgeCategoryDTO){
    return await prisma.masterKnowledgeCategory.create({
        data
    })
}

export async function getAll(filters: EzFilter.FilteringQuery) {
        const queryBuilder = new EzFilter.BuildQueryFilter()
        const usedFilters = queryBuilder.build(filters)

        const [masterKnowledgeCategory, totalData] = await Promise.all([
            prisma.masterKnowledgeCategory.findMany(usedFilters.query as any),
            prisma.masterKnowledgeCategory.count({
                where: usedFilters.query.where
            })
        ])

        let totalPage = 1
        if (totalData > usedFilters.query.take) totalPage = Math.ceil(totalData / usedFilters.query.take)

        return {
            entries: masterKnowledgeCategory,
            totalData,
            totalPage
        }
}



export async function getById(id: string) {
    return await prisma.masterKnowledgeCategory.findUnique({
        where: {
            id
        }
    });
}


export async function update(id: string, data: MasterKnowledgeCategoryDTO) {
    return await prisma.masterKnowledgeCategory.update({
        where: {
            id
        },
        data
    })
}

export async function deleteById(id: string) {
    return await prisma.masterKnowledgeCategory.delete({
        where: {
            id
        }
    })
}

    
import fs from "fs"

export function generateRepository(entityName: string, schemaName: string) {
    const result = `import * as EzFilter from "@nodewave/prisma-ezfilter";
import { prisma } from '$pkg/prisma';
import { ${entityName}DTO } from '$entities/${entityName}';

export async function create(data: ${entityName}DTO){
    return await prisma.${schemaName}.create({
        data
    })
}

export async function getAll(filters: EzFilter.FilteringQuery) {
        const queryBuilder = new EzFilter.BuildQueryFilter()
        const usedFilters = queryBuilder.build(filters)

        const [${schemaName}, totalData] = await Promise.all([
            prisma.${schemaName}.findMany(usedFilters.query as any),
            prisma.${schemaName}.count({
                where: usedFilters.query.where
            })
        ])

        let totalPage = 1
        if (totalData > usedFilters.query.take) totalPage = Math.ceil(totalData / usedFilters.query.take)

        return {
            entries: ${schemaName},
            totalData,
            totalPage
        }
}



export async function getById(id: string) {
    return await prisma.${schemaName}.findUnique({
        where: {
            id
        }
    });
}


export async function update(id: string, data: ${entityName}DTO) {
    return await prisma.${schemaName}.update({
        where: {
            id
        },
        data
    })
}

export async function deleteById(id: string) {
    return await prisma.${schemaName}.delete({
        where: {
            id
        }
    })
}

    `

    const destination = `src/repositories/${entityName}Repository.ts`
    const filePath = `${__dirname}/../../${destination}`
    // Use writeFile to write the content to the file
    fs.writeFile(filePath, result, (err) => {
        if (err) {
            console.error("An error occurred:", err)
            return
        }
        console.log(`Repository has been written successfully to : ${destination}.ts`)
    })

    return destination
}

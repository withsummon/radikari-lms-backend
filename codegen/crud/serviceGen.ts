import fs from "fs"

export function generateService(entityName: string, schemaName: string) {
	const result = `
import { ${entityName} } from '../../generated/prisma/client';
import { ${entityName}DTO } from '$entities/${entityName}';
import * as EzFilter from "@nodewave/prisma-ezfilter";
import * as ${entityName}Repository from '$repositories/${entityName}Repository';   
import { HandleServiceResponseCustomError, HandleServiceResponseSuccess, ResponseStatus, ServiceResponse } from '$entities/Service';
import Logger from '$pkg/logger';

export async function create(data: ${entityName}DTO):Promise<ServiceResponse<${entityName} | {}>> {
    try {
        const createdData = await ${entityName}Repository.create(data)
        return HandleServiceResponseSuccess(createdData)
    } catch (err) {
        Logger.error(\`${entityName}Service.create : \`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}




export async function getAll(filters: EzFilter.FilteringQuery): Promise<ServiceResponse<EzFilter.PaginatedResult<${entityName}[]>|{}>> {
    try {
        const data = await ${entityName}Repository.getAll(filters)
        return HandleServiceResponseSuccess(data)
               
    } catch (err) {
        Logger.error(\`${entityName}Service.getAll\`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}


export async function getById(id: string): Promise<ServiceResponse<${entityName} | {}>> {
    try {
        let ${schemaName} = await ${entityName}Repository.getById(id)
        
        if (!${schemaName}) return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        return HandleServiceResponseSuccess(${schemaName})
    } catch (err) {
        Logger.error(\`${entityName}Service.getById\`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export type UpdateResponse = ${entityName} | {}
export async function update(id: string, data: ${entityName}DTO): Promise<ServiceResponse<UpdateResponse>> {
    try {
        let ${schemaName} = await ${entityName}Repository.getById(id);

        if (!${schemaName}) return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.NOT_FOUND)

        ${schemaName} = await ${entityName}Repository.update(id, data)

        return HandleServiceResponseSuccess(${schemaName})

    } catch (err) {
        Logger.error(\`${entityName}Service.update\`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function deleteById(id: string): Promise<ServiceResponse<{}>> {
    try {
        await ${entityName}Repository.deleteById(id)
        return HandleServiceResponseSuccess({})
    } catch (err) {
        Logger.error(\`${entityName}Service.deleteById\`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}
    `

	const destination = `src/services/${entityName}Service.ts`
	const filePath = `${__dirname}/../../${destination}`
	// Use writeFile to write the content to the file
	fs.writeFile(filePath, result, (err) => {
		if (err) {
			console.error("An error occurred:", err)
			return
		}
		console.log(`Service has been written successfully to : ${destination}.ts`)
	})

	return destination
}

import { z } from "zod/v4"

export interface ErrorStructure {
    field: string
    message: string
}

export function generateErrorStructure(field: string, message: string): ErrorStructure {
    return {
        field,
        message
    }
}


function extractUnknownKeys(errorMessage: string): string[] {
    // Match keys between single quotes, separated by commas
    const match = errorMessage.match(/Unrecognized key\(s\) in object: '([^']+)'(?:,\s*'([^']+)')*/)

    if (!match) return [];

    // Remove the full match and filter out undefined values
    return match.slice(1).filter((m) => m !== undefined);
}


export function validateSchema(schema: any, data: any): ErrorStructure[] {
    const schemaValidationResult = schema.safeParse(data)
    if (schemaValidationResult.error) {
        const flattenError = z.flattenError(schemaValidationResult.error as any)
        const errorFieldsEntry = flattenError.fieldErrors as Record<string, string[]>
        const formErrorFieldsEntry = flattenError.formErrors
        const errorFields = Object.keys(errorFieldsEntry)
        const invalidFields: ErrorStructure[] = []
        for (const field of errorFields) {
            const fieldError = errorFieldsEntry[field]
            if (fieldError) {
                invalidFields.push({ field, message: fieldError.join(", ") })
            }
        }

        for (const errorMessage of formErrorFieldsEntry) {
            if (errorMessage.startsWith(`Unrecognized`)) {
                extractUnknownKeys(errorMessage).map((key) => {
                    invalidFields.push({ field: key, message: `Field ${key} is not allowed` })
                })
            }
        }

        return invalidFields
    }
    return []
}
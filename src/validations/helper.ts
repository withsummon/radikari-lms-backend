import { z } from "zod/v4"

export interface ErrorStructure {
	field: string
	message: string
}

export function generateErrorStructure(
	field: string,
	message: string,
): ErrorStructure {
	return {
		field,
		message,
	}
}

export function validateSchema(schema: any, data: any): ErrorStructure[] {
	const schemaValidationResult = schema.safeParse(data)
	if (schemaValidationResult.error) {
		const errorFieldsEntry = z.treeifyError(
			schemaValidationResult.error,
		) as Record<string, string[]>
		const errorFields = Object.keys(errorFieldsEntry.properties)
		const invalidFields: ErrorStructure[] = []

		for (const field of errorFields) {
			const fieldError = errorFieldsEntry.properties[field as any] as any

			if (fieldError) {
				invalidFields.push({ field, message: fieldError.errors.join(", ") })
			}
		}

		// Handle unrecognized keys from error issues
		for (const issue of schemaValidationResult.error.issues) {
			if (issue.code === "unrecognized_keys") {
				const unrecognizedKeys = issue.keys || []
				unrecognizedKeys.forEach((key: string) => {
					invalidFields.push({
						field: key,
						message: `Field ${key} is not allowed`,
					})
				})
			}
		}

		return invalidFields
	}
	return []
}

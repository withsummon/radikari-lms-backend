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
		const invalidFields: ErrorStructure[] = []

		for (const issue of schemaValidationResult.error.issues) {
			const path = issue.path.join(".")
			const message = issue.message

			invalidFields.push({
				field: path,
				message: message,
			})
		}

		return invalidFields
	}
	return []
}

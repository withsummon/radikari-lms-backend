import fs from "fs"
import path from "path"
import readLineSync from "readline-sync"

interface FieldDefinition {
	name: string
	type: string
	required: boolean
	validations: string[]
}

interface EntityInterface {
	name: string
	fields: FieldDefinition[]
}

export function generateValidator() {
	const rl = readLineSync

	// Get basic information
	const entityName = rl.question("Enter Entity Name (example: User): ")
	const schemaName = rl.question(
		"Enter Schema Validation Name (example: UserSchema): ",
	)
	const outputFileName = rl.question(
		"Enter Validation output file name (without extension) (example: UserValidation): ",
	)

	// Check if entity file exists
	const entityPath = path.join(
		__dirname,
		"../../src/entities",
		`${entityName}.ts`,
	)
	if (!fs.existsSync(entityPath)) {
		console.log(`❌ Entity file not found: ${entityPath}`)
		console.log("Please create the entity file first or check the entity name.")
		return
	}

	// Read and parse entity file
	const entityContent = fs.readFileSync(entityPath, "utf8")
	const interfaces = parseEntityFile(entityContent, entityName)

	if (interfaces.length === 0) {
		console.log(`❌ No interfaces found in ${entityName}.ts`)
		return
	}

	// Let user choose which interface to use
	console.log("\n=== Available Interfaces ===")
	interfaces.forEach((intf, index) => {
		console.log(`${index + 1}. ${intf.name}`)
		console.log(
			"   Fields:",
			intf.fields.map((f) => `${f.name}: ${f.type}`).join(", "),
		)
	})

	const interfaceChoice = rl.question(
		"\nSelect interface number (or press Enter for first): ",
	)
	const selectedIndex = interfaceChoice ? parseInt(interfaceChoice) - 1 : 0
	const selectedInterface = interfaces[selectedIndex]

	if (!selectedInterface) {
		console.log("❌ Invalid interface selection")
		return
	}

	console.log(`\n✅ Selected: ${selectedInterface.name}`)

	// Ask for custom validations
	const fieldsWithValidations = askForValidations(selectedInterface.fields, rl)

	// Check if files exist
	const schemaPath = path.join(
		__dirname,
		"../../src/validations/schema",
		`${schemaName}.ts`,
	)
	const validationPath = path.join(
		__dirname,
		"../../src/validations",
		`${outputFileName}.ts`,
	)

	const schemaExists = fs.existsSync(schemaPath)
	const validationExists = fs.existsSync(validationPath)

	if (schemaExists) {
		const override = rl.question(
			"Schema Files already exist. Override? (Y/y for yes, N/n for no): ",
		)
		if (override.toLowerCase() !== "y") {
			console.log("Operation cancelled.")
			return
		}
	}

	// Generate schema
	const schemaContent = generateSchema(
		entityName,
		schemaName,
		fieldsWithValidations,
	)

	// Generate validation
	let validationContent = ""

	if (!validationExists) {
		validationContent = generateValidation(
			selectedInterface.name,
			entityName,
			schemaName,
			outputFileName,
			fieldsWithValidations,
		)
	} else {
		validationContent = appendValidation(
			selectedInterface.name,
			entityName,
			schemaName,
			outputFileName,
			fieldsWithValidations,
		)
	}

	// Write files
	try {
		// Ensure schema directory exists
		const schemaDir = path.dirname(schemaPath)
		if (!fs.existsSync(schemaDir)) {
			fs.mkdirSync(schemaDir, { recursive: true })
		}

		// Write schema file
		fs.writeFileSync(schemaPath, schemaContent)
		console.log(`✅ Schema file created: ${schemaPath}`)

		// Write validation file

		if (!validationExists) {
			fs.writeFileSync(validationPath, validationContent)
			console.log(`✅ Validation file created: ${validationPath}`)
		} else {
			fs.appendFileSync(validationPath, validationContent)
			console.log(`✅ Validation file updated: ${validationPath}`)
		}

		console.log("\n🎉 Generation completed successfully!")
	} catch (error) {
		console.error("❌ Error writing files:", error)
	}
}

function parseEntityFile(
	content: string,
	entityName: string,
): EntityInterface[] {
	const interfaces: EntityInterface[] = []

	// Match interface definitions
	const interfaceRegex = /export\s+(?:interface|type)\s+(\w+)\s*\{([\s\S]*?)\}/g
	let match

	while ((match = interfaceRegex.exec(content)) !== null) {
		const interfaceName = match[1]
		const interfaceBody = match[2]

		// Skip if it's not related to the entity (optional)
		if (
			!interfaceName.toLowerCase().includes(entityName.toLowerCase()) &&
			!interfaceName.includes("DTO") &&
			!interfaceName.includes("DAO")
		) {
			continue
		}

		const fields = parseInterfaceFields(interfaceBody)
		interfaces.push({
			name: interfaceName,
			fields: fields,
		})
	}

	return interfaces
}

function parseInterfaceFields(interfaceBody: string): FieldDefinition[] {
	const fields: FieldDefinition[] = []
	const lines = interfaceBody.split("\n")

	for (const line of lines) {
		const trimmedLine = line.trim()

		// Skip empty lines, comments, and closing brace
		if (!trimmedLine || trimmedLine.startsWith("//") || trimmedLine === "}") {
			continue
		}

		// Match field definition: fieldName: type;
		const fieldMatch = trimmedLine.match(/^(\w+)\s*:\s*([^;]+);?$/)
		if (fieldMatch) {
			const [, fieldName, fieldType] = fieldMatch
			const cleanType = fieldType.trim()

			// Determine if field is optional
			const isOptional = cleanType.endsWith("?")
			const actualType = isOptional ? cleanType.slice(0, -1) : cleanType

			// Map TypeScript types to Zod types
			const zodType = mapTypeScriptToZod(actualType)

			fields.push({
				name: fieldName,
				type: zodType,
				required: !isOptional,
				validations: [],
			})
		}
	}

	return fields
}

function mapTypeScriptToZod(tsType: string): string {
	const typeMappings: Record<string, string> = {
		string: "string",
		number: "number",
		boolean: "boolean",
		Date: "date",
		Roles: "enum", // Special case for your Roles enum
		"string[]": "array",
		"number[]": "array",
		"boolean[]": "array",
	}

	// Handle array types
	if (tsType.includes("[]")) {
		return "array"
	}

	// Handle union types (e.g., string | null)
	if (tsType.includes("|")) {
		const baseType = tsType.split("|")[0].trim()
		return typeMappings[baseType] || "string"
	}

	return typeMappings[tsType] || "string"
}

function askForValidations(
	fields: FieldDefinition[],
	rl: any,
): FieldDefinition[] {
	console.log("\n=== Field Validations ===")
	console.log("Available validations: required, min(n), max(n), email, enum")
	console.log("Format: validation1,validation2 (e.g., required,min(5))")
	console.log("Press Enter to skip custom validations for a field.\n")

	const fieldsWithValidations = fields.map((field) => {
		console.log(`Field: ${field.name} (${field.type})`)
		const validationsInput = rl.question("Validations (optional): ")

		if (validationsInput.trim()) {
			const validations = validationsInput
				.split(",")
				.map((v: string) => v.trim())
			return {
				...field,
				validations: validations,
			}
		}

		return field
	})

	return fieldsWithValidations
}

function generateSchema(
	entityName: string,
	schemaName: string,
	fields: FieldDefinition[],
): string {
	let schemaFields = ""

	// Process fields
	fields.forEach((field) => {
		let fieldDefinition = ` ${field.name}: `

		switch (field.type) {
			case "string":
				fieldDefinition += `z.string({ required_error: "${field.name} is required" })`
				break
			case "number":
				fieldDefinition += `z.number({ required_error: "${field.name} is required" })`
				break
			case "boolean":
				fieldDefinition += `z.boolean({ required_error: "${field.name} is required" })`
				break
			case "date":
				fieldDefinition += `z.date({ required_error: "${field.name} is required" })`
				break
			case "array":
				fieldDefinition += `z.array({ required_error: "${field.name} is required" })`
				break
			default:
				fieldDefinition += `z.string({ required_error: "${field.name} is required" })`
		}

		// Add validations
		field.validations.forEach((validation) => {
			if (validation.startsWith("min(")) {
				const minValue = validation.match(/min\((\d+)\)/)?.[1] || "5"
				fieldDefinition += `.min(${minValue}, ErrorMessages.${entityName.toLowerCase()}.${
					field.name
				}.min)`
			} else if (validation.startsWith("max(")) {
				const maxValue = validation.match(/max\((\d+)\)/)?.[1] || "100"
				fieldDefinition += `.max(${maxValue}, ErrorMessages.${entityName.toLowerCase()}.${
					field.name
				}.max)`
			} else if (validation === "email" && field.type !== "email") {
				fieldDefinition += `.email(ErrorMessages.${entityName.toLowerCase()}.${
					field.name
				}.email)`
			}
		})

		schemaFields += fieldDefinition + ",\n"
	})

	return (
		`import { z } from "zod"\n` +
		`export const ${schemaName} = z.strictObject({\n` +
		schemaFields +
		`}).strict()`
	)
}

function generateValidation(
	selectedInterface: string,
	entityName: string,
	schemaName: string,
	outputFileName: string,
	fields: FieldDefinition[],
): string {
	return `import { Context, Next } from 'hono';
import { response_bad_request } from '$utils/response.utils';
import { generateErrorStructure } from './helper'
import { ${selectedInterface} } from '$entities/${entityName}'
import { ${schemaName} } from './schema/${schemaName}'
import * as Helpers from './helper'
import z from 'zod/v4'

export async function validate${schemaName}(c: Context, next: Next) {
    const data: ${selectedInterface} = await c.req.json()
    let invalidFields: Helpers.ErrorStructure[] =  Helpers.validateSchema(${schemaName}, data)
   
    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }
    
    await next()
}`
}

function appendValidation(
	selectedInterface: string,
	entityName: string,
	schemaName: string,
	outputFileName: string,
	fields: FieldDefinition[],
): string {
	return `
import { ${selectedInterface} } from '$entities/${entityName}'
import { ${schemaName} } from './schema/${schemaName}'

export async function validate${selectedInterface}(c: Context, next: Next) {
    const data: ${selectedInterface} = await c.req.json()
    let invalidFields: Helpers.ErrorStructure[] = Helpers.validateSchema(${schemaName}, data)

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Validation Error", invalidFields)
    }
    
    await next()
}`
}

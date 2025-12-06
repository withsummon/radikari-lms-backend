import readLineSync from "readline-sync"
import { generateController } from "./controllerGen"
import { generateRepository } from "./repositoryGen"
import { generateRoutes } from "./routesGen"
import { generateService } from "./serviceGen"

export function generateCRUD() {
	const rl = readLineSync

	const entityName = rl.question(
		"Enter entity name (this will be used as controller and service name) : ",
	)
	const schemaName = rl.question(
		"Enter schema name (please enter in camel-case) , this will be used for `prisma.<schema name>` : ",
	)

	generateController(entityName)
	generateService(entityName, schemaName)
	generateRepository(entityName, schemaName)
	generateRoutes(entityName)

	console.log(`CRUD For ${entityName} is generated !\n`)
}

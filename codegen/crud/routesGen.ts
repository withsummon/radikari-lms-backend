import fs from "fs"

export function generateRoutes(entityName: string) {
	const result = `
import {Hono} from "hono"
import * as ${entityName}Controller from "$controllers/rest/${entityName}Controller"
import * as AuthMiddleware from "$middlewares/authMiddleware"


const ${entityName}Routes = new Hono();


${entityName}Routes.get("/",
    AuthMiddleware.checkJwt,
    ${entityName}Controller.getAll
)


${entityName}Routes.get("/:id",
    AuthMiddleware.checkJwt,
    ${entityName}Controller.getById
)


${entityName}Routes.post("/",
    AuthMiddleware.checkJwt,
    ${entityName}Controller.create
)

${entityName}Routes.put("/:id",
    AuthMiddleware.checkJwt,
    ${entityName}Controller.update
)

${entityName}Routes.delete("/:id",
    AuthMiddleware.checkJwt,
    ${entityName}Controller.deleteById
)

export default ${entityName}Routes
`
	const destination = `src/routes/${entityName}.ts`
	const filePath = `${__dirname}/../../${destination}`
	// Use writeFile to write the content to the file
	fs.writeFile(filePath, result, (err) => {
		if (err) {
			console.error("An error occurred:", err)
			return
		}
		console.log(`Routes has been written successfully to : ${destination}.ts`)
	})

	return destination
}

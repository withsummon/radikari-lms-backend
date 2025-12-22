import { Hono } from "hono"
import { r2Upload } from "$utils/r2-upload"
import * as AuthMiddleware from "$middlewares/authMiddleware"
import { default as _axios } from "axios"

const StorageRoutes = new Hono()

StorageRoutes.post("/", AuthMiddleware.checkJwt, async (c) => {
	try {
		const body = await c.req.parseBody()
		const file = body["file"]
		const directory = (body["directory"] as string) || "uploads"

		if (!(file instanceof File)) {
			return c.json(
				{
					message: "No file uploaded",
					content: null,
				},
				400,
			)
		}

		// Using r2Upload service
		const result = await r2Upload.uploadImage(file, {
			fileName: file.name,
			folderType: directory,
		})

		return c.json({
			message: "Success upload file",
			content: {
				fileUrl: result.url,
				objectKey: result.key,
			},
		})
	} catch (error: any) {
		console.error(error)
		return c.json(
			{
				message: error.message || "Internal Server Error",
				content: null,
			},
			500,
		)
	}
})

StorageRoutes.delete("/", AuthMiddleware.checkJwt, async (c) => {
	try {
		const body = await c.req.json()
		const key = body["key"] as string

		if (!key) {
			return c.json(
				{
					message: "No key provided",
					content: null,
				},
				400,
			)
		}

		await r2Upload.deleteFile(key)

		return c.json({
			message: "Success delete file",
			content: null,
		})
	} catch (error: any) {
		console.error(error)
		return c.json(
			{
				message: error.message || "Internal Server Error",
				content: null,
			},
			500,
		)
	}
})

export default StorageRoutes

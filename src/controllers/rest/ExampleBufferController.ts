import { BufferData } from "$entities/Buffer"
import * as ExampleBufferService from "$services/ExampleBufferService"
import {
	handleServiceErrorWithResponse,
	MIME_TYPE,
	response_buffer,
} from "$utils/response.utils"
import { Context, TypedResponse } from "hono"

export async function getPDF(c: Context): Promise<Response | TypedResponse> {
	const serviceResponse = await ExampleBufferService.getPDF()
	if (!serviceResponse)
		return handleServiceErrorWithResponse(c, serviceResponse)

	const { buffer, fileName } = serviceResponse.data as BufferData
	return response_buffer(c, fileName, MIME_TYPE.PDF, buffer)
}

export async function getXLSX(c: Context): Promise<Response | TypedResponse> {
	const serviceResponse = await ExampleBufferService.getXLSX()
	if (!serviceResponse)
		return handleServiceErrorWithResponse(c, serviceResponse)

	const { buffer, fileName } = serviceResponse.data as BufferData
	return response_buffer(c, fileName, MIME_TYPE.XLSX, buffer)
}

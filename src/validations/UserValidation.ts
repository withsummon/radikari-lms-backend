import { UserRegisterDTO } from '$entities/User';
import { prisma } from '$pkg/prisma';
import { response_bad_request } from '$utils/response.utils';
import { Context, Next } from "hono";
import * as Helpers from './helper';
import { ErrorStructure } from './helper';
import { UserValidationCreateSchema } from './schema/UserSchema';



export async function validateCreateDTO(c: Context, next: Next) {

    const data: UserRegisterDTO = await c.req.json()

    const invalidFields: ErrorStructure[] = Helpers.validateSchema(UserValidationCreateSchema, data)

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Bad Request", invalidFields);
    }

    const userExist = await prisma.user.findUnique({
        where: {
            email: data.email
        }
    })

    if (userExist != null) {
        invalidFields.push({ field: "email", message: "email already used" })
    }
    if (invalidFields.length > 0) {
        return response_bad_request(c, "Bad Request", invalidFields);
    }

    await next();
}
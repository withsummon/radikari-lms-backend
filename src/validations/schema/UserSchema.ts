import { z } from "zod"
import { Roles } from "../../../generated/prisma/client"
import { ErrorMessages } from "./ErrorMessages"


export const UserValidationCreateSchema = z.strictObject({
    fullName: z.string({ required_error: ErrorMessages.user.fullName.required })
        .min(5, ErrorMessages.user.fullName.min),
    email: z.string({ required_error: ErrorMessages.user.email.required })
        .email(ErrorMessages.user.email.email),
    password: z.string({ required_error: ErrorMessages.user.password.required })
        .min(5, ErrorMessages.user.password.min),
    role: z.nativeEnum(Roles, {
        required_error: ErrorMessages.user.role.required,
        invalid_type_error: ErrorMessages.user.role.invalid
    })
}).strict()


export const UserValidationLoginSchema = z.strictObject({
    email: z.string({ required_error: ErrorMessages.user.email.required })
        .email(ErrorMessages.user.email.email),
    password: z.string({ required_error: ErrorMessages.user.password.required })
        .min(5, ErrorMessages.user.password.min),
}).strict()


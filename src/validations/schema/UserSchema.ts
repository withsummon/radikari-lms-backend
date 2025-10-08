import { z } from "zod"
import { ErrorMessages } from "./ErrorMessages"

export const UserValidationCreateSchema = z
    .strictObject({
        fullName: z
            .string({ required_error: ErrorMessages.user.fullName.required })
            .min(5, ErrorMessages.user.fullName.min),
        email: z
            .string({ required_error: ErrorMessages.user.email.required })
            .email(ErrorMessages.user.email.email),
        password: z
            .string({ required_error: ErrorMessages.user.password.required })
            .min(5, ErrorMessages.user.password.min),
        phoneNumber: z
            .string({ required_error: ErrorMessages.user.phoneNumber.required })
            .min(10, ErrorMessages.user.phoneNumber.min),
    })
    .strict()

export const UserValidationUpdateSchema = z
    .strictObject({
        fullName: z
            .string({ required_error: ErrorMessages.user.fullName.required })
            .min(5, ErrorMessages.user.fullName.min),
        email: z
            .string({ required_error: ErrorMessages.user.email.required })
            .email(ErrorMessages.user.email.email),
        phoneNumber: z
            .string({ required_error: ErrorMessages.user.phoneNumber.required })
            .min(10, ErrorMessages.user.phoneNumber.min),
    })
    .strict()

export const UserValidationLoginSchema = z
    .strictObject({
        email: z
            .string({ required_error: ErrorMessages.user.email.required })
            .email(ErrorMessages.user.email.email),
        password: z
            .string({ required_error: ErrorMessages.user.password.required })
            .min(5, ErrorMessages.user.password.min),
    })
    .strict()

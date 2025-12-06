import { z } from "zod"
import { ErrorMessages } from "./ErrorMessages"

export const UserValidationCreateSchema = z
	.strictObject({
		fullName: z
			.string({
				error: (issue) => (issue.input === undefined ? undefined : undefined),
			})
			.min(5, ErrorMessages.user.fullName.min),
		email: z.string({
			error: (issue) => (issue.input === undefined ? undefined : undefined),
		}),
		password: z
			.string({
				error: (issue) => (issue.input === undefined ? undefined : undefined),
			})
			.min(5, ErrorMessages.user.password.min),
		phoneNumber: z
			.string({
				error: (issue) => (issue.input === undefined ? undefined : undefined),
			})
			.min(10, ErrorMessages.user.phoneNumber.min),
	})
	.strict()

export const UserValidationUpdateSchema = z
	.strictObject({
		fullName: z
			.string({
				error: (issue) => (issue.input === undefined ? undefined : undefined),
			})
			.min(5, ErrorMessages.user.fullName.min),
		email: z.string({
			error: (issue) => (issue.input === undefined ? undefined : undefined),
		}),
		phoneNumber: z
			.string({
				error: (issue) => (issue.input === undefined ? undefined : undefined),
			})
			.min(10, ErrorMessages.user.phoneNumber.min),
	})
	.strict()

export const UserValidationLoginSchema = z
	.strictObject({
		email: z.string({
			error: (issue) => (issue.input === undefined ? undefined : undefined),
		}),
		password: z
			.string({
				error: (issue) => (issue.input === undefined ? undefined : undefined),
			})
			.min(5, ErrorMessages.user.password.min),
	})
	.strict()

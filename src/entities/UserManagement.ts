import { Roles, UserType } from "../../generated/prisma/client"

export interface CreateUserDTO {
	id: string
	fullName: string
	email: string
	password: string
	phoneNumber: string
}

export interface CreateGoogleUserDTO {
	id: string
	fullName: string
	email: string
	password: string
	phoneNumber: string
	role: Roles
	type: UserType
	profilePictureUrl: string
	lastLoginAt: Date
	isActive: boolean
}

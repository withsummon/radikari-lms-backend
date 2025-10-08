import { Roles } from "../../generated/prisma/client"

export interface UserJWTDAO {
    id: string
    email: string
    fullName: string
    role: Roles
    phoneNumber: string
}

export interface UserLoginDTO {
    email: string
    password: string
}

export interface CreateUserDTO {
    id: string
    fullName: string
    email: string
    password: string
    phoneNumber: string
}

export interface UpdateUserDTO extends Omit<CreateUserDTO, "id, password"> {}

// Exclude keys from user
export function exclude<User, Key extends keyof User>(user: User, ...keys: Key[]): Omit<User, Key> {
    for (let key of keys) {
        delete user[key]
    }
    return user
}

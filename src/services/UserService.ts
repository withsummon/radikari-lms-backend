import {
    HandleServiceResponseCustomError,
    ResponseStatus,
    ServiceResponse,
} from "$entities/Service"
import { exclude, CreateUserDTO, UpdateUserDTO } from "$entities/User"
import Logger from "$pkg/logger"
import * as UserRepository from "$repositories/UserRepository"
import * as EzFilter from "@nodewave/prisma-ezfilter"
import { User } from "../../generated/prisma/client"

export type CreateResponse = User | {}
export async function create(data: CreateUserDTO): Promise<ServiceResponse<CreateResponse>> {
    try {
        data.password = await Bun.password.hash(data.password, "argon2id")
        const user = await UserRepository.create(data)
        return {
            status: true,
            data: user,
        }
    } catch (err) {
        Logger.error(`UserService.create`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function getAll(
    filters: EzFilter.FilteringQuery
): Promise<ServiceResponse<EzFilter.PaginatedResult<User[]> | {}>> {
    try {
        const data = await UserRepository.getAll(filters)
        return {
            status: true,
            data,
        }
    } catch (err) {
        Logger.error(`UserService.getAll`, {
            error: err,
        })
        return HandleServiceResponseCustomError(
            "Internal Server Error",
            ResponseStatus.INTERNAL_SERVER_ERROR
        )
    }
}

export async function getById(id: string): Promise<ServiceResponse<User | {}>> {
    try {
        let user = await UserRepository.getById(id)

        if (!user) return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.BAD_REQUEST)

        return {
            status: true,
            data: exclude(user, "password"),
        }
    } catch (err) {
        Logger.error(`UserService.getById`, {
            error: err,
        })
        return HandleServiceResponseCustomError(
            "Internal Server Error",
            ResponseStatus.INTERNAL_SERVER_ERROR
        )
    }
}

export async function update(id: string, data: UpdateUserDTO): Promise<ServiceResponse<User | {}>> {
    try {
        let user = await UserRepository.getById(id)

        if (!user) return HandleServiceResponseCustomError("Invalid ID", ResponseStatus.BAD_REQUEST)

        user = await UserRepository.update(id, data)

        return {
            status: true,
            data: user,
        }
    } catch (err) {
        Logger.error(`UserService.update`, {
            error: err,
        })
        return HandleServiceResponseCustomError(
            "Internal Server Error",
            ResponseStatus.INTERNAL_SERVER_ERROR
        )
    }
}

export async function deleteById(id: string): Promise<ServiceResponse<{}>> {
    try {
        await UserRepository.deleteById(id)

        return {
            status: true,
            data: {},
        }
    } catch (err) {
        Logger.error(`UserService.deleteByIds`, {
            error: err,
        })
        return HandleServiceResponseCustomError(
            "Internal Server Error",
            ResponseStatus.INTERNAL_SERVER_ERROR
        )
    }
}

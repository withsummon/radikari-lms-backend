import {
    HandleServiceResponseCustomError,
    HandleServiceResponseSuccess,
    ServiceResponse,
} from "$entities/Service"
import { exclude, UserJWTDAO, UserLoginDTO } from "$entities/User"
import Logger from "$pkg/logger"
import * as UserRepository from "$repositories/UserRepository"
import jwt from "jsonwebtoken"
import { Roles, User, UserType } from "../../generated/prisma/client"
import { googleOAuth } from "$pkg/oauth/google"
import { google } from "googleapis"
import { ulid } from "ulid"

function createToken(user: User) {
    const jwtPayload = exclude(user, "password") as UserJWTDAO
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET ?? "", { expiresIn: "1d" })
    return token
}

export async function logIn(data: UserLoginDTO): Promise<ServiceResponse<any>> {
    try {
        const { email, password } = data

        const user = await UserRepository.getByEmail(email)

        if (!user || user.type !== "INTERNAL") {
            return HandleServiceResponseCustomError("Invalid credential!", 404)
        }

        const isPasswordVerified = await Bun.password.verify(password, user.password, "argon2id")

        if (isPasswordVerified) {
            const token = createToken(user)
            const responseStructure = {
                user: exclude(user, "password"),
                token,
            }

            Logger.info("AuthService.logIn Success", {
                user: exclude(user, "password"),
            })

            return HandleServiceResponseSuccess(responseStructure)
        } else {
            Logger.info("AuthService.logIn Failed", {
                error: "Invalid credential!",
            })
            return HandleServiceResponseCustomError("Invalid credential!", 404)
        }
    } catch (err) {
        Logger.error(`AuthService.login`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export function verifyToken(token: string): ServiceResponse<any> {
    try {
        try {
            const JWT_SECRET = process.env.JWT_SECRET || ""
            jwt.verify(token, JWT_SECRET)
            return {
                status: true,
                data: {},
            }
        } catch (err) {
            return HandleServiceResponseCustomError("Invalid Token", 403)
        }
    } catch (err) {
        Logger.error(`AuthService.verifyToken`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
): Promise<ServiceResponse<any>> {
    try {
        const user = await UserRepository.getById(userId)

        if (!user) {
            return HandleServiceResponseCustomError("Invalid User ID!", 400)
        }

        const match = await Bun.password.verify(oldPassword, user.password, "argon2id")

        if (!match) {
            return HandleServiceResponseCustomError("Incorrect Old Password!", 400)
        }

        const hashedNewPassword = await Bun.password.hash(newPassword, "argon2id")

        await UserRepository.updatePassword(userId, hashedNewPassword)

        return HandleServiceResponseSuccess({})
    } catch (err) {
        Logger.error(`AuthService.changePassword`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

export async function googleCallback(code: string): Promise<ServiceResponse<any>> {
    try {
        const { tokens } = await googleOAuth.getToken(code)
        googleOAuth.setCredentials(tokens)
        const oauth2Client = google.oauth2({
            auth: googleOAuth,
            version: "v2",
        })
        const data = await oauth2Client.userinfo.get()

        if (data.status != 200) {
            return HandleServiceResponseCustomError("Invalid Google Token", 400)
        }

        let user = await UserRepository.getByEmail(data.data.email!)

        if (!user) {
            user = await UserRepository.createGoogleUser({
                id: ulid(),
                email: data.data.email!,
                fullName: data.data.name!,
                password: "",
                phoneNumber: "",
                role: Roles.USER,
                type: UserType.GOOGLE,
                profilePictureUrl: data.data.picture ?? "",
            })
        }

        const token = createToken(user)

        return HandleServiceResponseSuccess({
            user: exclude(user, "password"),
            token,
        })
    } catch (err) {
        Logger.error(`AuthService.googleCallback`, {
            error: err,
        })
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}

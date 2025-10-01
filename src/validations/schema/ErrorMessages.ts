import { Roles } from "../../../generated/prisma/client";

export const ErrorMessages = {
    user: {
        fullName: {
            required: "Full name is required",
            min: "Full name must be at least 5 characters long",
        },
        email: {
            required: "Email is required",
            email: "Invalid email address",
        },
        password: {
            required: "Password is required",
            min: "Password must be at least 5 characters long",
        },
        role: {
            required: "Role is required",
            invalid: `Invalid role, must be one of ${Object.values(Roles).join(", ")}`,
        }
    }
}
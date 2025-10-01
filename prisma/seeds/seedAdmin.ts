import { ulid } from 'ulid';
import { PrismaClient, Roles } from '../../generated/prisma/client';

export async function seedAdmin(prisma: PrismaClient) {
    console.log("Starting seedAdmin function...");
    // Check admin count
    let countAdmin = 0;
    try {
        console.log("Counting admin users...");
        countAdmin = await prisma.user.count({
            where: {
                role: "ADMIN"
            }
        });
        console.log("Admin count:", countAdmin);
    } catch (error) {
        console.error("Failed to count admin users:", error);
        throw error;
    }

    // Check user count
    let countUser = 0;
    try {
        console.log("Counting regular users...");
        countUser = await prisma.user.count({
            where: {
                role: "USER"
            }
        });
        console.log("User count:", countUser);
    } catch (error) {
        console.error("Failed to count regular users:", error);
        throw error;
    }

    // Create admin if needed
    if (countAdmin === 0) {
        try {

            const hashedPassword = await Bun.password.hash("admin123", "argon2id");
            console.log("Creating admin user...");
            await prisma.user.create({
                data: {
                    id: ulid(),
                    fullName: "Admin",
                    password: hashedPassword,
                    email: "admin@test.com",
                    role: Roles.ADMIN
                }
            });
            console.log("Admin user created successfully");
        } catch (error) {
            console.error("Failed to create admin user:", error);
            throw error;
        }
    }

    // Create regular user if needed
    if (countUser === 0) {
        try {
            const hashedPassword = await Bun.password.hash("user123", "argon2id");
            console.log("Creating regular user...");
            await prisma.user.create({
                data: {
                    id: ulid(),
                    fullName: "User",
                    password: hashedPassword,
                    email: "user@test.com",
                    role: Roles.USER
                }
            });
            console.log("Regular user created successfully");
        } catch (error) {
            console.error("Failed to create regular user:", error);
            throw error;
        }
    }

    console.log("seedAdmin function completed successfully");

}
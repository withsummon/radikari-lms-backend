import * as Graceful from "$pkg/graceful"
import { PrismaClient } from "../../../generated/prisma/client"
import { ulidExtension } from "./extension"

export class PrismaInstance {
	private static instance: PrismaInstance
	private prisma: PrismaClient

	private constructor() {
		this.prisma = new PrismaClient({
			log: [
				{
					emit: "stdout",
					level: "query",
				},
				{
					emit: "stdout",
					level: "error",
				},
				{
					emit: "stdout",
					level: "info",
				},
				{
					emit: "stdout",
					level: "warn",
				},
			],
		})

		Graceful.registerProcessForShutdown("prisma-sql-connection", () => {
			this.prisma.$disconnect()
		})

		this.prisma = this.prisma.$extends(ulidExtension) as PrismaClient
	}

	public static getInstance(): PrismaInstance {
		if (!PrismaInstance.instance) {
			PrismaInstance.instance = new PrismaInstance()
		}
		return PrismaInstance.instance
	}

	public getPrismaClient(): PrismaClient {
		return this.prisma
	}
}

export const prisma: PrismaClient =
	PrismaInstance.getInstance().getPrismaClient()

import { prisma } from "$pkg/prisma"
import { OperationDTO } from "$entities/Operation"
import { ulid } from "ulid"

export async function create(data: OperationDTO) {
	return await prisma.operation.create({
		data: {
			id: data.id || ulid(),
			name: data.name,
			description: data.description,
			headOfOperationUserId: data.headOfOperationUserId,
		},
	})
}

export async function findByName(name: string) {
	return await prisma.operation.findFirst({
		where: { name },
	})
}

export async function findFirst() {
	return await prisma.operation.findFirst()
}

export async function getById(id: string) {
	return await prisma.operation.findUnique({
		where: { id },
	})
}

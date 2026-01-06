import { z } from "zod";

export const OperationSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, { message: "Name is required" }),
	description: z.string().min(1, { message: "Description is required" }),
	headOfOperationUserId: z
		.string()
		.min(1, { message: "Head of Operation is required" }),
});

export type OperationDTO = z.infer<typeof OperationSchema>;

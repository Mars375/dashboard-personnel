// Schéma de validation Zod pour les todos

import { z } from "zod";

export const todoSchema = z.object({
	title: z
		.string()
		.min(1, { message: "Le titre est requis" })
		.max(200, { message: "Le titre ne peut pas dépasser 200 caractères" }),
	description: z.string().optional(),
	dueDate: z.string().refine(
		(val) => !val || !isNaN(Date.parse(val)),
		{ message: "Date invalide" }
	).optional(),
	priority: z.enum(["low", "medium", "high"]).optional(),
});

export type TodoFormData = z.infer<typeof todoSchema>;

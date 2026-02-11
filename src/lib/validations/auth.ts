// Schémas de validation Zod pour l'authentification

import { z } from "zod";

// Messages d'erreur communs (français, amical mais précis)
const commonErrors = {
	required: (field: string) => `${field} est requis`,
	email: "Format d'email invalide",
	minLength: (min: number) => `Au moins ${min} caractères requis`,
	password: "Doit contenir une majuscule, une minuscule, un chiffre",
};

export const loginSchema = z.object({
	email: z
		.string()
		.min(1, { message: commonErrors.required("Email") })
		.email({ message: commonErrors.email }),
	password: z
		.string()
		.min(1, { message: commonErrors.required("Mot de passe") }),
});

export const registerSchema = z.object({
	email: z
		.string()
		.min(1, { message: commonErrors.required("Email") })
		.email({ message: commonErrors.email }),
	password: z
		.string()
		.min(8, { message: commonErrors.minLength(8) })
		.regex(/[A-Z]/, { message: "Doit contenir une majuscule" })
		.regex(/[a-z]/, { message: "Doit contenir une minuscule" })
		.regex(/[0-9]/, { message: "Doit contenir un chiffre" }),
	confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
	message: "Les mots de passe ne correspondent pas",
	path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

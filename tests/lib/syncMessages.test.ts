/**
 * Tests pour les messages de synchronisation (Phase 2)
 */

import { describe, it, expect } from "vitest";
import { syncMessages, syncWarnings, getSyncError } from "@/lib/syncMessages";

describe("syncMessages (Phase 2)", () => {
	describe("syncMessages", () => {
		it("should create task created message", () => {
			const message = syncMessages.taskCreated("Ma tâche", "Pro");

			expect(message.title).toBe("Tâche synchronisée");
			expect(message.description).toContain("Ma tâche");
			expect(message.description).toContain("Pro");
		});

		it("should create task updated message", () => {
			const message = syncMessages.taskUpdated("Ma tâche");

			expect(message.title).toBe("Tâche mise à jour");
			expect(message.description).toContain("Ma tâche");
		});

		it("should create task completed message", () => {
			const message = syncMessages.taskCompleted("Ma tâche", true);

			expect(message.title).toBe("Tâche synchronisée");
			expect(message.description).toContain("complétée");
		});

		it("should create task deleted message", () => {
			const message = syncMessages.taskDeleted("Ma tâche", "Perso");

			expect(message.title).toBe("Tâche supprimée");
			expect(message.description).toContain("supprimée");
			expect(message.description).toContain("Perso");
		});

		it("should create tasks synced message", () => {
			const message = syncMessages.tasksSynced(5, "Pro");

			expect(message.title).toBe("Synchronisation réussie");
			expect(message.description).toContain("5");
			expect(message.description).toContain("Pro");
		});

		it("should create sync completed message", () => {
			const message = syncMessages.syncCompleted();

			expect(message.title).toBe("Synchronisation terminée");
			expect(message.description).toBeDefined();
		});
	});

	describe("syncWarnings", () => {
		it("should create no Google ID warning", () => {
			const warning = syncWarnings.noGoogleIdReturned("Ma tâche");

			expect(warning.title).toBe("Synchronisation partielle");
			expect(warning.description).toContain("Ma tâche");
		});

		it("should create task not found warning", () => {
			const warning = syncWarnings.taskNotFound("Ma tâche");

			expect(warning.title).toBe("Tâche non trouvée");
			expect(warning.description).toContain("Ma tâche");
		});

		it("should create task deleted locally warning", () => {
			const warning = syncWarnings.taskDeletedLocally("Raison de suppression");

			expect(warning.title).toBe("Tâche supprimée localement");
			expect(warning.description).toBe("Raison de suppression");
		});
	});

	describe("getSyncError", () => {
		it("should handle authentication errors", () => {
			const error = getSyncError(new Error("Token invalide"));

			expect(error.title).toBe("Authentification requise");
			expect(error.description).toContain("expiré");
		});

		it("should handle network errors", () => {
			const error = getSyncError(new Error("Network error"));

			expect(error.title).toBe("Erreur réseau");
			expect(error.description).toContain("connexion");
		});

		it("should handle rate limit errors", () => {
			const error = getSyncError(new Error("Rate limit exceeded"));

			expect(error.title).toBe("Limite atteinte");
			expect(error.description).toContain("Trop de requêtes");
		});

		it("should handle not found errors", () => {
			const error = getSyncError(new Error("Not found"));

			expect(error.title).toBe("Erreur de synchronisation");
		});

		it("should handle permission errors", () => {
			const error = getSyncError(new Error("Permission denied"));

			expect(error.title).toBe("Permission refusée");
		});

		it("should handle validation errors", () => {
			const error = getSyncError(new Error("Validation error"));

			expect(error.title).toBe("Données invalides");
		});

		it("should handle server errors", () => {
			const error = getSyncError(new Error("Internal server error"));

			expect(error.title).toBe("Erreur de synchronisation");
		});

		it("should handle unknown errors", () => {
			const error = getSyncError(new Error("Unknown error"));

			expect(error.title).toBe("Erreur de synchronisation");
			expect(error.description).toContain("Unknown error");
		});

		it("should handle non-Error objects", () => {
			const error = getSyncError("String error");

			expect(error.title).toBe("Erreur inattendue");
		});
	});
});


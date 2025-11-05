// Stockage sécurisé des tokens OAuth

import type { OAuthProvider, OAuthConnection } from "./types";
import { logger } from "@/lib/logger";

const STORAGE_PREFIX = "oauth:";
const STORAGE_KEY_CONNECTIONS = "oauth:connections";

/**
 * Stocke les tokens OAuth de manière sécurisée
 * Pour MVP : localStorage (simple)
 * Pour production : localStorage crypté ou backend API
 */
export class TokenStorage {
	/**
	 * Sauvegarde une connexion OAuth
	 */
	static saveConnection(connection: OAuthConnection): void {
		try {
			const connections = this.getAllConnections();
			const existingIndex = connections.findIndex(
				(c) => c.provider === connection.provider,
			);
			if (existingIndex >= 0) {
				connections[existingIndex] = connection;
			} else {
				connections.push(connection);
			}
			localStorage.setItem(STORAGE_KEY_CONNECTIONS, JSON.stringify(connections));
		} catch (error) {
			logger.error("Erreur lors de la sauvegarde de la connexion:", error);
		}
	}

	/**
	 * Récupère une connexion OAuth pour un provider
	 */
	static getConnection(provider: OAuthProvider): OAuthConnection | null {
		try {
			const connections = this.getAllConnections();
			return connections.find((c) => c.provider === provider) || null;
		} catch {
			return null;
		}
	}

	/**
	 * Récupère toutes les connexions OAuth
	 */
	static getAllConnections(): OAuthConnection[] {
		try {
			const stored = localStorage.getItem(STORAGE_KEY_CONNECTIONS);
			if (!stored) return [];
			return JSON.parse(stored) as OAuthConnection[];
		} catch {
			return [];
		}
	}

	/**
	 * Supprime une connexion OAuth
	 */
	static removeConnection(provider: OAuthProvider): void {
		try {
			const connections = this.getAllConnections();
			const filtered = connections.filter((c) => c.provider !== provider);
			localStorage.setItem(STORAGE_KEY_CONNECTIONS, JSON.stringify(filtered));
		} catch (error) {
			logger.error("Erreur lors de la suppression de la connexion:", error);
		}
	}

	/**
	 * Vérifie si un token est expiré
	 */
	static isTokenExpired(connection: OAuthConnection): boolean {
		if (!connection.tokens.expiresAt) return false;
		// Marge de 5 minutes avant l'expiration
		const margin = 5 * 60 * 1000; // 5 minutes
		return Date.now() >= connection.tokens.expiresAt - margin;
	}

	/**
	 * Met à jour les tokens d'une connexion
	 */
	static updateTokens(
		provider: OAuthProvider,
		tokens: Partial<OAuthConnection["tokens"]>,
	): void {
		const connection = TokenStorage.getConnection(provider);
		if (!connection) {
			throw new Error(`Aucune connexion trouvée pour ${provider}`);
		}
		connection.tokens = { ...connection.tokens, ...tokens };
		connection.lastSyncAt = Date.now();
		TokenStorage.saveConnection(connection);
	}
}


// Script de migration des tokens OAuth depuis localStorage vers cookies HttpOnly
// Cette migration automatique améliore la sécurité XSS

import { logger } from "@/lib/logger";

interface LegacyTokens {
	access_token: string;
	refresh_token?: string;
	expires_in?: number;
	token_type?: string;
	scope?: string;
}

/**
 * Tente de migrer les tokens avec retry exponentiel
 * @param provider - Provider OAuth (google, microsoft, notion)
 * @param tokens - Tokens à migrer
 * @returns true si succès, false sinon
 */
async function migrateWithRetry(
	provider: string,
	tokens: LegacyTokens,
): Promise<boolean> {
	const maxAttempts = 3;
	let attempt = 0;

	while (attempt < maxAttempts) {
		try {
			const response = await fetch('http://localhost:3001/api/oauth/migrate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ provider, tokens }),
			});

			if (response.ok) {
				return true;
			}

			attempt++;
			if (attempt >= maxAttempts) {
				logger.error(`Migration failed after ${maxAttempts} attempts for ${provider}`);
				return false;
			}

			// Backoff exponentiel: 1s, 2s, 4s
			const delay = Math.pow(2, attempt) * 1000;
			await new Promise((resolve) => setTimeout(resolve, delay));
		} catch (error) {
			logger.error(`Migration attempt ${attempt + 1} failed for ${provider}:`, error);
			attempt++;
			if (attempt >= maxAttempts) {
				return false;
			}
			const delay = Math.pow(2, attempt) * 1000;
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	return false;
}

/**
 * Migre tous les tokens OAuth depuis localStorage vers des cookies HttpOnly
 * @returns true si au moins une migration a réussi
 */
export async function migrateTokens(): Promise<boolean> {
	const providers = ['google', 'microsoft', 'notion'];
	let anyMigrated = false;

	for (const provider of providers) {
		try {
			// Récupérer les connections depuis TokenStorage
			const connectionsKey = 'oauth:connections';
			const connectionsData = localStorage.getItem(connectionsKey);

			if (!connectionsData) {
				continue;
			}

			const connections = JSON.parse(connectionsData);
			const connection = connections.find((c: { provider: string }) => c.provider === provider);

			if (!connection || !connection.tokens) {
				continue;
			}

			const success = await migrateWithRetry(provider, connection.tokens);

			if (success) {
				// Supprimer les tokens du localStorage après migration réussie
				const updatedConnections = connections.filter(
					(c: { provider: string }) => c.provider !== provider
				);
				localStorage.setItem(connectionsKey, JSON.stringify(updatedConnections));

				logger.info(`✅ Successfully migrated ${provider} tokens to cookies`);
				anyMigrated = true;
			}
		} catch (error) {
			logger.error(`Failed to migrate ${provider} tokens:`, error);
		}
	}

	return anyMigrated;
}

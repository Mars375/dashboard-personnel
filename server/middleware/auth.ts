// Middleware pour l'extraction de tokens OAuth depuis les cookies HttpOnly

import { Request } from 'express';

export interface AuthTokens {
	access_token?: string;
	refresh_token?: string;
	expires_in?: number;
	token_type?: string;
	scope?: string;
}

/**
 * Extrait les tokens OAuth depuis les cookies HttpOnly
 * Utilisé par le serveur pour faire des requêtes authentifiées auprès des providers OAuth
 */
export function extractTokens(req: Request): AuthTokens {
	const cookieHeader = req.headers.cookie;
	if (!cookieHeader) {
		return {};
	}

	// Parser les cookies manuellement (pas de dépendance 'cookie' nécessaire)
	const cookies: Record<string, string> = {};
	cookieHeader.split(';').forEach((cookie) => {
		const [name, value] = cookie.trim().split('=');
		if (name && value) {
			cookies[name] = value;
		}
	});

	const authData = cookies['auth_tokens'];

	if (!authData) {
		return {};
	}

	try {
		// Décoder les données du cookie (URL encoded)
		const decoded = decodeURIComponent(authData);
		return JSON.parse(decoded) as AuthTokens;
	} catch {
		return {};
	}
}

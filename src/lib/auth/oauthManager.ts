// Gestionnaire OAuth centralisé

import type {
	OAuthProvider,
	OAuthConnection,
	OAuthService,
	OAuthUser,
	OAuthTokens,
} from "./types";
import { TokenStorage } from "./tokenStorage";
import { GoogleAuth, type GoogleAuthConfig } from "./googleAuth";
import { MicrosoftAuth, type MicrosoftAuthConfig } from "./microsoftAuth";
import { NotionAuth, type NotionAuthConfig } from "./notionAuth";
import { logger } from "@/lib/logger";

export interface OAuthManagerConfig {
	google?: GoogleAuthConfig;
	microsoft?: MicrosoftAuthConfig;
	notion?: NotionAuthConfig;
}

export class OAuthManager {
	private googleAuth?: GoogleAuth;
	private microsoftAuth?: MicrosoftAuth;
	private notionAuth?: NotionAuth;

	constructor(config: OAuthManagerConfig) {
		if (config.google) {
			this.googleAuth = new GoogleAuth(config.google);
		}
		if (config.microsoft) {
			this.microsoftAuth = new MicrosoftAuth(config.microsoft);
		}
		if (config.notion) {
			this.notionAuth = new NotionAuth(config.notion);
		}
	}

	/**
	 * Connecte un utilisateur à un provider OAuth
	 */
	async connect(
		provider: OAuthProvider,
		service: OAuthService,
	): Promise<OAuthConnection> {
		let tokens: OAuthTokens;
		let user: OAuthUser | undefined;

		switch (provider) {
			case "google": {
				if (!this.googleAuth) {
					throw new Error("Google Auth n'est pas configuré");
				}
				tokens = await this.googleAuth.authenticate(service);
				try {
					user = await this.googleAuth.getUserInfo(tokens.accessToken);
				} catch (error) {
					logger.warn("Impossible de récupérer les infos utilisateur:", error);
				}
				break;
			}
			case "microsoft": {
				if (!this.microsoftAuth) {
					throw new Error("Microsoft Auth n'est pas configuré");
				}
				tokens = await this.microsoftAuth.authenticate(service);
				try {
					user = await this.microsoftAuth.getUserInfo(tokens.accessToken);
				} catch (error) {
					logger.warn("Impossible de récupérer les infos utilisateur:", error);
				}
				break;
			}
			case "notion": {
				if (!this.notionAuth) {
					throw new Error("Notion Auth n'est pas configuré");
				}
				tokens = await this.notionAuth.authenticate();
				try {
					user = await this.notionAuth.getUserInfo(tokens.accessToken);
				} catch (error) {
					logger.warn("Impossible de récupérer les infos utilisateur:", error);
				}
				break;
			}
			default:
				throw new Error(`Provider non supporté: ${provider}`);
		}

		const connection: OAuthConnection = {
			provider,
			tokens,
			user,
			connectedAt: Date.now(),
		};

		TokenStorage.saveConnection(connection);
		return connection;
	}

	/**
	 * Déconnecte un utilisateur d'un provider
	 */
	async disconnect(provider: OAuthProvider): Promise<void> {
		TokenStorage.removeConnection(provider);
	}

	/**
	 * Vérifie si un provider est connecté
	 */
	isConnected(provider: OAuthProvider): boolean {
		return TokenStorage.getConnection(provider) !== null;
	}

	/**
	 * Récupère une connexion active
	 */
	getConnection(provider: OAuthProvider): OAuthConnection | null {
		return TokenStorage.getConnection(provider);
	}

	/**
	 * Récupère toutes les connexions actives
	 */
	getAllConnections(): OAuthConnection[] {
		return TokenStorage.getAllConnections();
	}

	/**
	 * Récupère un access token valide (rafraîchit si nécessaire)
	 */
	async getValidAccessToken(provider: OAuthProvider): Promise<string> {
		const connection = TokenStorage.getConnection(provider);
		if (!connection) {
			throw new Error(`Aucune connexion trouvée pour ${provider}`);
		}

		// Vérifier si le token est expiré
		if (!TokenStorage.isTokenExpired(connection)) {
			return connection.tokens.accessToken;
		}

		// Rafraîchir le token
		if (!connection.tokens.refreshToken) {
			throw new Error(
				`Token expiré et aucun refresh token disponible pour ${provider}. Veuillez vous reconnecter.`,
			);
		}

		let refreshedTokens: OAuthTokens;

		try {
			switch (provider) {
				case "google": {
					if (!this.googleAuth) {
						throw new Error("Google Auth n'est pas configuré");
					}
					refreshedTokens = await this.googleAuth.refreshAccessToken(
						connection.tokens.refreshToken,
					);
					break;
				}
				case "microsoft": {
					if (!this.microsoftAuth) {
						throw new Error("Microsoft Auth n'est pas configuré");
					}
					refreshedTokens = await this.microsoftAuth.refreshAccessToken(
						connection.tokens.refreshToken,
					);
					break;
				}
				case "notion": {
					// Notion n'utilise pas de refresh token standard
					throw new Error(
						"Les tokens Notion doivent être rafraîchis manuellement",
					);
				}
				default:
					throw new Error(`Provider non supporté: ${provider}`);
			}

			// Mettre à jour les tokens
			TokenStorage.updateTokens(provider, refreshedTokens);

			return refreshedTokens.accessToken;
		} catch (error) {
			// Si le refresh token est invalide ou expiré, supprimer la connexion et demander une nouvelle authentification
			if (error instanceof Error && (
				error.message.includes("Token invalide") ||
				error.message.includes("expiré") ||
				error.message.includes("reconnecter")
			)) {
				// Supprimer la connexion invalide
				TokenStorage.removeConnection(provider);
				throw new Error(
					`Session expirée. Veuillez vous reconnecter à ${provider}.`
				);
			}
			throw error;
		}
	}

	/**
	 * Initialise le manager avec les configurations depuis les variables d'environnement
	 */
	static createFromEnv(): OAuthManager {
		const config: OAuthManagerConfig = {};

		// Google
		const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
		const googleRedirectUri =
			import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/oauth/google/callback`;

		if (googleClientId) {
			config.google = {
				clientId: googleClientId,
				redirectUri: googleRedirectUri,
				scopes: [
					"https://www.googleapis.com/auth/userinfo.email",
					"https://www.googleapis.com/auth/calendar",
					"https://www.googleapis.com/auth/calendar.events",
					"https://www.googleapis.com/auth/tasks",
				],
			};
		}

		// Microsoft
		const microsoftClientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
		const microsoftRedirectUri =
			import.meta.env.VITE_MICROSOFT_REDIRECT_URI ||
			`${window.location.origin}/oauth/microsoft/callback`;

		if (microsoftClientId) {
			config.microsoft = {
				clientId: microsoftClientId,
				redirectUri: microsoftRedirectUri,
				scopes: ["User.Read", "Calendars.ReadWrite", "offline_access"],
				tenant: import.meta.env.VITE_MICROSOFT_TENANT || "common",
			};
		}

		// Notion
		const notionClientId = import.meta.env.VITE_NOTION_CLIENT_ID;
		const notionRedirectUri =
			import.meta.env.VITE_NOTION_REDIRECT_URI ||
			`${window.location.origin}/oauth/notion/callback`;

		if (notionClientId) {
			config.notion = {
				clientId: notionClientId,
				redirectUri: notionRedirectUri,
			};
		}

		return new OAuthManager(config);
	}
}

// Instance globale
let oauthManagerInstance: OAuthManager | null = null;

/**
 * Récupère ou crée l'instance globale du OAuthManager
 */
export function getOAuthManager(): OAuthManager {
	if (!oauthManagerInstance) {
		oauthManagerInstance = OAuthManager.createFromEnv();
	}
	return oauthManagerInstance;
}


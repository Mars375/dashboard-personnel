// Provider OAuth pour Google (Calendar, Tasks, etc.)

import type {
	OAuthConfig,
	OAuthTokens,
	OAuthUser,
	OAuthService,
} from "./types";
import { TokenStorage } from "./tokenStorage";

export interface GoogleAuthConfig {
	clientId: string;
	redirectUri: string;
	scopes: string[];
}

export class GoogleAuth {
	private config: GoogleAuthConfig;

	constructor(config: GoogleAuthConfig) {
		this.config = config;
	}

	/**
	 * Ouvre la fenêtre OAuth Google
	 */
	async authenticate(service: OAuthService = "google-calendar"): Promise<OAuthTokens> {
		return new Promise((resolve, reject) => {
			const authUrl = this.buildAuthUrl(service);
			const width = 500;
			const height = 600;
			const left = window.screenX + (window.outerWidth - width) / 2;
			const top = window.screenY + (window.outerHeight - height) / 2;

			const popup = window.open(
				authUrl,
				"Google OAuth",
				`width=${width},height=${height},left=${left},top=${top}`,
			);

			if (!popup) {
				reject(new Error("Popup bloquée. Veuillez autoriser les popups."));
				return;
			}

			// Écouter le message du callback
			const messageHandler = (event: MessageEvent) => {
				// Vérifier l'origine pour la sécurité
				if (event.origin !== window.location.origin) return;

				if (event.data.type === "OAUTH_SUCCESS") {
					const tokens: OAuthTokens = {
						accessToken: event.data.accessToken,
						refreshToken: event.data.refreshToken,
						expiresAt: event.data.expiresAt
							? Date.now() + event.data.expiresAt * 1000
							: undefined,
						tokenType: event.data.tokenType || "Bearer",
						scope: event.data.scope,
					};

					window.removeEventListener("message", messageHandler);
					popup.close();
					resolve(tokens);
				} else if (event.data.type === "OAUTH_ERROR") {
					window.removeEventListener("message", messageHandler);
					popup.close();
					reject(new Error(event.data.error || "Erreur d'authentification"));
				}
			};

			window.addEventListener("message", messageHandler);

			// Timeout après 5 minutes
			setTimeout(() => {
				window.removeEventListener("message", messageHandler);
				if (!popup.closed) {
					popup.close();
					reject(new Error("Authentification expirée"));
				}
			}, 5 * 60 * 1000);
		});
	}

	/**
	 * Rafraîchit un access token avec le refresh token
	 */
	async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
		try {
			const response = await fetch("https://oauth2.googleapis.com/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					client_id: this.config.clientId,
					refresh_token: refreshToken,
					grant_type: "refresh_token",
				}),
			});

			if (!response.ok) {
				throw new Error("Erreur lors du rafraîchissement du token");
			}

			const data = await response.json();

			return {
				accessToken: data.access_token,
				refreshToken: data.refresh_token || refreshToken, // Garder l'ancien si non fourni
				expiresAt: data.expires_in
					? Date.now() + data.expires_in * 1000
					: undefined,
				tokenType: data.token_type || "Bearer",
				scope: data.scope,
			};
		} catch (error) {
			throw new Error(
				`Erreur lors du rafraîchissement du token: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Récupère les informations de l'utilisateur Google
	 */
	async getUserInfo(accessToken: string): Promise<OAuthUser> {
		try {
			const response = await fetch(
				"https://www.googleapis.com/oauth2/v2/userinfo",
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				},
			);

			if (!response.ok) {
				throw new Error("Erreur lors de la récupération des infos utilisateur");
			}

			const data = await response.json();

			return {
				id: data.id,
				email: data.email,
				name: data.name,
				picture: data.picture,
			};
		} catch (error) {
			throw new Error(
				`Erreur lors de la récupération des infos utilisateur: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Construit l'URL d'authentification OAuth
	 */
	private buildAuthUrl(service: OAuthService): string {
		const scopes = this.getScopesForService(service);
		const params = new URLSearchParams({
			client_id: this.config.clientId,
			redirect_uri: this.config.redirectUri,
			response_type: "code",
			scope: scopes.join(" "),
			access_type: "offline", // Pour obtenir un refresh token
			prompt: "consent", // Forcer le consentement pour obtenir un nouveau refresh token
		});

		return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
	}

	/**
	 * Retourne les scopes nécessaires pour un service
	 */
	private getScopesForService(service: OAuthService): string[] {
		const baseScopes = ["https://www.googleapis.com/auth/userinfo.email"];

		switch (service) {
			case "google-calendar":
				return [
					...baseScopes,
					"https://www.googleapis.com/auth/calendar",
					"https://www.googleapis.com/auth/calendar.events",
				];
			case "google-tasks":
				return [
					...baseScopes,
					"https://www.googleapis.com/auth/tasks",
				];
			default:
				return baseScopes;
		}
	}

	/**
	 * Échange un code d'autorisation contre des tokens
	 * Cette méthode est généralement appelée par le callback OAuth
	 */
	async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
		// NOTE: En production, cette opération devrait être faite côté backend
		// car elle nécessite le client_secret qui ne doit pas être exposé côté client
		// Pour MVP, on peut utiliser un backend proxy ou Firebase Functions

		// Placeholder - À implémenter avec un backend
		throw new Error(
			"exchangeCodeForTokens doit être implémenté côté backend pour des raisons de sécurité",
		);
	}
}


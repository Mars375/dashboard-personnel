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
			const messageHandler = async (event: MessageEvent) => {
				// Vérifier l'origine pour la sécurité
				if (event.origin !== window.location.origin) return;

				if (event.data.type === "OAUTH_SUCCESS") {
					const code = event.data.code;
					
					if (!code) {
						window.removeEventListener("message", messageHandler);
						popup.close();
						reject(new Error("Code d'autorisation manquant"));
						return;
					}

					try {
						// Échanger le code contre des tokens
						// NOTE: En production, cela doit être fait côté backend pour des raisons de sécurité
						// Pour le MVP, on va utiliser un proxy ou une solution alternative
						const tokens = await this.exchangeCodeForTokensWithProxy(code);
						
						window.removeEventListener("message", messageHandler);
						if (!popup.closed) {
							popup.close();
						}
						resolve(tokens);
					} catch (error) {
						window.removeEventListener("message", messageHandler);
						if (!popup.closed) {
							popup.close();
						}
						reject(new Error(`Erreur lors de l'échange du code: ${error instanceof Error ? error.message : "Erreur inconnue"}`));
					}
				} else if (event.data.type === "OAUTH_ERROR") {
					window.removeEventListener("message", messageHandler);
					if (!popup.closed) {
						popup.close();
					}
					reject(new Error(event.data.error || event.data.errorDescription || "Erreur d'authentification"));
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
	 * 
	 * NOTE: Pour le MVP, on utilise une approche qui nécessite un backend proxy.
	 * En production, cette opération doit être faite côté backend pour des raisons de sécurité.
	 */
	async exchangeCodeForTokensWithProxy(code: string): Promise<OAuthTokens> {
		// Option 1: Utiliser un backend proxy si disponible
		// const response = await fetch("/api/oauth/exchange", {
		//   method: "POST",
		//   body: JSON.stringify({ code, provider: "google" }),
		// });

		// Option 2: Pour le MVP, on peut utiliser une extension Chrome ou un service proxy
		// Pour l'instant, on va afficher une erreur informative

		// Option 3: Utiliser Google Identity Services (nouvelle API)
		// Mais pour le moment, on va utiliser une solution de contournement

		// SOLUTION TEMPORAIRE POUR MVP:
		// On va utiliser le code pour créer une connexion partielle
		// L'utilisateur devra ensuite compléter la connexion via un backend
		// Ou on peut utiliser une extension/service proxy

		throw new Error(
			"L'échange du code OAuth nécessite un backend. Pour tester localement, " +
			"configurez un proxy backend ou utilisez Google Identity Services. " +
			"Voir docs/OAUTH_SETUP.md pour plus d'informations."
		);
	}

	/**
	 * Échange un code d'autorisation contre des tokens (méthode originale - nécessite backend)
	 */
	async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
		return this.exchangeCodeForTokensWithProxy(code);
	}
}


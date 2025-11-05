// Provider OAuth pour Google (Calendar, Tasks, etc.)

import type {
	OAuthConfig,
	OAuthTokens,
	OAuthUser,
	OAuthService,
} from "./types";
import { TokenStorage } from "./tokenStorage";
import { logger } from "@/lib/logger";

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

			// Flags pour gérer l'état de l'authentification
			let isExchanging = false;
			let isResolved = false;
			let checkPopupClosed: NodeJS.Timeout | null = null;
			
			// Nettoyer les listeners et interval
			const cleanup = () => {
				window.removeEventListener("message", messageHandler);
				if (checkPopupClosed) {
					clearInterval(checkPopupClosed);
					checkPopupClosed = null;
				}
			};
			
			// Écouter le message du callback
			const messageHandler = async (event: MessageEvent) => {
				// Vérifier l'origine pour la sécurité
				if (event.origin !== window.location.origin) return;

				if (event.data.type === "OAUTH_SUCCESS") {
				// Protection contre les appels multiples
				if (isExchanging || isResolved) {
					logger.warn("⚠️ Tentative d'échange du code déjà en cours, ignorée");
					return;
				}
					
					isExchanging = true;
					const code = event.data.code;
					
					if (!code) {
						isExchanging = false;
						cleanup();
						if (!popup.closed) {
							popup.close();
						}
						reject(new Error("Code d'autorisation manquant"));
						return;
					}

					try {
						// Échanger le code contre des tokens
						// NOTE: En production, cela doit être fait côté backend pour des raisons de sécurité
						// Pour le MVP, on va utiliser un proxy ou une solution alternative
						const tokens = await this.exchangeCodeForTokensWithProxy(code);
						
						isResolved = true;
						cleanup();
						if (!popup.closed) {
							popup.close();
						}
						resolve(tokens);
					} catch (error) {
						isExchanging = false;
						cleanup();
						if (!popup.closed) {
							popup.close();
						}
						reject(new Error(`Erreur lors de l'échange du code: ${error instanceof Error ? error.message : "Erreur inconnue"}`));
					}
				} else if (event.data.type === "OAUTH_ERROR") {
					// Réinitialiser le flag même en cas d'erreur
					isExchanging = false;
					cleanup();
					if (!popup.closed) {
						popup.close();
					}
					const errorMsg = event.data.error || event.data.errorDescription || "Erreur d'authentification";
					reject(new Error(errorMsg));
				}
			};

			window.addEventListener("message", messageHandler);

			// Vérifier périodiquement si la popup est fermée par l'utilisateur (annulation)
			checkPopupClosed = setInterval(() => {
				if (popup.closed && !isResolved && !isExchanging) {
					// La popup a été fermée sans recevoir de message = annulation
					cleanup();
					reject(new Error("Connexion annulée par l'utilisateur"));
				}
			}, 500); // Vérifier toutes les 500ms

			// Timeout après 5 minutes
			setTimeout(() => {
				if (!isResolved) {
					cleanup();
					if (!popup.closed) {
						popup.close();
					}
					reject(new Error("Authentification expirée"));
				}
			}, 5 * 60 * 1000);
		});
	}

	/**
	 * Rafraîchit un access token avec le refresh token via le backend proxy
	 * 
	 * NOTE: Le refresh token nécessite le client_secret qui ne doit pas être exposé côté client.
	 * Cette opération doit être faite via le backend proxy pour des raisons de sécurité.
	 */
	async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
		// URL du proxy backend (développement local)
		const proxyUrl = import.meta.env.VITE_OAUTH_PROXY_URL || "http://localhost:3001";
		
		try {
			const response = await fetch(`${proxyUrl}/api/oauth/refresh`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					provider: "google",
					refresh_token: refreshToken,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				const errorMessage = errorData.error?.message || errorData.error_description || errorData.error || response.statusText;
				
				// Si le refresh token est invalide ou expiré, on peut vouloir forcer une nouvelle authentification
				if (response.status === 400 || response.status === 401) {
					throw new Error(
						`Token invalide ou expiré. Veuillez vous reconnecter. Détails: ${errorMessage}`
					);
				}
				
				// Si le proxy n'est pas disponible, donner une erreur informative
				if (response.status === 503 || response.status === 502) {
					throw new Error(
						"Le backend proxy OAuth n'est pas démarré. " +
						"Lancez `pnpm dev:server` dans un terminal séparé. " +
						"Voir docs/OAUTH_SETUP.md pour plus d'informations."
					);
				}
				
				throw new Error(
					`Erreur lors du rafraîchissement du token: ${errorMessage}`
				);
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
			// Si le proxy n'est pas disponible (erreur réseau)
			if (error instanceof TypeError && error.message.includes("fetch")) {
				throw new Error(
					"Le backend proxy OAuth n'est pas démarré. " +
					"Lancez `pnpm dev:server` dans un terminal séparé. " +
					"Voir docs/OAUTH_SETUP.md pour plus d'informations."
				);
			}
			
			if (error instanceof Error && error.message.includes("Token invalide")) {
				throw error;
			}
			
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
				// Pour google-calendar, on demande aussi les scopes Tasks pour simplifier
				// L'utilisateur connecte Google une fois et a accès à Calendar + Tasks
				return [
					...baseScopes,
					"https://www.googleapis.com/auth/calendar",
					"https://www.googleapis.com/auth/calendar.events",
					"https://www.googleapis.com/auth/tasks",
				];
			case "google-tasks":
				// Même chose pour Tasks, on inclut Calendar aussi
				return [
					...baseScopes,
					"https://www.googleapis.com/auth/calendar",
					"https://www.googleapis.com/auth/calendar.events",
					"https://www.googleapis.com/auth/tasks",
				];
			default:
				return baseScopes;
		}
	}

	/**
	 * Échange un code d'autorisation contre des tokens via le backend proxy
	 * 
	 * NOTE: Pour le développement local, utilise le proxy sur localhost:3001
	 * En production, cette opération doit être faite côté backend pour des raisons de sécurité.
	 */
	async exchangeCodeForTokensWithProxy(code: string): Promise<OAuthTokens> {
		// URL du proxy backend (développement local)
		const proxyUrl = import.meta.env.VITE_OAUTH_PROXY_URL || "http://localhost:3001";
		
		// IMPORTANT: Utiliser le même redirect_uri que celui utilisé dans buildAuthUrl
		const redirectUri = this.config.redirectUri;
		
		try {
			const response = await fetch(`${proxyUrl}/api/oauth/exchange`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ 
					code, 
					provider: "google",
					redirect_uri: redirectUri, // Envoyer le redirect_uri utilisé dans l'URL OAuth
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Erreur lors de l'échange du code");
			}

			const data = await response.json();

			return {
				accessToken: data.access_token,
				refreshToken: data.refresh_token,
				expiresAt: data.expires_in
					? Date.now() + data.expires_in * 1000
					: undefined,
				tokenType: data.token_type || "Bearer",
				scope: data.scope,
			};
		} catch (error) {
			// Si le proxy n'est pas disponible, donner une erreur informative
			if (error instanceof TypeError && error.message.includes("fetch")) {
				throw new Error(
					"Le backend proxy OAuth n'est pas démarré. " +
					"Lancez `pnpm dev:server` dans un terminal séparé. " +
					"Voir docs/OAUTH_SETUP.md pour plus d'informations."
				);
			}
			throw error;
		}
	}

	/**
	 * Échange un code d'autorisation contre des tokens (méthode originale - nécessite backend)
	 */
	async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
		return this.exchangeCodeForTokensWithProxy(code);
	}
}


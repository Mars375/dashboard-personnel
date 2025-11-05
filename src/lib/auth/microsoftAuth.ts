// Provider OAuth pour Microsoft (Outlook Calendar, etc.)

import type {
	OAuthTokens,
	OAuthUser,
	OAuthService,
} from "./types";

export interface MicrosoftAuthConfig {
	clientId: string;
	redirectUri: string;
	scopes: string[];
	tenant?: string; // "common", "organizations", "consumers" ou un tenant ID
}

export class MicrosoftAuth {
	private config: MicrosoftAuthConfig;

	constructor(config: MicrosoftAuthConfig) {
		this.config = {
			...config,
			tenant: config.tenant || "common",
		};
	}

	/**
	 * Ouvre la fenêtre OAuth Microsoft
	 */
	async authenticate(service: OAuthService = "microsoft-calendar"): Promise<OAuthTokens> {
		return new Promise((resolve, reject) => {
			const authUrl = this.buildAuthUrl(service);
			const width = 500;
			const height = 600;
			const left = window.screenX + (window.outerWidth - width) / 2;
			const top = window.screenY + (window.outerHeight - height) / 2;

			const popup = window.open(
				authUrl,
				"Microsoft OAuth",
				`width=${width},height=${height},left=${left},top=${top}`,
			);

			if (!popup) {
				reject(new Error("Popup bloquée. Veuillez autoriser les popups."));
				return;
			}

			// Écouter le message du callback
			const messageHandler = (event: MessageEvent) => {
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
			const tokenEndpoint = `https://login.microsoftonline.com/${this.config.tenant}/oauth2/v2.0/token`;
			const response = await fetch(tokenEndpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					client_id: this.config.clientId,
					refresh_token: refreshToken,
					grant_type: "refresh_token",
					scope: this.config.scopes.join(" "),
				}),
			});

			if (!response.ok) {
				throw new Error("Erreur lors du rafraîchissement du token");
			}

			const data = await response.json();

			return {
				accessToken: data.access_token,
				refreshToken: data.refresh_token || refreshToken,
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
	 * Récupère les informations de l'utilisateur Microsoft
	 */
	async getUserInfo(accessToken: string): Promise<OAuthUser> {
		try {
			const response = await fetch("https://graph.microsoft.com/v1.0/me", {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});

			if (!response.ok) {
				throw new Error("Erreur lors de la récupération des infos utilisateur");
			}

			const data = await response.json();

			return {
				id: data.id,
				email: data.mail || data.userPrincipalName,
				name: data.displayName,
				picture: undefined, // Microsoft Graph ne retourne pas directement l'image de profil
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
			response_mode: "query",
			prompt: "consent",
		});

		const authority = `https://login.microsoftonline.com/${this.config.tenant}`;
		return `${authority}/oauth2/v2.0/authorize?${params.toString()}`;
	}

	/**
	 * Retourne les scopes nécessaires pour un service
	 */
	private getScopesForService(service: OAuthService): string[] {
		const baseScopes = ["User.Read"];

		switch (service) {
			case "microsoft-calendar":
				return [
					...baseScopes,
					"Calendars.ReadWrite",
					"offline_access", // Pour obtenir un refresh token
				];
			default:
				return baseScopes;
		}
	}
}


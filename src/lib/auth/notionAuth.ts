// Provider OAuth pour Notion API

import type {
	OAuthTokens,
	OAuthUser,
} from "./types";

export interface NotionAuthConfig {
	clientId: string;
	redirectUri: string;
	clientSecret?: string; // Pour le backend
}

export class NotionAuth {
	private config: NotionAuthConfig;

	constructor(config: NotionAuthConfig) {
		this.config = config;
	}

	/**
	 * Ouvre la fenêtre OAuth Notion
	 */
	async authenticate(): Promise<OAuthTokens> {
		return new Promise((resolve, reject) => {
			const authUrl = this.buildAuthUrl();
			const width = 500;
			const height = 600;
			const left = window.screenX + (window.outerWidth - width) / 2;
			const top = window.screenY + (window.outerHeight - height) / 2;

			const popup = window.open(
				authUrl,
				"Notion OAuth",
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
	 * Récupère les informations de l'utilisateur Notion
	 * Notion ne retourne pas d'infos utilisateur via OAuth, on utilise l'API directement
	 */
	async getUserInfo(accessToken: string): Promise<OAuthUser> {
		try {
			const response = await fetch("https://api.notion.com/v1/users/me", {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Notion-Version": "2022-06-28",
				},
			});

			if (!response.ok) {
				throw new Error("Erreur lors de la récupération des infos utilisateur");
			}

			const data = await response.json();

			return {
				id: data.id,
				email: data.person?.email || "",
				name: data.name || undefined,
				picture: data.avatar_url || undefined,
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
	private buildAuthUrl(): string {
		const params = new URLSearchParams({
			client_id: this.config.clientId,
			redirect_uri: this.config.redirectUri,
			response_type: "code",
			owner: "user",
		});

		return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
	}

	/**
	 * Échange un code d'autorisation contre des tokens
	 * Cette méthode doit être appelée côté backend pour des raisons de sécurité
	 */
	async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
		// NOTE: Cette opération doit être faite côté backend
		// car elle nécessite le client_secret qui ne doit pas être exposé côté client
		throw new Error(
			"exchangeCodeForTokens doit être implémenté côté backend pour des raisons de sécurité",
		);
	}
}


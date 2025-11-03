// Types et interfaces pour l'authentification OAuth

export type OAuthProvider = "google" | "microsoft" | "notion";

export interface OAuthTokens {
	accessToken: string;
	refreshToken?: string;
	expiresAt?: number; // Timestamp en millisecondes
	tokenType?: string; // Généralement "Bearer"
	scope?: string;
}

export interface OAuthConfig {
	provider: OAuthProvider;
	clientId: string;
	clientSecret?: string; // Pour le backend, pas stocké côté client
	redirectUri: string;
	scopes: string[];
}

export interface OAuthUser {
	id: string;
	email: string;
	name?: string;
	picture?: string;
}

export interface OAuthConnection {
	provider: OAuthProvider;
	tokens: OAuthTokens;
	user?: OAuthUser;
	connectedAt: number;
	lastSyncAt?: number;
}

export interface OAuthError {
	error: string;
	errorDescription?: string;
	errorUri?: string;
}

// Service spécifique pour chaque provider
export type OAuthService =
	| "google-calendar"
	| "google-tasks"
	| "microsoft-calendar"
	| "notion-api";

export interface OAuthServiceConfig {
	service: OAuthService;
	provider: OAuthProvider;
	scopes: string[];
	apiBaseUrl: string;
}


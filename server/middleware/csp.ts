// Middleware CSP avec génération de nonce pour la protection XSS

import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

export function generateNonce(): string {
	return randomBytes(16).toString('base64');
}

export function cspMiddleware(req: Request, res: Response, next: NextFunction): void {
	const nonce = generateNonce();

	// Stocker le nonce dans res.locals pour utilisation dans les templates
	(res as any).locals = (res as any).locals || {};
	(res as any).locals.nonce = nonce;

	// Politique CSP modérée avec nonces pour Tailwind
	const cspDirectives = [
		`default-src 'self'`,
		`script-src 'self' 'nonce-${nonce}'`,
		`style-src 'self' 'nonce-${nonce}'`,
		`img-src 'self' data: https:`,
		`font-src 'self' data:`,
		`connect-src 'self' https://accounts.google.com https://login.microsoftonline.com https://api.notion.com https://api.openweathermap.org`,
		`frame-src https://accounts.google.com https://login.microsoftonline.com`,
		`object-src 'none'`,
		`base-uri 'self'`,
		`form-action 'self'`,
		`frame-ancestors 'none'`,
		`report-uri /api/csp-report`,
	].join('; ');

	// Mode report-only pour commencer (1 semaine de collecte)
	res.setHeader('Content-Security-Policy-Report-Only', cspDirectives);

	next();
}

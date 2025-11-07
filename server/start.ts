// Backend proxy pour l'échange OAuth code → tokens
// Version production pour Railway/Render

import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuré pour accepter les origines autorisées
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["*"];
app.use(
	cors({
		origin: (origin, callback) => {
			if (allowedOrigins.includes("*") || !origin) {
				callback(null, true);
			} else if (allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
	})
);
app.use(express.json());

// Endpoint pour échanger le code OAuth Google contre des tokens
app.post("/api/oauth/exchange", async (req, res) => {
	try {
		const { code, provider, redirect_uri } = req.body;

		if (!code) {
			return res.status(400).json({ error: "Code manquant" });
		}

		if (provider !== "google") {
			return res.status(400).json({ error: "Provider non supporté" });
		}

		const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
		const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
		const redirectUri = redirect_uri || process.env.VITE_GOOGLE_REDIRECT_URI || "http://localhost:5173/oauth/google/callback";

		// Normaliser l'URI
		const normalizedRedirectUri = redirectUri.endsWith("/") && redirectUri !== "http://localhost:5173/"
			? redirectUri.slice(0, -1)
			: redirectUri;

		if (!clientId) {
			console.error("❌ VITE_GOOGLE_CLIENT_ID manquant");
			return res.status(500).json({
				error: "VITE_GOOGLE_CLIENT_ID manquant. Vérifiez vos variables d'environnement",
			});
		}

		if (!clientSecret) {
			console.error("❌ GOOGLE_CLIENT_SECRET manquant");
			return res.status(500).json({
				error: "GOOGLE_CLIENT_SECRET manquant. Vérifiez vos variables d'environnement",
			});
		}

		// Échanger le code contre des tokens
		const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				code,
				client_id: clientId,
				client_secret: clientSecret,
				redirect_uri: normalizedRedirectUri,
				grant_type: "authorization_code",
			}),
		});

		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.text();
			console.error("❌ Erreur lors de l'échange de tokens:", errorData);
			return res.status(tokenResponse.status).json({
				error: "Erreur lors de l'échange de tokens",
				details: errorData,
			});
		}

		const tokens = await tokenResponse.json();
		res.json(tokens);
	} catch (error) {
		console.error("❌ Erreur serveur:", error);
		res.status(500).json({
			error: "Erreur serveur lors de l'échange OAuth",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

// Endpoint pour rafraîchir les tokens
app.post("/api/oauth/refresh", async (req, res) => {
	try {
		const { refresh_token, provider } = req.body;

		if (!refresh_token) {
			return res.status(400).json({ error: "Refresh token manquant" });
		}

		if (provider !== "google") {
			return res.status(400).json({ error: "Provider non supporté" });
		}

		const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
		const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

		if (!clientId || !clientSecret) {
			return res.status(500).json({
				error: "Configuration OAuth manquante",
			});
		}

		// Rafraîchir le token
		const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				refresh_token,
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: "refresh_token",
			}),
		});

		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.text();
			console.error("❌ Erreur lors du rafraîchissement:", errorData);
			return res.status(tokenResponse.status).json({
				error: "Erreur lors du rafraîchissement du token",
				details: errorData,
			});
		}

		const tokens = await tokenResponse.json();
		res.json(tokens);
	} catch (error) {
		console.error("❌ Erreur serveur:", error);
		res.status(500).json({
			error: "Erreur serveur lors du rafraîchissement",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

// Route racine
app.get("/", (req, res) => {
	res.json({ 
		service: "OAuth Proxy Server",
		status: "running",
		endpoints: {
			health: "/health",
			exchange: "POST /api/oauth/exchange",
			refresh: "POST /api/oauth/refresh"
		}
	});
});

// Health check endpoint
app.get("/health", (req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
	console.log(`🚀 OAuth Proxy Server running on port ${PORT}`);
	console.log(`📡 Allowed origins: ${allowedOrigins.join(", ")}`);
});


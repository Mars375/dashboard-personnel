// Backend proxy simple pour l'échange OAuth code → tokens
// Pour développement local uniquement

import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import path from "path";

// Charger les variables d'environnement
const envPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

const app = express();
const PORT = 3001; // Port différent du frontend Vite (5173)

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Endpoint pour échanger le code OAuth Google contre des tokens
app.post("/api/oauth/exchange", async (req, res) => {
	try {
		const { code, provider } = req.body;

		if (!code) {
			return res.status(400).json({ error: "Code manquant" });
		}

		if (provider !== "google") {
			return res.status(400).json({ error: "Provider non supporté" });
		}

		const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
		const clientSecret = process.env.GOOGLE_CLIENT_SECRET; // Doit être dans .env.local (sans VITE_)
		const redirectUri = process.env.VITE_GOOGLE_REDIRECT_URI || "http://localhost:5173/oauth/google/callback";

		if (!clientId) {
			console.error("❌ VITE_GOOGLE_CLIENT_ID manquant dans .env.local");
			return res.status(500).json({ 
				error: "VITE_GOOGLE_CLIENT_ID manquant. Vérifiez votre fichier .env.local" 
			});
		}

		if (!clientSecret) {
			console.error("❌ GOOGLE_CLIENT_SECRET manquant dans .env.local");
			console.error("💡 Astuce: Ajoutez GOOGLE_CLIENT_SECRET=votre_secret dans .env.local (SANS préfixe VITE_)");
			return res.status(500).json({ 
				error: "GOOGLE_CLIENT_SECRET manquant. Ajoutez-le dans .env.local (sans préfixe VITE_). Voir docs/OAUTH_BACKEND_SETUP.md" 
			});
		}

		// Échanger le code contre des tokens
		const response = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				code,
				client_id: clientId,
				client_secret: clientSecret,
				redirect_uri: redirectUri,
				grant_type: "authorization_code",
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			console.error("Erreur Google OAuth:", error);
			return res.status(response.status).json({ 
				error: error.error_description || error.error || "Erreur lors de l'échange OAuth" 
			});
		}

		const data = await response.json();

		// Retourner les tokens au format attendu
		res.json({
			access_token: data.access_token,
			refresh_token: data.refresh_token,
			expires_in: data.expires_in,
			token_type: data.token_type || "Bearer",
			scope: data.scope,
		});
	} catch (error) {
		console.error("Erreur serveur:", error);
		res.status(500).json({ 
			error: error instanceof Error ? error.message : "Erreur serveur inconnue" 
		});
	}
});

app.listen(PORT, () => {
	console.log(`🚀 OAuth Proxy démarré sur http://localhost:${PORT}`);
	console.log(`📝 Endpoint: http://localhost:${PORT}/api/oauth/exchange`);
	console.log(`\n📋 Variables d'environnement chargées:`);
	console.log(`   VITE_GOOGLE_CLIENT_ID: ${process.env.VITE_GOOGLE_CLIENT_ID ? "✅ Présent" : "❌ Manquant"}`);
	console.log(`   GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? "✅ Présent" : "❌ Manquant"}`);
	console.log(`   Fichier .env.local: ${envPath}`);
});


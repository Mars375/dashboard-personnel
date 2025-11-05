// Page de callback OAuth pour gérer les redirections OAuth

import { useEffect, useRef } from "react";
import { logger } from "@/lib/logger";

export function OAuthCallback() {
	// Flag pour s'assurer que le message n'est envoyé qu'une seule fois
	const messageSentRef = useRef(false);
	
	useEffect(() => {
		
		// Extraire les paramètres de l'URL
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get("code");
		const error = urlParams.get("error");
		const errorDescription = urlParams.get("error_description");
		const state = urlParams.get("state");
		
		// Déterminer le provider depuis l'URL
		let provider = "google";
		if (window.location.pathname.includes("microsoft")) provider = "microsoft";
		if (window.location.pathname.includes("notion")) provider = "notion";

		// Envoyer un message au parent (popup) - une seule fois
		if (window.opener && !messageSentRef.current) {
			messageSentRef.current = true;
			
			const message = error
				? {
						type: "OAUTH_ERROR" as const,
						error,
						errorDescription,
						provider,
				  }
				: {
						type: "OAUTH_SUCCESS" as const,
						code,
						state,
						provider,
				  };

			// Envoyer le message au parent
			window.opener.postMessage(message, window.location.origin);
			
			// Attendre un peu pour s'assurer que le message est envoyé
			setTimeout(() => {
				window.close();
			}, 100);
		} else if (!window.opener) {
			// Fenêtre principale - rediriger vers le dashboard
			logger.debug("OAuth callback reçu dans la fenêtre principale:", { code, error });
			// Rediriger vers le dashboard
			window.location.href = "/";
		}
	}, []);

	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-center">
				<h1 className="text-2xl font-bold mb-4">Authentification en cours...</h1>
				<p className="text-muted-foreground">
					Vous allez être redirigé automatiquement.
				</p>
			</div>
		</div>
	);
}


import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Loading } from "@/components/ui/loading";
import { WidgetProvider } from "@/lib/widgetContext";
import { widgetLibrary } from "@/lib/widgetLibrary";
import { logger } from "@/lib/logger";
import { migrateTokens } from "@/lib/auth/tokenMigration";
import { toast } from "sonner";

// Lazy loading des composants lourds
const Dashboard = lazy(() =>
	import("@/components/Dashboard/Dashboard").then((module) => ({
		default: module.Dashboard,
	}))
);

const OAuthCallback = lazy(() =>
	import("@/pages/OAuthCallback").then((module) => ({
		default: module.OAuthCallback,
	}))
);

function App() {
	// Initialiser la bibliothèque de widgets au démarrage
	useEffect(() => {
		widgetLibrary.initialize().catch((error) => {
			logger.error("Erreur lors de l'initialisation de la bibliothèque de widgets:", error);
		});

		// Migrer les tokens OAuth existants vers des cookies HttpOnly (sécurité XSS)
		const migrationShown = sessionStorage.getItem('migration_notice_shown');

		migrateTokens().then((anyMigrated) => {
			if (anyMigrated && !migrationShown) {
				toast.success("Sécurité améliorée ! Votre session a été préservée.", {
					duration: 5000,
					position: "bottom-right",
				});
				sessionStorage.setItem('migration_notice_shown', 'true');
			}
		}).catch((error) => {
			logger.error("Erreur lors de la migration des tokens:", error);
		});
	}, []);

	// Détecter si on est sur la page de callback OAuth
	const isOAuthCallback = window.location.pathname.startsWith("/oauth/");

	if (isOAuthCallback) {
		return (
			<Suspense fallback={<Loading fullScreen />}>
				<OAuthCallback />
			</Suspense>
		);
	}

	return (
		<WidgetProvider>
			<Suspense fallback={<Loading fullScreen />}>
				<Dashboard />
			</Suspense>
			<Toaster />
		</WidgetProvider>
	);
}

export default App;

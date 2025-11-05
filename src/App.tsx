import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Loading } from "@/components/ui/loading";
import { WidgetProvider } from "@/lib/widgetContext";

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

import { Dashboard } from "@/components/Dashboard/Dashboard";
import { Toaster } from "@/components/ui/sonner";
import { OAuthCallback } from "@/pages/OAuthCallback";

function App() {
	// Détecter si on est sur la page de callback OAuth
	const isOAuthCallback = window.location.pathname.startsWith("/oauth/");

	if (isOAuthCallback) {
		return <OAuthCallback />;
	}

	return (
		<>
			<Dashboard />
			<Toaster />
		</>
	);
}

export default App;

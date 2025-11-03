// Composant bouton pour la connexion/déconnexion OAuth

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { OAuthProvider } from "@/lib/auth";
import { getOAuthManager } from "@/lib/auth/oauthManager";
import { toast } from "sonner";

interface OAuthButtonProps {
	provider: OAuthProvider;
	service: "google-calendar" | "google-tasks" | "microsoft-calendar" | "notion-api";
	onConnect?: () => void;
	onDisconnect?: () => void;
	variant?: "default" | "outline" | "ghost";
	size?: "default" | "sm" | "lg" | "icon";
	children?: React.ReactNode;
}

export function OAuthButton({
	provider,
	service,
	onConnect,
	onDisconnect,
	variant = "default",
	size = "default",
	children,
}: OAuthButtonProps) {
	const [isConnecting, setIsConnecting] = useState(false);
	const [isConnected, setIsConnected] = useState(() => {
		const manager = getOAuthManager();
		return manager.isConnected(provider);
	});

	const handleConnect = async () => {
		setIsConnecting(true);
		try {
			const manager = getOAuthManager();
			await manager.connect(provider, service);
			setIsConnected(true);
			toast.success(`Connexion à ${provider} réussie`);
			onConnect?.();
		} catch (error) {
			toast.error(
				`Erreur lors de la connexion à ${provider}: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
			);
			console.error("Erreur OAuth:", error);
		} finally {
			setIsConnecting(false);
		}
	};

	const handleDisconnect = async () => {
		try {
			const manager = getOAuthManager();
			await manager.disconnect(provider);
			setIsConnected(false);
			toast.success(`Déconnexion de ${provider} réussie`);
			onDisconnect?.();
		} catch (error) {
			toast.error(
				`Erreur lors de la déconnexion: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
			);
			console.error("Erreur déconnexion:", error);
		}
	};

	const getProviderName = () => {
		switch (provider) {
			case "google":
				return "Google";
			case "microsoft":
				return "Microsoft";
			case "notion":
				return "Notion";
			default:
				return provider;
		}
	};

	const getServiceName = () => {
		switch (service) {
			case "google-calendar":
				return "Google Calendar";
			case "google-tasks":
				return "Google Tasks";
			case "microsoft-calendar":
				return "Outlook Calendar";
			case "notion-api":
				return "Notion";
			default:
				return service;
		}
	};

	if (isConnected) {
		return (
			<Button
				variant={variant}
				size={size}
				onClick={handleDisconnect}
				className="gap-2"
			>
				<CheckCircle2 className="h-4 w-4" />
				{children || `Déconnecter ${getProviderName()}`}
			</Button>
		);
	}

	return (
		<Button
			variant={variant}
			size={size}
			onClick={handleConnect}
			disabled={isConnecting}
			className="gap-2"
		>
			{isConnecting ? (
				<>
					<Loader2 className="h-4 w-4 animate-spin" />
					Connexion...
				</>
			) : (
				<>
					{children || `Se connecter à ${getServiceName()}`}
				</>
			)}
		</Button>
	);
}


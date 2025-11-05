// Composant bouton pour la connexion/déconnexion OAuth

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, Calendar } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { OAuthProvider } from "@/lib/auth";
import { getOAuthManager } from "@/lib/auth/oauthManager";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface OAuthButtonProps {
	provider: OAuthProvider;
	service: "google-calendar" | "google-tasks" | "microsoft-calendar" | "notion-api";
	onConnect?: () => void;
	onDisconnect?: () => void;
	variant?: "default" | "outline" | "ghost";
	size?: "default" | "sm" | "lg" | "icon";
	iconOnly?: boolean; // Afficher uniquement l'icône avec tooltip
	children?: React.ReactNode;
}

export function OAuthButton({
	provider,
	service,
	onConnect,
	onDisconnect,
	variant = "default",
	size = "default",
	iconOnly = false,
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
			// Un seul toast avec message unifié
			toast.success(`${getServiceName()} connecté`);
			onConnect?.();
		} catch (error) {
			// Détecter si l'utilisateur a annulé la connexion
			const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
			const isCancelled = 
				errorMessage.includes("Access denied") ||
				errorMessage.includes("access_denied") ||
				errorMessage.includes("user_cancelled") ||
				errorMessage.includes("popup_closed_by_user") ||
				errorMessage.toLowerCase().includes("annulé") ||
				errorMessage.toLowerCase().includes("cancelled");
			
			if (isCancelled) {
				toast.error("Connexion annulée");
			} else {
				toast.error(
					`Erreur lors de la connexion à ${getServiceName()}: ${errorMessage}`,
				);
			}
			logger.error("Erreur OAuth:", error);
		} finally {
			setIsConnecting(false);
		}
	};

	const handleDisconnect = async () => {
		try {
			const manager = getOAuthManager();
			await manager.disconnect(provider);
			setIsConnected(false);
			toast.success(`${getServiceName()} déconnecté`);
			onDisconnect?.();
		} catch (error) {
			toast.error(
				`Erreur lors de la déconnexion: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
			);
			logger.error("Erreur déconnexion:", error);
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

	// Si iconOnly ou size="icon", afficher uniquement l'icône avec tooltip
	if (iconOnly || size === "icon") {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant={variant}
							size={size}
							onClick={isConnected ? handleDisconnect : handleConnect}
							disabled={isConnecting}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
							aria-label={
								isConnected
									? `Déconnecter ${getServiceName()}`
									: `Se connecter à ${getServiceName()}`
							}
						>
							{isConnecting ? (
								<Spinner className="size-4" />
							) : isConnected ? (
								<CheckCircle2 className="h-4 w-4 text-green-600" />
							) : (
								<Calendar className="h-4 w-4" />
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{isConnecting
							? "Connexion..."
							: isConnected
								? `Déconnecter ${getServiceName()}`
								: `Se connecter à ${getServiceName()}`}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

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
					<Spinner className="size-4" />
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


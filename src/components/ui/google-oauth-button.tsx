// Composant bouton pour la connexion/déconnexion Google (Calendar + Tasks)

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, Calendar } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { getOAuthManager } from "@/lib/auth/oauthManager";
import { toast } from "sonner";
import type { OAuthService } from "@/lib/auth/types";
import { logger } from "@/lib/logger";

interface GoogleOAuthButtonProps {
	onCalendarConnect?: () => void;
	onCalendarDisconnect?: () => void;
	onTasksConnect?: () => void;
	onTasksDisconnect?: () => void;
	variant?: "default" | "outline" | "ghost";
	size?: "default" | "sm" | "lg" | "icon";
	iconOnly?: boolean;
	children?: React.ReactNode;
}

export function GoogleOAuthButton({
	onCalendarConnect,
	onCalendarDisconnect,
	onTasksConnect,
	onTasksDisconnect,
	variant = "default",
	size = "default",
	iconOnly = false,
	children,
}: GoogleOAuthButtonProps) {
	const [isConnecting, setIsConnecting] = useState(false);
	const manager = getOAuthManager();
	const [isConnected, setIsConnected] = useState(() => {
		return manager.isConnected("google");
	});

	// Mettre à jour l'état de connexion en temps réel
	useEffect(() => {
		const checkConnection = () => {
			const connected = manager.isConnected("google");
			setIsConnected(connected);
		};
		
		// Vérifier toutes les secondes si la connexion a changé
		const interval = setInterval(checkConnection, 1000);
		
		return () => clearInterval(interval);
	}, [manager]);

	const handleConnect = async () => {
		setIsConnecting(true);
		try {
			// Connecter avec les scopes Calendar + Tasks
			// On utilise "google-calendar" comme service principal, mais on demandera les deux scopes
			await manager.connect("google", "google-calendar");
			
			// Pour Google Tasks, on doit aussi se connecter (mais avec le même provider, donc c'est déjà fait)
			// Si nécessaire, on peut aussi appeler pour Tasks, mais normalement un seul appel suffit
			// car on demande les deux scopes dans buildAuthUrl
			
			setIsConnected(true);
			
			toast.success("Google connecté (Calendar & Tasks)");
			
			// Appeler les callbacks
			onCalendarConnect?.();
			onTasksConnect?.();
		} catch (error) {
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
				toast.error(`Erreur lors de la connexion à Google: ${errorMessage}`);
			}
			logger.error("Erreur OAuth Google:", error);
		} finally {
			setIsConnecting(false);
		}
	};

	const handleDisconnect = async () => {
		try {
			await manager.disconnect("google");
			setIsConnected(false);
			toast.success("Google déconnecté");
			
			// Appeler les callbacks
			onCalendarDisconnect?.();
			onTasksDisconnect?.();
		} catch (error) {
			toast.error(
				`Erreur lors de la déconnexion: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
			);
			logger.error("Erreur déconnexion Google:", error);
		}
	};

	const buttonContent = iconOnly ? (
		<Calendar className='h-4 w-4' />
	) : children ? (
		children
	) : (
		<>
			{isConnected ? (
				<>
					<CheckCircle2 className='mr-2 h-4 w-4' />
					Google connecté
				</>
			) : (
				<>
					<Calendar className='mr-2 h-4 w-4' />
					Connecter Google
				</>
			)}
		</>
	);

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant={isConnected ? "default" : variant}
						size={size}
						onClick={isConnected ? handleDisconnect : handleConnect}
						disabled={isConnecting}
						className={isConnected ? "bg-green-600 hover:bg-green-700" : ""}
					>
					{isConnecting ? (
						<>
							<Spinner className='mr-2 size-4' />
							{!iconOnly && "Connexion..."}
						</>
					) : (
							buttonContent
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>
						{isConnected
							? "Déconnecter Google (Calendar & Tasks)"
							: "Connecter Google (Calendar & Tasks)"}
					</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}


/**
 * Composant de chargement réutilisable utilisant Spinner de shadcn/ui
 */

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface LoadingProps {
	className?: string;
	size?: "sm" | "md" | "lg";
	text?: string;
	fullScreen?: boolean;
}

export function Loading({
	className,
	size = "md",
	text,
	fullScreen = false,
}: LoadingProps) {
	const spinnerSize = {
		sm: "size-4",
		md: "size-8",
		lg: "size-12",
	}[size];

	const containerClassName = fullScreen
		? "flex items-center justify-center min-h-screen"
		: "flex items-center justify-center h-full";

	return (
		<div className={cn(containerClassName, className)}>
			<div className="flex flex-col items-center gap-3">
				<Spinner className={spinnerSize} />
				{text && (
					<p className="text-sm text-muted-foreground">{text}</p>
				)}
			</div>
		</div>
	);
}


/**
 * Composant TodoSearchBar - Barre de recherche pour les tâches
 * Extrait de TodoWidget pour améliorer la maintenabilité
 */

import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search } from "lucide-react";

interface TodoSearchBarProps {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	size?: "compact" | "medium" | "full";
}

function TodoSearchBarComponent({
	searchQuery,
	setSearchQuery,
	size = "full",
}: TodoSearchBarProps) {
	const isCompact = size === "compact";
	const isMedium = size === "medium";

	// Version compacte : pas de recherche
	if (isCompact) {
		return null;
	}

	// Version medium : recherche dans un Popover
	if (isMedium) {
		return (
			<div className="flex justify-end">
				<Popover>
					<PopoverTrigger asChild>
						<Button variant="outline" size="icon" className="h-7 w-7">
							<Search className="h-3.5 w-3.5" />
							<span className="sr-only">Rechercher</span>
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-64 p-2">
						<div className="relative">
							<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Rechercher..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-8"
								aria-label="Rechercher dans les tâches"
							/>
						</div>
					</PopoverContent>
				</Popover>
			</div>
		);
	}

	// Version full : recherche complète
	return (
		<div className="relative">
			<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Rechercher une tâche..."
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				className="pl-8"
				aria-label="Rechercher dans les tâches"
			/>
		</div>
	);
}

export const TodoSearchBar = memo(TodoSearchBarComponent);


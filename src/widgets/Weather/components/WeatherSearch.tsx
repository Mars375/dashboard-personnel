/**
 * Composant WeatherSearch - Barre de recherche de ville
 * Extrait de WeatherWidget pour améliorer la maintenabilité
 */

import { memo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { useAutocompleteCity } from "@/hooks/useAutocompleteCity";

interface WeatherSearchProps {
	searchCity: string;
	setSearchCity: (city: string) => void;
	onSubmit: (e?: React.FormEvent) => void;
	loading: boolean;
}

function WeatherSearchComponent({
	searchCity,
	setSearchCity,
	onSubmit,
	loading,
}: WeatherSearchProps) {
	const ac = useAutocompleteCity();
	const inputRef = useRef<HTMLInputElement | null>(null);

	return (
		<form
			onSubmit={onSubmit}
			className="flex gap-2"
			onMouseDown={(e: React.MouseEvent) => {
				e.stopPropagation();
			}}
			onDragStart={(e: React.DragEvent) => {
				e.preventDefault();
				e.stopPropagation();
			}}
		>
			<Popover open={ac.suggestions.length > 0 && searchCity.length > 0}>
				<PopoverTrigger asChild>
					<div className="flex-1">
					<Input
						ref={inputRef}
						placeholder="Ajouter une ville..."
						value={searchCity}
						onChange={(e) => {
							setSearchCity(e.target.value);
							ac.search(e.target.value);
						}}
						onKeyDown={(e) => {
							if (e.key === "ArrowDown") {
								e.preventDefault();
								ac.moveActive(1);
							}
							if (e.key === "ArrowUp") {
								e.preventDefault();
								ac.moveActive(-1);
							}
							if (e.key === "Enter" && ac.open && ac.activeIndex >= 0) {
								e.preventDefault();
								const s = ac.suggestions[ac.activeIndex];
								if (s) {
									setSearchCity(s.name);
									ac.reset();
								}
							}
						}}
						onMouseDown={(e: React.MouseEvent) => {
							e.stopPropagation();
						}}
						onDragStart={(e: React.DragEvent) => {
							e.preventDefault();
							e.stopPropagation();
						}}
						className="w-full"
						aria-label="Rechercher une ville"
					/>
					</div>
				</PopoverTrigger>
				<PopoverContent
					className="p-0 w-[--radix-popover-trigger-width] min-w-[--radix-popover-trigger-width]"
					onOpenAutoFocus={(e: React.SyntheticEvent) =>
						e.preventDefault()
					}
				>
					<Command shouldFilter={false}>
						<CommandList>
							{ac.error ? (
								<CommandEmpty>Erreur: {ac.error}</CommandEmpty>
							) : ac.loading ? (
								<CommandEmpty>Chargement...</CommandEmpty>
							) : ac.suggestions.length === 0 ? (
								<CommandEmpty>Aucune ville trouvée</CommandEmpty>
							) : (
								<CommandGroup heading="Suggestions">
									{ac.suggestions.map((s, idx) => (
										<CommandItem
											key={`${s.name}-${s.state ?? ""}-${s.country ?? ""}-${
												s.lat
											}-${s.lon}`}
											value={`${s.name}${s.state ? `, ${s.state}` : ""}${
												s.country ? `, ${s.country}` : ""
											}`}
											onMouseDown={(e: React.MouseEvent<HTMLDivElement>) =>
												e.preventDefault()
											}
											onSelect={() => {
												setSearchCity(s.name);
												ac.reset();
											}}
											className={
												idx === ac.activeIndex
													? "aria-selected:bg-accent"
													: undefined
											}
										>
											{s.name} {s.state ? `, ${s.state}` : ""}
											{s.country ? `, ${s.country}` : ""}
										</CommandItem>
									))}
								</CommandGroup>
							)}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			<Button
				type="submit"
				disabled={loading || !searchCity.trim()}
				onMouseDown={(e: React.MouseEvent) => {
					e.stopPropagation();
				}}
				onDragStart={(e: React.DragEvent) => {
					e.preventDefault();
					e.stopPropagation();
				}}
			>
				<Plus className="h-4 w-4" />
			</Button>
		</form>
	);
}

export const WeatherSearch = memo(WeatherSearchComponent);


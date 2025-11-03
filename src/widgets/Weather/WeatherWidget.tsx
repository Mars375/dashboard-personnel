// src/widgets/Weather/WeatherWidget.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useWeather } from "@/hooks/useWeather";
import { loadLastCity, type SavedCity, addSavedCity, removeSavedCity, loadSavedCities, saveSavedCities } from "@/store/weatherStorage";
import { useAutocompleteCity } from "@/hooks/useAutocompleteCity";
import { X, Plus, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

// Fonction utilitaire pour obtenir l'heure locale d'une ville
function getCityTime(timezoneOffsetSec?: number): string {
	if (!timezoneOffsetSec) {
		return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
	}
	const now = new Date();
	const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
	const cityTime = new Date(utc + (timezoneOffsetSec * 1000));
	return cityTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
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
import type { WidgetProps } from "@/lib/widgetSize";

// Composant pour afficher une ville individuelle
function CityWeatherItem({
	cityName,
	isCompact,
	onRemove,
	savedCity,
	onClick,
}: {
	cityName: string;
	isCompact: boolean;
	onRemove?: () => void;
	savedCity?: SavedCity;
	onClick?: () => void;
}) {
	const {
		data,
		loading,
		error,
		iconUrl,
	} = useWeather(cityName);
	const [currentTime, setCurrentTime] = useState<string>("");

	// Mettre à jour le timezone de la ville sauvegardée si les données météo le fournissent
	useEffect(() => {
		if (data?.timezoneOffsetSec !== undefined && savedCity && !savedCity.timezoneOffsetSec) {
			// Mettre à jour la ville sauvegardée avec le timezone
			const updatedCity: SavedCity = {
				...savedCity,
				timezoneOffsetSec: data.timezoneOffsetSec,
			};
			const cities = loadSavedCities();
			const updated = cities.map((c) =>
				c.name === savedCity.name && c.country === savedCity.country ? updatedCity : c
			);
			saveSavedCities(updated);
		}
	}, [data, savedCity]);

	// Mise à jour de l'heure en temps réel
	useEffect(() => {
		if (!data) {
			setCurrentTime("");
			return;
		}
		const updateTime = () => {
			// Utiliser le timezone de la ville sauvegardée en priorité, sinon celui des données
			const timezone = savedCity?.timezoneOffsetSec ?? data.timezoneOffsetSec;
			if (timezone !== undefined) {
				setCurrentTime(getCityTime(timezone));
			} else {
				setCurrentTime(getCityTime());
			}
		};
		updateTime();
		const interval = setInterval(updateTime, 1000); // Mise à jour chaque seconde
		return () => clearInterval(interval);
	}, [data, savedCity]);

	if (loading) {
		return isCompact ? (
			<div className='flex items-center gap-2'>
				<Skeleton className='h-6 w-6 rounded-md' />
				<div className='flex-1 space-y-1'>
					<Skeleton className='h-3 w-16' />
				</div>
				<Skeleton className='h-4 w-10 rounded-md' />
			</div>
		) : (
			<div className='flex items-center gap-3 p-2 border rounded-md'>
				<Skeleton className='h-10 w-10 rounded-md' />
				<div className='flex-1 space-y-1'>
					<Skeleton className='h-4 w-24' />
					<Skeleton className='h-3 w-32' />
				</div>
				<Skeleton className='h-6 w-12 rounded-md' />
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className={`${isCompact ? "text-[10px]" : "text-xs"} text-red-600 dark:text-red-400`}>
				{cityName}: {error || "Erreur"}
			</div>
		);
	}


	if (isCompact) {
		return (
			<motion.div
				className='flex flex-col items-center justify-center border rounded-md px-2 py-2 cursor-pointer hover:bg-accent transition-colors group relative min-w-[60px] flex-1'
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.15 }}
				onClick={onClick}
				onMouseDown={(e: React.MouseEvent) => {
					// Empêcher le drag & drop du widget parent
					e.stopPropagation();
				}}
				onDragStart={(e: React.DragEvent) => {
					// Empêcher le drag & drop du widget parent
					e.preventDefault();
					e.stopPropagation();
				}}
			>
				{iconUrl && <img src={iconUrl} alt={data.description} className='size-6 mb-1' />}
				<div className='text-xs font-bold mb-0.5'>
					{Number.isFinite(data.temperatureC) ? `${Math.round(data.temperatureC)}°` : "—"}
				</div>
				<div className='text-[9px] font-medium truncate w-full text-center'>{cityName}</div>
				{currentTime && (
					<div className='text-[8px] text-muted-foreground mt-0.5'>{currentTime}</div>
				)}
				{onRemove && (
					<Button
						variant='ghost'
						size='icon'
						className='absolute top-0.5 right-0.5 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity'
						onClick={(e) => {
							e.stopPropagation();
							onRemove();
						}}
						aria-label={`Supprimer ${cityName}`}
					>
						<X className='h-2.5 w-2.5' />
					</Button>
				)}
			</motion.div>
		);
	}

	return (
		<motion.div
			className='flex items-center gap-3 p-3 border rounded-md group cursor-pointer hover:bg-accent transition-colors'
			initial={{ opacity: 0, y: -5 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2 }}
			onClick={onClick}
			onMouseDown={(e: React.MouseEvent) => {
				// Empêcher le drag & drop du widget parent
				e.stopPropagation();
			}}
			onDragStart={(e: React.DragEvent) => {
				// Empêcher le drag & drop du widget parent
				e.preventDefault();
				e.stopPropagation();
			}}
		>
			{iconUrl && <img src={iconUrl} alt={data.description} className='size-10 flex-shrink-0' />}
			<div className='flex-1 min-w-0'>
				<div className='font-medium'>{cityName}</div>
				<div className='text-xs text-muted-foreground capitalize'>{data.description}</div>
				{currentTime && (
					<div className='text-xs text-muted-foreground mt-0.5'>{currentTime}</div>
				)}
			</div>
			<div className='text-right flex-shrink-0'>
				<div className='text-xl font-bold'>
					{Number.isFinite(data.temperatureC) ? `${Math.round(data.temperatureC)}°C` : "—"}
				</div>
				{(data.tempMinC !== undefined || data.tempMaxC !== undefined) && (
					<div className='text-xs text-muted-foreground'>
						{data.tempMinC !== undefined ? Math.round(data.tempMinC) : "—"}° /{" "}
						{data.tempMaxC !== undefined ? Math.round(data.tempMaxC) : "—"}°
					</div>
				)}
			</div>
			{onRemove && (
				<Button
					variant='ghost'
					size='icon'
					className='h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0'
					onClick={(e) => {
						e.stopPropagation();
						onRemove();
					}}
					aria-label={`Supprimer ${cityName}`}
				>
					<X className='h-4 w-4' />
				</Button>
			)}
		</motion.div>
	);
}

// Composant pour afficher les détails d'une ville (prévisions) - inline
function CityWeatherDetails({
	cityName,
	isCompact,
	onBack,
}: {
	cityName: string;
	isCompact: boolean;
	onBack: () => void;
}) {
	const {
		data,
		loading,
		error,
		iconUrl,
		forecast,
	} = useWeather(cityName);
	const [currentTime, setCurrentTime] = useState<string>("");

	useEffect(() => {
		if (!data) {
			setCurrentTime("");
			return;
		}
		const updateTime = () => {
			if (data.timezoneOffsetSec !== undefined) {
				setCurrentTime(getCityTime(data.timezoneOffsetSec));
			} else {
				setCurrentTime(getCityTime());
			}
		};
		updateTime();
		const interval = setInterval(updateTime, 1000);
		return () => clearInterval(interval);
	}, [data]);

	if (loading) {
		return (
			<div className={`flex flex-col ${isCompact ? "items-center gap-2 h-full justify-center" : "gap-4"} h-full`}>
				<Skeleton className={`${isCompact ? "h-12 w-12" : "h-16 w-16"} rounded-md`} />
				<div className='space-y-2 w-full'>
					<Skeleton className={`${isCompact ? "h-3" : "h-4"} w-2/3 mx-auto`} />
					<Skeleton className={`${isCompact ? "h-2" : "h-3"} w-1/2 mx-auto`} />
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className={`${isCompact ? "text-xs" : "text-sm"} text-red-600 dark:text-red-400 text-center py-4`}>
				{error || "Erreur lors du chargement"}
			</div>
		);
	}

	if (isCompact) {
		return (
			<div className='flex flex-col h-full'>
				{/* Header avec bouton retour */}
				<div className='flex items-center gap-2 mb-1.5 shrink-0'>
					<Button
						variant='ghost'
						size='icon'
						className='h-5 w-5'
						onClick={onBack}
						onMouseDown={(e: React.MouseEvent) => {
							// Empêcher le drag & drop du widget parent
							e.stopPropagation();
						}}
						onDragStart={(e: React.DragEvent) => {
							// Empêcher le drag & drop du widget parent
							e.preventDefault();
							e.stopPropagation();
						}}
						aria-label='Retour à la liste'
					>
						<ArrowLeft className='h-3.5 w-3.5' />
					</Button>
					<div className='text-xs font-medium truncate flex-1'>{cityName}</div>
				</div>

				{/* Vue détaillée compacte sur une ligne */}
				<div className='flex flex-col gap-2 flex-1'>
					<div className='flex items-center justify-between gap-2 px-1'>
						{/* Température principale */}
						<div className='flex items-center gap-1.5'>
							{iconUrl && <img src={iconUrl} alt={data.description} className='size-8 shrink-0' />}
							<div className='flex flex-col'>
								<div className='text-lg font-bold leading-none'>
									{Number.isFinite(data.temperatureC) ? `${Math.round(data.temperatureC)}°C` : "—"}
								</div>
								<div className='text-[9px] text-muted-foreground capitalize leading-tight mt-0.5'>
									{data.description}
								</div>
							</div>
						</div>

						{/* Min/Max */}
						{(data.tempMinC !== undefined || data.tempMaxC !== undefined) && (
							<div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
								<span className='font-medium'>
									{data.tempMinC !== undefined ? Math.round(data.tempMinC) : "—"}°
								</span>
								<span>/</span>
								<span className='font-medium'>
									{data.tempMaxC !== undefined ? Math.round(data.tempMaxC) : "—"}°
								</span>
							</div>
						)}

						{/* Heure locale */}
						{currentTime && (
							<div className='text-[9px] text-muted-foreground shrink-0'>
								{currentTime}
							</div>
						)}
					</div>

					{/* Prévisions compactes sur une ligne */}
					{forecast && forecast.length > 0 && (
						<div className='border-t pt-1.5'>
							<div className='flex gap-1 overflow-x-auto pb-0.5'>
								{forecast.map((d) => (
									<div
										key={d.dateISO}
										className='flex flex-col items-center gap-0.5 rounded border p-1 min-w-[45px] shrink-0'
									>
										<div className='text-[8px] text-muted-foreground'>
											{new Date(d.dateISO).toLocaleDateString("fr-FR", { weekday: "narrow" })}
										</div>
										{d.icon && (
											<img
												src={`https://openweathermap.org/img/wn/${d.icon}@2x.png`}
												alt={d.description || "Icône"}
												className='size-5'
											/>
										)}
										<div className='text-[9px] font-medium'>
											{d.tempMaxC}°/{d.tempMinC}°
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className='flex flex-col h-full'>
			{/* Header avec bouton retour */}
			<div className='flex items-center gap-2 mb-2 shrink-0'>
				<Button
					variant='ghost'
					size='icon'
					className='h-7 w-7'
					onClick={onBack}
					onMouseDown={(e: React.MouseEvent) => {
						// Empêcher le drag & drop du widget parent
						e.stopPropagation();
					}}
					onDragStart={(e: React.DragEvent) => {
						// Empêcher le drag & drop du widget parent
						e.preventDefault();
						e.stopPropagation();
					}}
					aria-label='Retour à la liste'
				>
					<ArrowLeft className='h-3.5 w-3.5' />
				</Button>
				<div className='text-sm font-medium'>{cityName}</div>
			</div>

			{/* Contenu full */}
			<div className='flex-1 min-h-0 overflow-y-auto'>
				<div className='flex flex-col gap-2.5'>
					{/* Météo actuelle */}
					<div className='flex flex-col items-center gap-1.5'>
						{iconUrl && <img src={iconUrl} alt={data.description} className='size-12' />}
						<div className='text-xl font-bold'>
							{Number.isFinite(data.temperatureC) ? `${Math.round(data.temperatureC)}°C` : "—"}
						</div>
						<div className='text-xs text-muted-foreground capitalize'>{data.description}</div>
						<div className='text-[10px] text-muted-foreground'>
							{currentTime} · {data.city}
							{data.country && `, ${data.country}`}
						</div>
						{(data.tempMinC !== undefined || data.tempMaxC !== undefined) && (
							<div className='text-[10px] text-muted-foreground'>
								Min {data.tempMinC !== undefined ? Math.round(data.tempMinC) : "—"}° · Max{" "}
								{data.tempMaxC !== undefined ? Math.round(data.tempMaxC) : "—"}°
							</div>
						)}
					</div>

					{/* Prévisions */}
					{forecast && forecast.length > 0 && (
						<div className='border-t pt-2'>
							<div className='text-xs font-medium mb-2'>Prévisions</div>
							<div className='grid grid-cols-5 gap-1.5'>
								{forecast.map((d) => (
									<div
										key={d.dateISO}
										className='flex flex-col items-center gap-0.5 rounded-md border p-1.5'
									>
										<div className='text-[10px] text-muted-foreground'>
											{new Date(d.dateISO).toLocaleDateString("fr-FR", {
												weekday: "narrow",
												day: "2-digit",
											})}
										</div>
										{d.icon && (
											<img
												src={`https://openweathermap.org/img/wn/${d.icon}@2x.png`}
												alt={d.description || "Icône météo"}
												className='size-6'
											/>
										)}
										<div className='text-xs font-medium'>
											{d.tempMaxC}°/{d.tempMinC}°
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export function WeatherWidget({ size = "medium" }: WidgetProps) {
	const defaultCity = loadLastCity() ?? "Brumath";
	const [savedCities, setSavedCities] = useState<SavedCity[]>(() => {
		const saved = loadSavedCities();
		// Si aucune ville sauvegardée, créer une avec la ville par défaut
		if (saved.length === 0) {
			const defaultCityObj: SavedCity = { name: defaultCity };
			addSavedCity(defaultCityObj);
			return [defaultCityObj];
		}
		return saved;
	});
	
	const [searchCity, setSearchCity] = useState("");
	const [newCityLoading, setNewCityLoading] = useState(false);
	const [selectedCityForDetails, setSelectedCityForDetails] = useState<string | null>(null);
	const [compactStartIndex, setCompactStartIndex] = useState(0);
	const ac = useAutocompleteCity();
	const inputRef = useRef<HTMLInputElement | null>(null);
	const CITIES_PER_PAGE = 7; // Nombre de villes visibles en mode compact

	// Charger les villes sauvegardées au montage
	useEffect(() => {
		setSavedCities(loadSavedCities());
	}, []);

	const handleAddCity = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!searchCity.trim()) return;
		setNewCityLoading(true);
		try {
			// Utiliser l'autocomplete pour obtenir les coordonnées
			const suggestion = ac.suggestions[ac.activeIndex >= 0 ? ac.activeIndex : 0];
			if (suggestion) {
				// Essayer de récupérer le timezone depuis l'API météo
				const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
				let timezoneOffsetSec: number | undefined;
				
				if (OPENWEATHER_API_KEY && suggestion.lat && suggestion.lon) {
					try {
						const weatherUrl = new URL("https://api.openweathermap.org/data/2.5/weather");
						weatherUrl.searchParams.set("lat", String(suggestion.lat));
						weatherUrl.searchParams.set("lon", String(suggestion.lon));
						weatherUrl.searchParams.set("appid", OPENWEATHER_API_KEY);
						weatherUrl.searchParams.set("units", "metric");
						const weatherRes = await fetch(weatherUrl.toString());
						if (weatherRes.ok) {
							const weatherJson = await weatherRes.json();
							if (typeof weatherJson.timezone === "number") {
								timezoneOffsetSec = weatherJson.timezone;
							}
						}
					} catch (err) {
						// Ignorer l'erreur, on continuera sans timezone
					}
				}
				
				const newCity: SavedCity = {
					name: suggestion.name,
					country: suggestion.country,
					lat: suggestion.lat,
					lon: suggestion.lon,
					timezoneOffsetSec,
				};
				const updated = addSavedCity(newCity);
				setSavedCities(updated);
				setSearchCity("");
				ac.reset();
			} else {
				// Fallback : ajouter juste le nom
				const newCity: SavedCity = { name: searchCity.trim() };
				const updated = addSavedCity(newCity);
				setSavedCities(updated);
				setSearchCity("");
			}
		} catch (error) {
			console.error("Erreur lors de l'ajout de la ville:", error);
		} finally {
			setNewCityLoading(false);
		}
	};

	const handleRemoveCity = (cityName: string) => {
		const updated = removeSavedCity(cityName);
		setSavedCities(updated);
	};

	// Traiter medium comme full (pas de mode medium)
	const isCompact = size === "compact";
	const isFull = size === "full" || size === "medium"; // Medium est traité comme full
	const padding = isCompact ? "p-1.5" : "p-4";
	const gap = isCompact ? "gap-1" : "gap-3";

	return (
		<Card className={`w-full h-full max-w-none ${padding} flex flex-col ${gap} ${isCompact ? "overflow-hidden" : "overflow-auto"} min-h-0`}>
			{/* Recherche - seulement en mode full */}
			{isFull && (
				<form
					className='flex items-center gap-2'
					onSubmit={handleAddCity}
				>
					<label htmlFor='city' className='sr-only'>
						Ville
					</label>
					<Popover open={ac.open} modal={false}>
						<PopoverTrigger asChild>
							<div className='flex-1'>
								<Input
									id='city-search'
									ref={inputRef}
									value={searchCity}
									onChange={(e) => {
										setSearchCity(e.target.value);
										ac.setQuery(e.target.value);
										ac.setOpen(true);
									}}
									onFocus={() =>
										ac.setOpen(ac.suggestions.length > 0 || ac.loading)
									}
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
									placeholder='Rechercher et ajouter une ville...'
									className='w-full'
									autoComplete='off'
								/>
							</div>
						</PopoverTrigger>
						<PopoverContent
							className='p-0 w-[--radix-popover-trigger-width] min-w-[--radix-popover-trigger-width]'
							onOpenAutoFocus={(e: React.SyntheticEvent) => e.preventDefault()}
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
										<CommandGroup heading='Suggestions'>
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
						type='submit' 
						disabled={newCityLoading || !searchCity.trim()}
						onMouseDown={(e: React.MouseEvent) => {
							e.stopPropagation();
						}}
						onDragStart={(e: React.DragEvent) => {
							e.preventDefault();
							e.stopPropagation();
						}}
					>
						<Plus className='h-4 w-4' />
					</Button>
				</form>
			)}

			{/* Affichage conditionnel : détails ou liste */}
			{selectedCityForDetails ? (
				/* Affichage des détails d'une ville */
				<CityWeatherDetails
					cityName={selectedCityForDetails}
					isCompact={isCompact}
					onBack={() => setSelectedCityForDetails(null)}
				/>
			) : savedCities.length === 0 ? (
				<div className={`${isCompact ? "text-xs h-full flex items-center justify-center" : "text-sm text-center py-4"} text-muted-foreground`}>
					{isCompact ? "Ajoutez une ville" : "Ajoutez une ville ci-dessus pour voir la météo"}
				</div>
			) : isCompact ? (
				/* Format compact type Android avec navigation */
				<div className='flex flex-col h-full'>
					<div className='flex items-center gap-1 flex-1 overflow-hidden'>
						{/* Bouton navigation gauche */}
						{compactStartIndex > 0 && (
							<Button
								variant='ghost'
								size='icon'
								className='h-6 w-6 shrink-0'
								onClick={() => setCompactStartIndex(Math.max(0, compactStartIndex - CITIES_PER_PAGE))}
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
								aria-label='Villes précédentes'
							>
								<ChevronLeft className='h-4 w-4' />
							</Button>
						)}
						
						{/* Liste des villes en format carte */}
						<div className='flex gap-1.5 flex-1 overflow-hidden'>
							{savedCities
								.slice(compactStartIndex, compactStartIndex + CITIES_PER_PAGE)
								.map((savedCity) => (
									<CityWeatherItem
										key={`${savedCity.name}-${savedCity.country ?? ""}`}
										cityName={savedCity.name}
										isCompact={true}
										onRemove={undefined}
										savedCity={savedCity}
										onClick={() => setSelectedCityForDetails(savedCity.name)}
									/>
								))}
						</div>
						
						{/* Bouton navigation droite */}
						{compactStartIndex + CITIES_PER_PAGE < savedCities.length && (
							<Button
								variant='ghost'
								size='icon'
								className='h-6 w-6 shrink-0'
								onClick={() =>
									setCompactStartIndex(Math.min(savedCities.length - CITIES_PER_PAGE, compactStartIndex + CITIES_PER_PAGE))
								}
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
								aria-label='Villes suivantes'
							>
								<ChevronRight className='h-4 w-4' />
							</Button>
						)}
					</div>
					
					{/* Indicateur de pagination */}
					{savedCities.length > CITIES_PER_PAGE && (
						<div className='flex justify-center gap-1 mt-1'>
							{Array.from({ length: Math.ceil(savedCities.length / CITIES_PER_PAGE) }).map((_, idx) => (
								<div
									key={idx}
									className={`h-1 rounded-full transition-all ${
										Math.floor(compactStartIndex / CITIES_PER_PAGE) === idx
											? "w-4 bg-primary"
											: "w-1 bg-muted-foreground/30"
									}`}
								/>
							))}
						</div>
					)}
				</div>
			) : (
				<div className='flex flex-col gap-2 flex-1 overflow-y-auto'>
					{savedCities.map((savedCity) => (
						<CityWeatherItem
							key={`${savedCity.name}-${savedCity.country ?? ""}`}
							cityName={savedCity.name}
							isCompact={false}
							onRemove={isFull ? () => handleRemoveCity(savedCity.name) : undefined}
							savedCity={savedCity}
							onClick={() => setSelectedCityForDetails(savedCity.name)}
						/>
					))}
				</div>
			)}
		</Card>
	);
}

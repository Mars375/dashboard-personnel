// src/widgets/Weather/WeatherWidget.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, memo, useCallback, useMemo } from "react";
import {
	loadLastCity,
	type SavedCity,
	addSavedCity,
	removeSavedCity,
	loadSavedCities,
} from "@/store/weatherStorage";
import { logger } from "@/lib/logger";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { WidgetProps } from "@/lib/widgetSize";
import {
	CityWeatherItem,
	CityWeatherDetails,
	WeatherSearch,
} from "./components";
import { useAutocompleteCity } from "@/hooks/useAutocompleteCity";

function WeatherWidgetComponent({ size = "medium" }: WidgetProps) {
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
	const [selectedCityForDetails, setSelectedCityForDetails] =
		useState<string | null>(null);
	const [compactStartIndex, setCompactStartIndex] = useState(0);
	const ac = useAutocompleteCity();
	const CITIES_PER_PAGE = 7; // Nombre de villes visibles en mode compact

	// Charger les villes sauvegardées au montage
	useEffect(() => {
		setSavedCities(loadSavedCities());
	}, []);

	const handleAddCity = useCallback(async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!searchCity.trim()) return;
		setNewCityLoading(true);
		try {
			// Utiliser l'autocomplete pour obtenir les coordonnées
			const suggestion =
				ac.suggestions[ac.activeIndex >= 0 ? ac.activeIndex : 0];
			if (suggestion) {
				// Essayer de récupérer le timezone depuis l'API météo
				const OPENWEATHER_API_KEY =
					import.meta.env.VITE_OPENWEATHER_API_KEY;
				let timezoneOffsetSec: number | undefined;

				if (OPENWEATHER_API_KEY && suggestion.lat && suggestion.lon) {
					try {
						const weatherUrl = new URL(
							"https://api.openweathermap.org/data/2.5/weather"
						);
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
			logger.error("Erreur lors de l'ajout de la ville:", error);
		} finally {
			setNewCityLoading(false);
		}
	}, [searchCity, ac]);

	const handleRemoveCity = useCallback((cityName: string) => {
		const updated = removeSavedCity(cityName);
		setSavedCities(updated);
	}, []);

	// Traiter medium comme full (pas de mode medium)
	const isCompact = useMemo(() => size === "compact", [size]);
	const isFull = useMemo(() => size === "full" || size === "medium", [size]); // Medium est traité comme full
	const padding = useMemo(() => isCompact ? "p-1.5" : "p-4", [isCompact]);
	const gap = useMemo(() => isCompact ? "gap-1" : "gap-3", [isCompact]);
	
	const visibleCities = useMemo(() => 
		savedCities.slice(compactStartIndex, compactStartIndex + CITIES_PER_PAGE),
		[savedCities, compactStartIndex]
	);

	return (
		<Card
			className={`w-full h-full max-w-none ${padding} flex flex-col ${gap} ${
				isCompact ? "overflow-hidden" : "overflow-auto"
			} min-h-0`}
		>
			{/* Recherche - seulement en mode full */}
			{isFull && (
				<WeatherSearch
					searchCity={searchCity}
					setSearchCity={setSearchCity}
					onSubmit={handleAddCity}
					loading={newCityLoading}
					onSelectSuggestion={async (suggestion) => {
						setSearchCity(suggestion.name);
						ac.reset();
						// Ajouter directement la ville sélectionnée
						setNewCityLoading(true);
						try {
							const OPENWEATHER_API_KEY =
								import.meta.env.VITE_OPENWEATHER_API_KEY;
							let timezoneOffsetSec: number | undefined;

							if (OPENWEATHER_API_KEY && suggestion.lat && suggestion.lon) {
								try {
									const weatherUrl = new URL(
										"https://api.openweathermap.org/data/2.5/weather"
									);
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
						} catch (error) {
							logger.error("Erreur lors de l'ajout de la ville:", error);
						} finally {
							setNewCityLoading(false);
						}
					}}
				/>
			)}

			{/* Affichage conditionnel : détails ou liste */}
			{selectedCityForDetails ? (
				<CityWeatherDetails
					cityName={selectedCityForDetails}
					isCompact={isCompact}
					onBack={() => setSelectedCityForDetails(null)}
				/>
			) : savedCities.length === 0 ? (
				<div
					className={`${
						isCompact
							? "text-xs h-full flex items-center justify-center"
							: "text-sm text-center py-4"
					} text-muted-foreground`}
				>
					{isCompact
						? "Ajoutez une ville"
						: "Ajoutez une ville ci-dessus pour voir la météo"}
				</div>
			) : isCompact ? (
				/* Format compact type Android avec navigation - Centré */
				<div className="flex flex-col h-full">
					<div className="flex items-center justify-center gap-1 flex-1 overflow-hidden">
						{/* Bouton navigation gauche */}
						{compactStartIndex > 0 && (
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 shrink-0"
								onClick={() =>
									setCompactStartIndex(
										Math.max(0, compactStartIndex - CITIES_PER_PAGE)
									)
								}
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
								aria-label="Villes précédentes"
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
						)}

						{/* Liste des villes en format carte - Centrée */}
						<div className="flex gap-1.5 justify-center items-center flex-1 overflow-hidden">
							{visibleCities.map((savedCity) => (
									<CityWeatherItem
										key={`${savedCity.name}-${savedCity.country ?? ""}`}
										cityName={savedCity.name}
										isCompact={true}
										onRemove={undefined}
										savedCity={savedCity}
										onClick={() =>
											setSelectedCityForDetails(savedCity.name)
										}
									/>
								))}
						</div>

						{/* Bouton navigation droite */}
						{compactStartIndex + CITIES_PER_PAGE < savedCities.length && (
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 shrink-0"
								onClick={() =>
									setCompactStartIndex(
										Math.min(
											savedCities.length - CITIES_PER_PAGE,
											compactStartIndex + CITIES_PER_PAGE
										)
									)
								}
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
								aria-label="Villes suivantes"
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						)}
					</div>

					{/* Indicateur de pagination */}
					{savedCities.length > CITIES_PER_PAGE && (
						<div className="flex justify-center gap-1 mt-1">
							{Array.from({
								length: Math.ceil(savedCities.length / CITIES_PER_PAGE),
							}).map((_, idx) => (
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
				<div className="flex flex-col gap-2 flex-1 overflow-y-auto">
					{savedCities.map((savedCity) => (
						<CityWeatherItem
							key={`${savedCity.name}-${savedCity.country ?? ""}`}
							cityName={savedCity.name}
							isCompact={false}
							onRemove={
								isFull
									? () => handleRemoveCity(savedCity.name)
									: undefined
							}
							savedCity={savedCity}
							onClick={() => setSelectedCityForDetails(savedCity.name)}
						/>
					))}
				</div>
			)}
		</Card>
	);
}

export const WeatherWidget = memo(WeatherWidgetComponent);

/**
 * Composant CityWeatherItem - Carte d'une ville individuelle
 * Extrait de WeatherWidget pour améliorer la maintenabilité
 */

import { memo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useWeather } from "@/hooks/useWeather";
import {
	loadSavedCities,
	saveSavedCities,
	type SavedCity,
} from "@/store/weatherStorage";

// Fonction utilitaire pour obtenir l'heure locale d'une ville
function getCityTime(timezoneOffsetSec?: number): string {
	if (!timezoneOffsetSec) {
		return new Date().toLocaleTimeString("fr-FR", {
			hour: "2-digit",
			minute: "2-digit",
		});
	}
	const now = new Date();
	const utc = now.getTime() + now.getTimezoneOffset() * 60000;
	const cityTime = new Date(utc + timezoneOffsetSec * 1000);
	return cityTime.toLocaleTimeString("fr-FR", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

interface CityWeatherItemProps {
	cityName: string;
	isCompact: boolean;
	onRemove?: () => void;
	savedCity?: SavedCity;
	onClick?: () => void;
}

function CityWeatherItemComponent({
	cityName,
	isCompact,
	onRemove,
	savedCity,
	onClick,
}: CityWeatherItemProps) {
	const { data, loading, error, iconUrl } = useWeather(cityName);
	const [currentTime, setCurrentTime] = useState<string>("");

	// Mettre à jour le timezone de la ville sauvegardée si les données météo le fournissent
	useEffect(() => {
		if (
			data?.timezoneOffsetSec !== undefined &&
			savedCity &&
			!savedCity.timezoneOffsetSec
		) {
			const updatedCity: SavedCity = {
				...savedCity,
				timezoneOffsetSec: data.timezoneOffsetSec,
			};
			const cities = loadSavedCities();
			const updated = cities.map((c) =>
				c.name === savedCity.name && c.country === savedCity.country
					? updatedCity
					: c
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
			const timezone =
				savedCity?.timezoneOffsetSec ?? data.timezoneOffsetSec;
			if (timezone !== undefined) {
				setCurrentTime(getCityTime(timezone));
			} else {
				setCurrentTime(getCityTime());
			}
		};
		updateTime();
		const interval = setInterval(updateTime, 1000);
		return () => clearInterval(interval);
	}, [data, savedCity]);

	if (loading) {
		return isCompact ? (
			<div className="flex items-center gap-2">
				<Skeleton className="h-6 w-6 rounded-md" />
				<Skeleton className="h-4 w-20" />
			</div>
		) : (
			<div className="flex items-center gap-3 p-2 rounded-md border">
				<Skeleton className="h-10 w-10 rounded-md" />
				<div className="flex-1 space-y-1">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-3 w-16" />
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div
				className={`${
					isCompact ? "text-xs" : "text-sm"
				} text-red-600 dark:text-red-400`}
			>
				{error || "Erreur"}
			</div>
		);
	}

	if (isCompact) {
		// Style compact complètement revu : design minimaliste et moderne
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				className="group flex flex-col items-center justify-center gap-1 p-2 rounded-lg border bg-gradient-to-br from-card to-accent/30 hover:from-accent/50 hover:to-accent/70 transition-all cursor-pointer shrink-0 min-w-[100px] max-w-[110px] h-[90px] shadow-sm hover:shadow-md"
				onClick={onClick}
				onMouseDown={(e: React.MouseEvent) => {
					e.stopPropagation();
				}}
				onDragStart={(e: React.DragEvent) => {
					e.preventDefault();
					e.stopPropagation();
				}}
			>
				{iconUrl && (
					<img
						src={iconUrl}
						alt={data.description}
						className="size-8 shrink-0 drop-shadow-sm"
					/>
				)}
				<div className="flex flex-col items-center gap-0.5 w-full">
					<div className="text-lg font-bold leading-none">
						{Number.isFinite(data.temperatureC)
							? `${Math.round(data.temperatureC)}°`
							: "—"}
					</div>
					<div className="text-[9px] text-muted-foreground capitalize truncate w-full text-center">
						{data.city}
					</div>
					{currentTime && (
						<div className="text-[8px] text-muted-foreground/70 font-mono">
							{currentTime}
						</div>
					)}
				</div>
			</motion.div>
		);
	}

	// Style full inchangé
	return (
		<motion.div
			initial={{ opacity: 0, y: -5 }}
			animate={{ opacity: 1, y: 0 }}
			className="group flex items-center gap-2 p-2 rounded-md border bg-card cursor-pointer hover:bg-accent transition-colors"
			onClick={onClick}
		>
			{iconUrl && (
				<img
					src={iconUrl}
					alt={data.description}
					className="size-10 shrink-0"
				/>
			)}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-1.5">
					<div className="font-bold text-base">
						{Number.isFinite(data.temperatureC)
							? `${Math.round(data.temperatureC)}°C`
							: "—"}
					</div>
				</div>
				<div className="text-muted-foreground capitalize text-xs truncate">
					{data.description}
				</div>
				<div className="text-xs text-muted-foreground">
					{data.city}
					{data.country && `, ${data.country}`}
				</div>
				{(data.tempMinC !== undefined ||
					data.tempMaxC !== undefined) && (
					<div className="text-muted-foreground text-xs">
						{data.tempMinC !== undefined
							? Math.round(data.tempMinC)
							: "—"}
						° /{" "}
						{data.tempMaxC !== undefined
							? Math.round(data.tempMaxC)
							: "—"}
						°
					</div>
				)}
			</div>
			{onRemove && (
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
					onClick={(e) => {
						e.stopPropagation();
						onRemove();
					}}
					aria-label={`Supprimer ${cityName}`}
				>
					<X className="h-4 w-4" />
				</Button>
			)}
		</motion.div>
	);
}

export const CityWeatherItem = memo(CityWeatherItemComponent);


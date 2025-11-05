/**
 * Composant CityWeatherDetails - Détails d'une ville (prévisions)
 * Extrait de WeatherWidget pour améliorer la maintenabilité
 */

import { memo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useWeather } from "@/hooks/useWeather";

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

interface CityWeatherDetailsProps {
	cityName: string;
	isCompact: boolean;
	onBack: () => void;
}

function CityWeatherDetailsComponent({
	cityName,
	isCompact,
	onBack,
}: CityWeatherDetailsProps) {
	const { data, loading, error, iconUrl, forecast } = useWeather(cityName);
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
			<div
				className={`flex flex-col ${
					isCompact
						? "items-center gap-2 h-full justify-center"
						: "gap-4"
				} h-full`}
			>
				<Skeleton
					className={`${isCompact ? "h-12 w-12" : "h-16 w-16"} rounded-md`}
				/>
				<div className="space-y-2 w-full">
					<Skeleton
						className={`${isCompact ? "h-3" : "h-4"} w-2/3 mx-auto`}
					/>
					<Skeleton
						className={`${isCompact ? "h-2" : "h-3"} w-1/2 mx-auto`}
					/>
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div
				className={`${
					isCompact ? "text-xs" : "text-sm"
				} text-red-600 dark:text-red-400 text-center py-4`}
			>
				{error || "Erreur lors du chargement"}
			</div>
		);
	}

	if (isCompact) {
		return (
			<div className="flex flex-col h-full">
				{/* Header avec bouton retour */}
				<div className="flex items-center gap-2 mb-1.5 shrink-0">
					<Button
						variant="ghost"
						size="icon"
						className="h-5 w-5"
						onClick={onBack}
						onMouseDown={(e: React.MouseEvent) => {
							e.stopPropagation();
						}}
						onDragStart={(e: React.DragEvent) => {
							e.preventDefault();
							e.stopPropagation();
						}}
						aria-label="Retour à la liste"
					>
						<ArrowLeft className="h-3.5 w-3.5" />
					</Button>
					<div className="text-xs font-medium truncate flex-1">
						{cityName}
					</div>
				</div>

				{/* Vue détaillée compacte sur une ligne */}
				<div className="flex flex-col gap-2 flex-1">
					<div className="flex items-center justify-between gap-2 px-1">
						{/* Température principale */}
						<div className="flex items-center gap-1.5">
							{iconUrl && (
								<img
									src={iconUrl}
									alt={data.description}
									className="size-8 shrink-0"
								/>
							)}
							<div className="flex flex-col">
								<div className="text-lg font-bold leading-none">
									{Number.isFinite(data.temperatureC)
										? `${Math.round(data.temperatureC)}°C`
										: "—"}
								</div>
								<div className="text-[9px] text-muted-foreground capitalize leading-tight mt-0.5">
									{data.description}
								</div>
							</div>
						</div>

						{/* Min/Max */}
						{(data.tempMinC !== undefined ||
							data.tempMaxC !== undefined) && (
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
								<span className="font-medium">
									{data.tempMinC !== undefined
										? Math.round(data.tempMinC)
										: "—"}
									°
								</span>
								<span>/</span>
								<span className="font-medium">
									{data.tempMaxC !== undefined
										? Math.round(data.tempMaxC)
										: "—"}
									°
								</span>
							</div>
						)}

						{/* Heure locale */}
						{currentTime && (
							<div className="text-[9px] text-muted-foreground shrink-0">
								{currentTime}
							</div>
						)}
					</div>

					{/* Prévisions compactes sur une ligne */}
					{forecast && forecast.length > 0 && (
						<div className="border-t pt-1.5">
							<div className="flex gap-1 overflow-x-auto pb-0.5">
								{forecast.map((d) => (
									<div
										key={d.dateISO}
										className="flex flex-col items-center gap-0.5 rounded-md border p-1 shrink-0 min-w-[50px]"
									>
										<div className="text-[9px] text-muted-foreground">
											{new Date(d.dateISO).toLocaleDateString("fr-FR", {
												weekday: "narrow",
												day: "2-digit",
											})}
										</div>
										{d.icon && (
											<img
												src={`https://openweathermap.org/img/wn/${d.icon}@2x.png`}
												alt={d.description || "Icône météo"}
												className="size-5"
											/>
										)}
										<div className="text-[10px] font-medium">
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

	// Version full
	return (
		<div className="flex flex-col h-full">
			{/* Header avec bouton retour */}
			<div className="flex items-center gap-2 mb-2 shrink-0">
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={onBack}
					onMouseDown={(e: React.MouseEvent) => {
						e.stopPropagation();
					}}
					onDragStart={(e: React.DragEvent) => {
						e.preventDefault();
						e.stopPropagation();
					}}
					aria-label="Retour à la liste"
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div className="text-sm font-medium">{cityName}</div>
			</div>

			{/* Contenu full */}
			<div className="flex-1 min-h-0 overflow-y-auto">
				<div className="flex flex-col gap-2.5">
					{/* Météo actuelle */}
					<div className="flex flex-col items-center gap-1.5">
						{iconUrl && (
							<img
								src={iconUrl}
								alt={data.description}
								className="size-12"
							/>
						)}
						<div className="text-xl font-bold">
							{Number.isFinite(data.temperatureC)
								? `${Math.round(data.temperatureC)}°C`
								: "—"}
						</div>
						<div className="text-xs text-muted-foreground capitalize">
							{data.description}
						</div>
						<div className="text-[10px] text-muted-foreground">
							{currentTime} · {data.city}
							{data.country && `, ${data.country}`}
						</div>
						{(data.tempMinC !== undefined ||
							data.tempMaxC !== undefined) && (
							<div className="text-[10px] text-muted-foreground">
								Min{" "}
								{data.tempMinC !== undefined
									? Math.round(data.tempMinC)
									: "—"}
								° · Max{" "}
								{data.tempMaxC !== undefined
									? Math.round(data.tempMaxC)
									: "—"}
								°
							</div>
						)}
					</div>

					{/* Prévisions */}
					{forecast && forecast.length > 0 && (
						<div className="border-t pt-2">
							<div className="text-xs font-medium mb-2">
								Prévisions
							</div>
							<div className="grid grid-cols-5 gap-1.5">
								{forecast.map((d) => (
									<div
										key={d.dateISO}
										className="flex flex-col items-center gap-0.5 rounded-md border p-1.5"
									>
										<div className="text-[10px] text-muted-foreground">
											{new Date(d.dateISO).toLocaleDateString("fr-FR", {
												weekday: "narrow",
												day: "2-digit",
											})}
										</div>
										{d.icon && (
											<img
												src={`https://openweathermap.org/img/wn/${d.icon}@2x.png`}
												alt={d.description || "Icône météo"}
												className="size-6"
											/>
										)}
										<div className="text-xs font-medium">
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

export const CityWeatherDetails = memo(CityWeatherDetailsComponent);


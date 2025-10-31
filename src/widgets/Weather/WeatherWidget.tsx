// src/widgets/Weather/WeatherWidget.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import type React from "react";
import { useEffect, useRef } from "react";
import { useWeather } from "@/hooks/useWeather";
import { loadLastCity, saveLastCity } from "@/store/weatherStorage";
import { useAutocompleteCity } from "@/hooks/useAutocompleteCity";
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

export function WeatherWidget() {
	const defaultCity = loadLastCity() ?? "Brumath";
	const {
		city,
		setCity,
		data,
		loading,
		error,
		iconUrl,
		refresh,
		fetchWeather,
		forecast,
	} = useWeather(defaultCity);

	const ac = useAutocompleteCity();
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		saveLastCity(city);
	}, [city]);

	// Refresh auto toutes les 10 minutes
	useEffect(() => {
		const id = setInterval(
			() => {
				refresh();
			},
			10 * 60 * 1000
		);
		return () => clearInterval(id);
	}, [refresh]);

	return (
		<Card className='w-full max-w-sm p-4 flex flex-col gap-3'>
			<form
				className='flex items-center gap-2'
				onSubmit={(e) => {
					e.preventDefault();
					fetchWeather(city);
				}}
			>
				<label htmlFor='city' className='sr-only'>
					Ville
				</label>
				<Popover open={ac.open} modal={false}>
					<PopoverTrigger asChild>
						<div className='flex-1'>
							<Input
								id='city'
								ref={inputRef}
								value={city}
								onChange={(e) => {
									setCity(e.target.value);
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
											setCity(s.name);
											fetchWeather(s.name);
											ac.reset();
										}
									}
								}}
								placeholder='Rechercher une ville...'
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
													setCity(s.name);
													fetchWeather(s.name);
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
				<Button type='submit' disabled={loading}>
					Chercher
				</Button>
			</form>

			{loading ? (
				<div
					className='grid grid-cols-3 items-center gap-3'
					aria-live='polite'
					role='status'
				>
					<Skeleton className='col-span-1 h-14 w-14 rounded-md' />
					<div className='col-span-2 space-y-2 w-full'>
						<Skeleton className='h-4 w-2/3' />
						<Skeleton className='h-3 w-1/2' />
					</div>
				</div>
			) : error ? (
				<div
					className='text-sm text-red-600 dark:text-red-400'
					aria-live='assertive'
				>
					{error}
				</div>
			) : data ? (
				<motion.div
					className='flex flex-col items-center text-center gap-2'
					aria-live='polite'
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.25 }}
				>
					{iconUrl ? (
						<img src={iconUrl} alt={data.description} className='size-14' />
					) : (
						<div className='size-14' aria-hidden />
					)}
					<div className='text-lg font-bold'>
						{data.city}
						{data.country ? `, ${data.country}` : ""}
					</div>
					<div className='text-3xl font-semibold'>
						{Number.isFinite(data.temperatureC)
							? `${Math.round(data.temperatureC)}°C`
							: "—"}
					</div>
					<div className='text-sm text-muted-foreground capitalize'>
						{data.description}
					</div>
					{(data.tempMinC !== undefined || data.tempMaxC !== undefined) && (
						<div className='text-xs text-muted-foreground'>
							Min{" "}
							{data.tempMinC !== undefined ? Math.round(data.tempMinC) : "—"}° ·
							Max{" "}
							{data.tempMaxC !== undefined ? Math.round(data.tempMaxC) : "—"}°
						</div>
					)}
					<Button
						onClick={refresh}
						variant='secondary'
						className='mt-1'
						disabled={loading}
					>
						Rafraîchir
					</Button>

					{/* Prévisions 5 jours */}
					{forecast && forecast.length > 0 && (
						<motion.div
							className='mt-2 grid grid-cols-5 gap-2 w-full'
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.2 }}
							aria-label='Prévisions sur 5 jours'
						>
							{forecast.map((d) => (
								<div
									key={d.dateISO}
									className='rounded-md border p-2 flex flex-col items-center gap-1'
								>
									{d.icon ? (
										<img
											src={`https://openweathermap.org/img/wn/${d.icon}.png`}
											alt={d.description || "Icône météo"}
											className='size-8'
										/>
									) : (
										<div className='size-8' aria-hidden />
									)}
									<div className='text-xs text-muted-foreground'>
										{new Date(d.dateISO).toLocaleDateString(undefined, {
											weekday: "short",
											day: "2-digit",
										})}
									</div>
									<div className='text-sm font-medium'>
										{d.tempMaxC}° / {d.tempMinC}°
									</div>
								</div>
							))}
						</motion.div>
					)}
				</motion.div>
			) : (
				<div className='text-sm text-muted-foreground'>Weather unavailable</div>
			)}
		</Card>
	);
}

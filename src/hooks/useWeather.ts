import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type GeoResult = {
	name: string;
	lat: number;
	lon: number;
	country: string;
	state?: string;
};

type CurrentWeather = {
	city: string;
	country: string;
	description: string;
	icon: string; // OpenWeather icon code
	temperatureC: number;
	tempMinC?: number;
	tempMaxC?: number;
	timezoneOffsetSec?: number;
	timestamp: number;
};

type HookState = {
	data?: CurrentWeather;
	loading: boolean;
	error?: string;
};

type ForecastDay = {
	dateISO: string; // YYYY-MM-DD
	tempMinC: number;
	tempMaxC: number;
	icon?: string; // representative icon for the day
	description?: string;
};

export function __getApiKeyForTests(): string | undefined {
	return import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;
}

async function geocodeCity(city: string): Promise<GeoResult | null> {
	const OPENWEATHER_API_KEY = __getApiKeyForTests();
	if (!OPENWEATHER_API_KEY) return null;
	const url = new URL("https://api.openweathermap.org/geo/1.0/direct");
	url.searchParams.set("q", city);
	url.searchParams.set("limit", "1");
	url.searchParams.set("appid", OPENWEATHER_API_KEY);
	const res = await fetch(url.toString());
	if (!res.ok) throw new Error("Échec géocodage");
	const json = (await res.json()) as Array<{
		name: string;
		lat: number;
		lon: number;
		country: string;
		state?: string;
	}>;
	if (!json?.length) return null;
	const first = json[0];
	return {
		name: first.name,
		lat: first.lat,
		lon: first.lon,
		country: first.country,
		state: first.state,
	};
}

async function fetchCurrentWeatherByCoords(
	lat: number,
	lon: number
): Promise<CurrentWeather> {
	const OPENWEATHER_API_KEY = __getApiKeyForTests();
	if (!OPENWEATHER_API_KEY) throw new Error("Clé API manquante");
	const url = new URL("https://api.openweathermap.org/data/2.5/weather");
	url.searchParams.set("lat", String(lat));
	url.searchParams.set("lon", String(lon));
	url.searchParams.set("units", "metric");
	url.searchParams.set("lang", "fr");
	url.searchParams.set("appid", OPENWEATHER_API_KEY);
	const res = await fetch(url.toString());
	if (!res.ok) throw new Error("Échec requête météo");
	const json = await res.json();
	const weather =
		Array.isArray(json.weather) && json.weather.length
			? json.weather[0]
			: undefined;
	return {
		city: json.name,
		country: json.sys?.country ?? "",
		description: weather?.description ?? "",
		icon: weather?.icon ?? "",
		temperatureC: typeof json.main?.temp === "number" ? json.main.temp : NaN,
		tempMinC:
			typeof json.main?.temp_min === "number" ? json.main.temp_min : undefined,
		tempMaxC:
			typeof json.main?.temp_max === "number" ? json.main.temp_max : undefined,
		timezoneOffsetSec:
			typeof json.timezone === "number" ? json.timezone : undefined,
		timestamp: Date.now(),
	};
}

export function useWeather(initialCity: string) {
	const [city, setCity] = useState<string>(initialCity);
	const [{ data, loading, error }, setState] = useState<HookState>({
		loading: false,
	});
	const abortRef = useRef<AbortController | null>(null);
	const [forecast, setForecast] = useState<ForecastDay[] | undefined>(
		undefined
	);

	const iconUrl = useMemo(() => {
		if (!data?.icon) return undefined;
		return `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
	}, [data?.icon]);

	const fetchWeather = useCallback(
		async (nextCity?: string) => {
			const targetCity = (nextCity ?? city).trim();
			if (!targetCity) return;
			if (!__getApiKeyForTests()) {
				setState({
					loading: false,
					error: "VITE_OPENWEATHER_API_KEY manquante",
				});
				return;
			}

			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;

			setState((s) => ({ ...s, loading: true, error: undefined }));
			try {
				const geo = await geocodeCity(targetCity);
				if (!geo) {
					setState({ loading: false, error: "Ville introuvable" });
					return;
				}
				const wx = await fetchCurrentWeatherByCoords(geo.lat, geo.lon);
				// Préserver le nom normalisé retourné par l'API si dispo
				setState({
					loading: false,
					data: { ...wx, city: geo.name || wx.city },
				});

				// Prévisions 5 jours (3h steps) → regrouper par jour
				const fc = await fetchForecastByCoords(geo.lat, geo.lon);
				setForecast(fc);
			} catch (e: unknown) {
				if (
					e &&
					typeof e === "object" &&
					(e as { name?: string }).name === "AbortError"
				)
					return;
				const message: string =
					typeof (e as { message?: unknown })?.message === "string"
						? ((e as { message?: string }).message as string)
						: "Erreur inattendue";
				setState({ loading: false, error: message });
			}
		},
		[city]
	);

	useEffect(() => {
		fetchWeather(city);
		return () => abortRef.current?.abort();
	}, []);

	const refresh = useCallback(() => fetchWeather(), [fetchWeather]);

	return {
		city,
		setCity,
		data,
		loading,
		error,
		iconUrl,
		forecast,
		refresh,
		fetchWeather,
	} as const;
}

export type { CurrentWeather, ForecastDay };

async function fetchForecastByCoords(
	lat: number,
	lon: number
): Promise<ForecastDay[]> {
	const OPENWEATHER_API_KEY = __getApiKeyForTests();
	if (!OPENWEATHER_API_KEY) throw new Error("Clé API manquante");
	const url = new URL("https://api.openweathermap.org/data/2.5/forecast");
	url.searchParams.set("lat", String(lat));
	url.searchParams.set("lon", String(lon));
	url.searchParams.set("units", "metric");
	url.searchParams.set("lang", "fr");
	url.searchParams.set("appid", OPENWEATHER_API_KEY);
	const res = await fetch(url.toString());
	if (!res.ok) throw new Error("Échec requête prévisions");
	const json = await res.json();
	const list: Array<{
		dt: number;
		main?: { temp?: number };
		weather?: Array<{ icon?: string; description?: string }>;
	}> = Array.isArray(json.list)
		? (json.list as Array<{
				dt: number;
				main?: { temp?: number };
				weather?: Array<{ icon?: string; description?: string }>;
		  }>)
		: [];
	const byDate = new Map<
		string,
		{ min: number; max: number; icon?: string; description?: string }
	>();
	for (const entry of list) {
		const dt = typeof entry.dt === "number" ? entry.dt * 1000 : Date.now();
		const d = new Date(dt);
		const key = d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
		const temp =
			typeof entry.main?.temp === "number" ? entry.main.temp : undefined;
		const weather =
			Array.isArray(entry.weather) && entry.weather.length
				? entry.weather[0]
				: undefined;
		if (temp === undefined) continue;
		const agg = byDate.get(key) ?? {
			min: temp,
			max: temp,
			icon: undefined as string | undefined,
			description: undefined as string | undefined,
		};
		agg.min = Math.min(agg.min, temp);
		agg.max = Math.max(agg.max, temp);
		// Choisir une icône représentative si absente (prend la première rencontrée)
		if (!agg.icon && weather?.icon) {
			agg.icon = weather.icon;
			agg.description = weather?.description;
		}
		byDate.set(key, agg);
	}
	const days: ForecastDay[] = Array.from(byDate.entries())
		.slice(0, 5)
		.map(([dateISO, v]) => ({
			dateISO,
			tempMinC: Math.round(v.min),
			tempMaxC: Math.round(v.max),
			icon: v.icon,
			description: v.description,
		}));
	return days;
}

const STORAGE_KEYS = {
	lastCity: "weather:lastCity",
	savedCities: "weather:savedCities",
} as const;

export interface SavedCity {
	name: string;
	country?: string;
	lat?: number;
	lon?: number;
	timezoneOffsetSec?: number;
}

export function saveLastCity(city: string) {
	try {
		localStorage.setItem(STORAGE_KEYS.lastCity, city);
	} catch {
		// ignore
	}
}

export function loadLastCity(): string | undefined {
	try {
		const v = localStorage.getItem(STORAGE_KEYS.lastCity);
		return v ?? undefined;
	} catch {
		return undefined;
	}
}

export function loadSavedCities(): SavedCity[] {
	try {
		const v = localStorage.getItem(STORAGE_KEYS.savedCities);
		if (!v) return [];
		return JSON.parse(v) as SavedCity[];
	} catch {
		return [];
	}
}

export function saveSavedCities(cities: SavedCity[]): void {
	try {
		localStorage.setItem(STORAGE_KEYS.savedCities, JSON.stringify(cities));
	} catch {
		// ignore
	}
}

export function addSavedCity(city: SavedCity): SavedCity[] {
	const cities = loadSavedCities();
	// Éviter les doublons
	if (!cities.some((c) => c.name === city.name && c.country === city.country)) {
		cities.push(city);
		saveSavedCities(cities);
	}
	return cities;
}

export function removeSavedCity(cityName: string): SavedCity[] {
	const cities = loadSavedCities().filter((c) => c.name !== cityName);
	saveSavedCities(cities);
	return cities;
}

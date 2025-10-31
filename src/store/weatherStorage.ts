const STORAGE_KEYS = {
	lastCity: "weather:lastCity",
} as const;

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

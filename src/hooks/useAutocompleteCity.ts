import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Suggestion = {
	name: string;
	country?: string;
	state?: string;
	lat: number;
	lon: number;
};

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as
	| string
	| undefined;

export function useAutocompleteCity(
	initialQuery = "",
	debounceMs = 300,
	limit = 6,
	minChars = 3
) {
	const [query, setQuery] = useState<string>(initialQuery);
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | undefined>(undefined);
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState<number>(-1);
	const abortRef = useRef<AbortController | null>(null);
	const timerRef = useRef<number | null>(null);

	const normalized = useMemo(() => query.trim(), [query]);

	// plus de seeds; on s'appuie uniquement sur l'API une fois le seuil atteint

	const fetchSuggestions = useCallback(async () => {
		// 1) En dessous du seuil: rien
		if (normalized.length < minChars) {
			setSuggestions([]);
			setOpen(false);
			setActiveIndex(-1);
			return;
		}

		// ouvrir le popover pendant le chargement
		setOpen(true);
		if (!OPENWEATHER_API_KEY) return;
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;
		setLoading(true);
		setError(undefined);
		try {
			const url = new URL("https://api.openweathermap.org/geo/1.0/direct");
			url.searchParams.set("q", normalized);
			url.searchParams.set("limit", String(Math.max(1, limit)));
			url.searchParams.set("appid", OPENWEATHER_API_KEY!);
			const res = await fetch(url.toString(), { signal: controller.signal });
			if (!res.ok) throw new Error("Échec géocodage");
			const json = (await res.json()) as Array<{
				name: string;
				country?: string;
				state?: string;
				lat: number;
				lon: number;
			}>;
			const mapped: Suggestion[] = (json || []).map((e) => ({
				name: e.name,
				country: e.country,
				state: e.state,
				lat: e.lat,
				lon: e.lon,
			}));
			// Remove duplicates by normalized triplet (name/state/country)
			const seen = new Set<string>();
			const normalize = (v: string | undefined) =>
				(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");
			const unique = mapped.filter((s) => {
				const id = `${normalize(s.name)}|${normalize(s.state)}|${normalize(
					s.country
				)}`;
				if (seen.has(id)) return false;
				seen.add(id);
				return true;
			});
			setSuggestions(unique);
			setOpen(unique.length > 0);
			setActiveIndex(unique.length ? 0 : -1);
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
			setError(message);
			setSuggestions([]);
			setOpen(false);
			setActiveIndex(-1);
		} finally {
			setLoading(false);
		}
	}, [normalized, minChars, limit]);

	useEffect(() => {
		if (timerRef.current) window.clearTimeout(timerRef.current);
		timerRef.current = window.setTimeout(() => {
			fetchSuggestions();
		}, debounceMs) as unknown as number;
		return () => {
			if (timerRef.current) window.clearTimeout(timerRef.current);
			abortRef.current?.abort();
		};
	}, [normalized, fetchSuggestions, debounceMs]);

	const moveActive = useCallback(
		(delta: number) => {
			setActiveIndex((prev) => {
				const len = suggestions.length;
				if (!len) return -1;
				const next = (prev + delta + len) % len;
				return next;
			});
		},
		[suggestions.length]
	);

	const reset = useCallback(() => {
		setOpen(false);
		setActiveIndex(-1);
	}, []);

	return {
		query,
		setQuery,
		suggestions,
		loading,
		error,
		open,
		setOpen,
		activeIndex,
		setActiveIndex,
		moveActive,
		reset,
	} as const;
}

export type { Suggestion };

import { useState, useEffect } from "react";

/**
 * Hook pour détecter si l'utilisateur est sur mobile
 * Utilise une media query pour détecter les écrans < 768px
 */
export function useIsMobile(): boolean {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(max-width: 767px)");
		
		// Définir la valeur initiale
		setIsMobile(mediaQuery.matches);

		// Écouter les changements
		const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
			setIsMobile(e.matches);
		};

		// Support pour les anciens navigateurs
		if (mediaQuery.addEventListener) {
			mediaQuery.addEventListener("change", handleChange);
		} else {
			// Fallback pour les anciens navigateurs
			mediaQuery.addListener(handleChange as (e: MediaQueryListEvent) => void);
		}

		return () => {
			if (mediaQuery.removeEventListener) {
				mediaQuery.removeEventListener("change", handleChange);
			} else {
				mediaQuery.removeListener(handleChange as (e: MediaQueryListEvent) => void);
			}
		};
	}, []);

	return isMobile;
}


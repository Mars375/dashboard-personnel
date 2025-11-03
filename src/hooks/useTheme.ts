import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function useTheme() {
	const [theme, setTheme] = useState<Theme>(() => {
		// Vérifier si on a un thème sauvegardé
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("theme") as Theme | null;
			if (saved) {
				// Appliquer immédiatement pour éviter le flash
				const root = window.document.documentElement;
				root.classList.remove("light", "dark");
				root.classList.add(saved);
				return saved;
			}

			// Sinon, utiliser la préférence système
			const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
			const initialTheme = prefersDark ? "dark" : "light";
			const root = window.document.documentElement;
			root.classList.remove("light", "dark");
			root.classList.add(initialTheme);
			return initialTheme;
		}
		return "light";
	});

	useEffect(() => {
		const root = window.document.documentElement;

		// Retirer les classes existantes
		root.classList.remove("light", "dark");

		// Ajouter la classe du thème actuel
		root.classList.add(theme);

		// Sauvegarder dans localStorage
		localStorage.setItem("theme", theme);
	}, [theme]);

	const toggleTheme = () => {
		setTheme((prev) => (prev === "light" ? "dark" : "light"));
	};

	return { theme, setTheme, toggleTheme };
}


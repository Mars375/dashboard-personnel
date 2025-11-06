import { create } from "zustand";
import { persist } from "zustand/middleware";
import { widgetRegistry } from "@/lib/widgetRegistry";

export interface WidgetLayout {
	id: string; // ID unique du widget (ex: "weather-1")
	type: string; // "weather" | "todo" | "calendar"
	x: number; // Position X en colonnes
	y: number; // Position Y en lignes
	w: number; // Largeur en colonnes
	h: number; // Hauteur en lignes
	minW?: number; // Largeur minimale
	minH?: number; // Hauteur minimale
	maxW?: number; // Largeur maximale
	maxH?: number; // Hauteur maximale
}

interface DashboardState {
	// Layout actuel
	widgets: WidgetLayout[];

	// Actions
	addWidget: (type: string, position?: { x: number; y: number }) => void;
	removeWidget: (id: string) => void;
	updateLayout: (layouts: WidgetLayout[]) => void;

	// Widget picker
	isPickerOpen: boolean;
	openPicker: () => void;
	closePicker: () => void;
}

// Layout par défaut
const defaultLayout: WidgetLayout[] = [
	{ id: "weather-1", type: "weather", x: 0, y: 0, w: 2, h: 3, minW: 2, minH: 3 },
	{ id: "todo-1", type: "todo", x: 4, y: 0, w: 4, h: 6, minW: 2, minH: 4 },
	{ id: "calendar-1", type: "calendar", x: 8, y: 0, w: 4, h: 6, minW: 2, minH: 3 },
];

export const useDashboardStore = create<DashboardState>()(
	persist(
		(set) => ({
			widgets: defaultLayout,
			isPickerOpen: false,

				addWidget: (type, position) => {
					set((state) => {
						// Générer un ID unique
						const existingIds = state.widgets.map((w) => w.id);
						let id = `${type}-1`;
						let counter = 1;
						while (existingIds.includes(id)) {
							counter++;
							id = `${type}-${counter}`;
						}

						// Trouver la prochaine position disponible
						let x = position?.x ?? 0;
						let y = position?.y ?? 0;

						// Si pas de position spécifiée, trouver un emplacement libre
						if (!position) {
							const occupied = state.widgets.map((w) => ({ x: w.x, y: w.y, w: w.w, h: w.h }));
							// Trouver première position libre
							let found = false;
							for (let testY = 0; testY < 20 && !found; testY++) {
								for (let testX = 0; testX < 12 && !found; testX++) {
									const overlapping = occupied.some(
										(o) =>
											testX < o.x + o.w &&
											testX + 4 > o.x &&
											testY < o.y + o.h &&
											testY + 3 > o.y,
									);
									if (!overlapping) {
										x = testX;
										y = testY;
										found = true;
									}
								}
							}
						}

						// Tailles par défaut selon le type
						// Les tailles sont maintenant fixes selon WIDGET_SIZE_THRESHOLDS :
						// - Compact : w ≤ 3, h ≤ 3, aire ≤ 9 (ex: 2x3, 3x3)
						// - Medium : w ≤ 5, h ≤ 6, aire ≤ 30 (ex: 4x4, 4x5, 4x6, 5x5, 5x6)
						// - Full : w > 5 OU h > 6 OU aire > 30 (ex: 6x6, 8x4, 6x8)
						const sizes: Record<string, { w: number; h: number; minW: number; minH: number }> = {
							// Weather Widget - Même taille compacte que Pomodoro (2x3)
							weather: { w: 2, h: 3, minW: 2, minH: 3 }, // Compact (2x3=6) - même taille que Pomodoro
							// Tailles possibles :
							// - Compact : 2x3 (6) - même taille que Pomodoro
							// - Medium : 4x4 (16), 4x5 (20), 5x4 (20), 5x5 (25)
							// - Full : 6x4 (24 mais w>5), 6x6 (36), 8x4 (32)
							
							// Todo Widget
							todo: { w: 4, h: 6, minW: 2, minH: 4 }, // Medium (4x6=24)
							// Tailles possibles :
							// - Compact : 3x3 (9) - limité car minH=4
							// - Medium : 4x4 (16), 4x5 (20), 4x6 (24), 5x5 (25), 5x6 (30)
							// - Full : 6x6 (36), 6x8 (48), 8x6 (48)
							
							// Calendar Widget - Redimensionnable librement
							calendar: { w: 4, h: 6, minW: 2, minH: 3 }, // Medium (4x6=24)
							// Tailles possibles (redimensionnable librement) :
							// - Compact : 2x3 (6), 3x3 (9)
							// - Medium : 4x4 (16), 4x5 (20), 4x6 (24), 5x5 (25), 5x6 (30)
							// - Full : 6x6 (36), 6x8 (48), 8x6 (48), 8x8 (64), etc.
							bookmarks: { w: 4, h: 6, minW: 2, minH: 3 }, // Medium (4x6=24) - Permet version compacte plus petite
						habits: { w: 4, h: 6, minW: 2, minH: 3 }, // Medium (4x6=24)
						journal: { w: 4, h: 6, minW: 2, minH: 3 }, // Medium (4x6=24)
						finance: { w: 4, h: 6, minW: 2, minH: 3 }, // Medium (4x6=24)
							pomodoro: { w: 3, h: 4, minW: 2, minH: 3 }, // Compact (3x4=12)
							stats: { w: 4, h: 6, minW: 2, minH: 4 }, // Medium (4x6=24)
							// Tailles possibles :
							// - Compact : 2x3 (6), 2x4 (8), 3x3 (9), 3x4 (12 mais h>3 donc medium)
							// - Medium : 4x4 (16), 4x5 (20), 4x6 (24), 5x5 (25), 5x6 (30) - TAILLE MAXIMALE (bloquée à medium)
						rss: { w: 4, h: 6, minW: 2, minH: 3 }, // Medium (4x6=24)
						quote: { w: 3, h: 3, minW: 2, minH: 2 }, // Compact (3x3=9)
						stock: { w: 4, h: 6, minW: 2, minH: 3 }, // Medium (4x6=24)
						};

						const defaultSize = sizes[type] || { w: 4, h: 4, minW: 2, minH: 2 };

						const newWidget: WidgetLayout = {
							id,
							type,
							x,
							y,
							w: defaultSize.w,
							h: defaultSize.h,
							minW: defaultSize.minW,
							minH: defaultSize.minH,
						};

						return {
							widgets: [...state.widgets, newWidget],
						};
					});
			},

			removeWidget: (id) => {
				set((state) => ({
					widgets: state.widgets.filter((w) => w.id !== id),
				}));
			},

			updateLayout: (layouts) => {
				set({ widgets: layouts });
			},

			openPicker: () => set({ isPickerOpen: true }),
			closePicker: () => set({ isPickerOpen: false }),
		}),
		{
			name: "dashboard-layout",
			onRehydrateStorage: () => (state) => {
				// Migration : Mettre à jour les contraintes minW/minH de tous les widgets
				// pour qu'elles correspondent aux valeurs dans widgetRegistry
				// Cela garantit que les widgets peuvent être réduits correctement
				if (state && state.widgets) {
					state.widgets = state.widgets.map((widget) => {
						const widgetDef = widgetRegistry.find((def) => def.id === widget.type);
						if (widgetDef) {
							// Mettre à jour minW/minH pour correspondre à widgetRegistry (source de vérité)
							return {
								...widget,
								minW: widgetDef.minSize.w,
								minH: widgetDef.minSize.h,
							};
						}
						return widget;
					});
				}
			},
		},
	),
);





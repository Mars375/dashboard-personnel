import { create } from "zustand";
import { persist } from "zustand/middleware";

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
	{ id: "weather-1", type: "weather", x: 0, y: 0, w: 4, h: 3 },
	{ id: "todo-1", type: "todo", x: 4, y: 0, w: 4, h: 6 },
	{ id: "calendar-1", type: "calendar", x: 8, y: 0, w: 4, h: 6 },
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
					const sizes: Record<string, { w: number; h: number; minW: number; minH: number }> = {
						weather: { w: 4, h: 3, minW: 3, minH: 3 },
						todo: { w: 4, h: 6, minW: 3, minH: 4 },
						calendar: { w: 4, h: 6, minW: 3, minH: 5 },
						notes: { w: 4, h: 6, minW: 3, minH: 4 },
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
		},
	),
);





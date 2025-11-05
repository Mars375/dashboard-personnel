/**
 * Storage pour le widget Graphiques
 */

export interface ChartData {
	id: string;
	name: string;
	type: "line" | "bar" | "pie" | "area";
	data: Array<{ x: string; y: number }>;
	createdAt: number;
}

const STORAGE_KEY = "graphiques:charts";

export function loadCharts(): ChartData[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		console.error("Erreur lors du chargement des graphiques:", error);
	}
	return [];
}

export function saveCharts(charts: ChartData[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
	} catch (error) {
		console.error("Erreur lors de la sauvegarde des graphiques:", error);
	}
}

export function addChart(chart: Omit<ChartData, "id" | "createdAt">): ChartData {
	const charts = loadCharts();
	const newChart: ChartData = {
		...chart,
		id: crypto.randomUUID(),
		createdAt: Date.now(),
	};
	charts.push(newChart);
	saveCharts(charts);
	return newChart;
}

export function updateChart(id: string, updates: Partial<Omit<ChartData, "id" | "createdAt">>): ChartData | null {
	const charts = loadCharts();
	const index = charts.findIndex((c) => c.id === id);
	if (index === -1) return null;
	charts[index] = { ...charts[index], ...updates };
	saveCharts(charts);
	return charts[index];
}

export function deleteChart(id: string): void {
	const charts = loadCharts();
	const filtered = charts.filter((c) => c.id !== id);
	saveCharts(filtered);
}


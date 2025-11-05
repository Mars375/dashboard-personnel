// src/widgets/Graphiques/GraphiquesWidget.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { Plus, Edit2, Trash2, LineChart } from "lucide-react";
import type { WidgetProps } from "@/lib/widgetSize";
import {
	loadCharts,
	addChart,
	updateChart,
	deleteChart,
	type ChartData,
} from "@/store/graphiquesStorage";
import { cn } from "@/lib/utils";
import { LazyPieChart, LazyPie, LazyCell } from "@/components/ui/chart-lazy";

function GraphiquesWidgetComponent({ size = "medium" }: WidgetProps) {
	const [charts, setCharts] = useState<ChartData[]>(() => loadCharts());
	const [selectedChart, setSelectedChart] = useState<ChartData | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editName, setEditName] = useState("");
	const [editType, setEditType] = useState<"line" | "bar" | "pie" | "area">("line");

	const isCompact = useMemo(() => size === "compact", [size]);
	const isFull = useMemo(() => size === "full" || size === "medium", [size]);
	const padding = isCompact ? "p-2" : "p-4";
	const gap = isCompact ? "gap-1" : "gap-2";

	useEffect(() => {
		setCharts(loadCharts());
	}, []);

	const handleAddChart = useCallback(() => {
		setSelectedChart(null);
		setEditName("");
		setEditType("line");
		setIsDialogOpen(true);
	}, []);

	const handleEditChart = useCallback((chart: ChartData) => {
		setSelectedChart(chart);
		setEditName(chart.name);
		setEditType(chart.type);
		setIsDialogOpen(true);
	}, []);

	const handleSaveChart = useCallback(() => {
		if (!editName.trim()) return;
		// Données d'exemple pour MVP
		const sampleData = [
			{ x: "Jan", y: 10 },
			{ x: "Fév", y: 20 },
			{ x: "Mar", y: 15 },
			{ x: "Avr", y: 25 },
		];
		if (selectedChart) {
			updateChart(selectedChart.id, {
				name: editName,
				type: editType,
				data: sampleData,
			});
		} else {
			addChart({
				name: editName,
				type: editType,
				data: sampleData,
			});
		}
		setCharts(loadCharts());
		setIsDialogOpen(false);
	}, [selectedChart, editName, editType]);

	const handleDeleteChart = useCallback((id: string) => {
		if (confirm("Supprimer ce graphique ?")) {
			deleteChart(id);
			setCharts(loadCharts());
		}
	}, []);

	const COLORS = [
		"hsl(var(--chart-1))",
		"hsl(var(--chart-2))",
		"hsl(var(--chart-3))",
		"hsl(var(--chart-4))",
		"hsl(var(--chart-5))",
	];

	return (
		<Card className={cn("w-full h-full max-w-none flex flex-col min-h-0", padding, gap)}>
			{isFull && (
				<div className="space-y-2 shrink-0">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold">Graphiques</h3>
						<Button
							size="sm"
							onClick={handleAddChart}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<Plus className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}

			{isCompact && (
				<div className="flex flex-col items-center justify-center gap-1 flex-1">
					<LineChart className="h-8 w-8 text-muted-foreground" />
					<div className="text-xs font-bold">{charts.length}</div>
					<div className="text-[10px] text-muted-foreground">graphique{charts.length > 1 ? "s" : ""}</div>
				</div>
			)}

			{isFull && (
				<div className="flex-1 overflow-y-auto space-y-2">
					{charts.length === 0 ? (
						<div className="text-sm text-muted-foreground text-center py-8">
							Aucun graphique
						</div>
					) : (
						charts.map((chart) => (
							<motion.div
								key={chart.id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className="p-3 rounded-md border bg-card"
							>
								<div className="flex items-center justify-between mb-2">
									<div className="font-medium">{chart.name}</div>
									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6"
											onClick={(e) => {
												e.stopPropagation();
												handleEditChart(chart);
											}}
											onMouseDown={(e: React.MouseEvent) => {
												e.stopPropagation();
											}}
											onDragStart={(e: React.DragEvent) => {
												e.preventDefault();
												e.stopPropagation();
											}}
										>
											<Edit2 className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6 text-destructive"
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteChart(chart.id);
											}}
											onMouseDown={(e: React.MouseEvent) => {
												e.stopPropagation();
											}}
											onDragStart={(e: React.DragEvent) => {
												e.preventDefault();
												e.stopPropagation();
											}}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
								{chart.type === "pie" && (
									<div className="h-[150px]">
										<LazyPieChart width={250} height={150}>
											<LazyPie
												data={chart.data.map((d) => ({ name: d.x, value: d.y }))}
												dataKey="value"
												nameKey="name"
												cx="50%"
												cy="50%"
												outerRadius={50}
											>
												{chart.data.map((_, index) => (
													<LazyCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
												))}
											</LazyPie>
										</LazyPieChart>
									</div>
								)}
							</motion.div>
						))
					)}
				</div>
			)}

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{selectedChart ? "Modifier" : "Créer"} un graphique</DialogTitle>
						<DialogDescription>Créez un graphique personnalisé.</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<Input
							placeholder="Nom du graphique"
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
						/>
						<Select value={editType} onValueChange={(value) => setEditType(value as typeof editType)}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="line">Ligne</SelectItem>
								<SelectItem value="bar">Barres</SelectItem>
								<SelectItem value="pie">Camembert</SelectItem>
								<SelectItem value="area">Aire</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<DialogFooter>
						{selectedChart && (
							<Button
								variant="destructive"
								onClick={() => {
									handleDeleteChart(selectedChart.id);
									setIsDialogOpen(false);
								}}
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Supprimer
							</Button>
						)}
						<Button
							variant="outline"
							onClick={() => setIsDialogOpen(false)}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							Annuler
						</Button>
						<Button
							onClick={handleSaveChart}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							Enregistrer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}

export const GraphiquesWidget = memo(GraphiquesWidgetComponent);


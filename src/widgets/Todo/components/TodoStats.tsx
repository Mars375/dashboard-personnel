/**
 * Composant TodoStats - Statistiques et graphiques pour les tâches
 * Extrait de TodoWidget pour améliorer la maintenabilité
 */

import { memo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import { BarChart3, PieChart } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TodoStatsProps {
	totalCount: number;
	activeCount: number;
	completedCount: number;
	priorityCount: number;
	overdueCount: number;
	progressPercentage: number;
	size?: "compact" | "medium" | "full";
	chartConfig?: {
		[key: string]: {
			label: string;
			color: string;
		};
	};
	statusChartData?: Array<{
		name: string;
		value: number;
		fill: string;
	}>;
	priorityChartData?: Array<{
		name: string;
		value: number;
		fill: string;
	}>;
}

function TodoStatsComponent({
	totalCount,
	activeCount,
	completedCount,
	priorityCount,
	overdueCount,
	progressPercentage,
	size = "full",
	chartConfig,
	statusChartData,
	priorityChartData,
}: TodoStatsProps) {
	const [showStats, setShowStats] = useState(false);

	const isCompact = size === "compact";
	const isMedium = size === "medium";
	const isFull = size === "full";

	// Version compacte : stats minimales dans le header
	if (isCompact) {
		return null; // Les stats compactes sont gérées dans le header
	}

	// Version medium : stats compactes
	if (isMedium) {
		return (
			totalCount > 0 && (
				<div className="space-y-2">
					<div className="flex items-center justify-between text-xs">
						<span className="text-muted-foreground">Progression</span>
						<span className="font-medium">{progressPercentage}%</span>
					</div>
					<Progress value={progressPercentage} className="h-1.5" />
					<div className="flex gap-3 text-xs text-muted-foreground">
						<span>{activeCount} actives</span>
						<span>{completedCount} terminées</span>
						{priorityCount > 0 && <span>{priorityCount} ⭐</span>}
						{overdueCount > 0 && (
							<span className="text-red-600 font-medium">
								{overdueCount} en retard
							</span>
						)}
					</div>
				</div>
			)
		);
	}

	// Version full : stats complètes avec graphiques
	if (!chartConfig || !statusChartData || !priorityChartData) {
		return null;
	}

	return (
		totalCount > 0 && (
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center justify-between text-sm flex-1">
						<span className="text-muted-foreground">Progression</span>
						<span className="font-medium">{progressPercentage}%</span>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowStats(!showStats)}
						className="h-8"
						aria-label="Afficher les statistiques"
					>
						{showStats ? (
							<BarChart3 className="h-4 w-4" />
						) : (
							<PieChart className="h-4 w-4" />
						)}
					</Button>
				</div>
				<Progress value={progressPercentage} className="w-full" />
				<div className="flex gap-4 text-xs text-muted-foreground">
					<span>
						{activeCount} active{activeCount !== 1 ? "s" : ""}
					</span>
					<span>
						{completedCount} terminée{completedCount !== 1 ? "s" : ""}
					</span>
					{priorityCount > 0 && (
						<span>
							{priorityCount} prioritaire{priorityCount !== 1 ? "s" : ""}
						</span>
					)}
					{overdueCount > 0 && (
						<span className="text-red-600 font-medium">
							{overdueCount} en retard
						</span>
					)}
				</div>

				{/* Visual Statistics Charts */}
				{showStats && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="grid grid-cols-2 gap-4 pt-2"
					>
						{/* Status Pie Chart */}
						<div className="space-y-2">
							<h4 className="text-xs font-medium text-muted-foreground">
								Par statut
							</h4>
							<ChartContainer config={chartConfig} className="h-[120px]">
								<RechartsPieChart>
									<ChartTooltip
										content={<ChartTooltipContent hideLabel />}
									/>
									<Pie
										data={statusChartData}
										dataKey="value"
										nameKey="name"
										cx="50%"
										cy="50%"
										outerRadius={50}
									>
										{statusChartData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.fill} />
										))}
									</Pie>
								</RechartsPieChart>
							</ChartContainer>
						</div>

						{/* Priority Pie Chart */}
						{priorityCount > 0 && (
							<div className="space-y-2">
								<h4 className="text-xs font-medium text-muted-foreground">
									Par priorité
								</h4>
								<ChartContainer config={chartConfig} className="h-[120px]">
									<RechartsPieChart>
										<ChartTooltip
											content={<ChartTooltipContent hideLabel />}
										/>
										<Pie
											data={priorityChartData}
											dataKey="value"
											nameKey="name"
											cx="50%"
											cy="50%"
											outerRadius={50}
										>
											{priorityChartData.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.fill} />
											))}
										</Pie>
									</RechartsPieChart>
								</ChartContainer>
							</div>
						)}
					</motion.div>
				)}
			</div>
		)
	);
}

export const TodoStats = memo(TodoStatsComponent);


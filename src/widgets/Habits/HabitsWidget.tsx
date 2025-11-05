// src/widgets/Habits/HabitsWidget.tsx
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
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { Plus, Check, X, Flame, Calendar, Edit2, Trash2 } from "lucide-react";
import type { WidgetProps } from "@/lib/widgetSize";
import {
	loadHabits,
	addHabit,
	updateHabit,
	deleteHabit,
	completeHabit,
	uncompleteHabit,
	type Habit,
} from "@/store/habitsStorage";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function HabitsWidgetComponent({ size = "medium" }: WidgetProps) {
	const [habits, setHabits] = useState<Habit[]>(() => loadHabits());
	const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editName, setEditName] = useState("");
	const [editDescription, setEditDescription] = useState("");

	const isCompact = useMemo(() => size === "compact", [size]);
	const isFull = useMemo(() => size === "full" || size === "medium", [size]);

	useEffect(() => {
		setHabits(loadHabits());
	}, []);

	const today = useMemo(() => new Date().toISOString().split("T")[0], []);

	const handleAddHabit = useCallback(() => {
		const newHabit = addHabit({
			name: "Nouvelle habitude",
			description: "",
		});
		setHabits(loadHabits());
		setSelectedHabit(newHabit);
		setEditName(newHabit.name);
		setEditDescription(newHabit.description || "");
		setIsDialogOpen(true);
	}, []);

	const handleEditHabit = useCallback((habit: Habit) => {
		setSelectedHabit(habit);
		setEditName(habit.name);
		setEditDescription(habit.description || "");
		setIsDialogOpen(true);
	}, []);

	const handleSaveHabit = useCallback(() => {
		if (!selectedHabit) return;
		
		updateHabit(selectedHabit.id, {
			name: editName || "Sans nom",
			description: editDescription,
		});
		setHabits(loadHabits());
		setIsDialogOpen(false);
		setSelectedHabit(null);
	}, [selectedHabit, editName, editDescription]);

	const handleDeleteHabit = useCallback((id: string) => {
		if (confirm("Supprimer cette habitude ?")) {
			deleteHabit(id);
			setHabits(loadHabits());
			if (selectedHabit?.id === id) {
				setIsDialogOpen(false);
				setSelectedHabit(null);
			}
		}
	}, [selectedHabit]);

	const handleToggleComplete = useCallback((habit: Habit) => {
		const isCompleted = habit.completedDates.includes(today);
		if (isCompleted) {
			uncompleteHabit(habit.id);
		} else {
			completeHabit(habit.id);
		}
		setHabits(loadHabits());
	}, [today]);

	const padding = isCompact ? "p-2" : "p-4";
	const gap = isCompact ? "gap-1" : "gap-2";

	return (
		<Card
			className={cn(
				"w-full h-full max-w-none flex flex-col min-h-0",
				padding,
				gap,
				isCompact ? "overflow-hidden" : "overflow-auto"
			)}
		>
			{/* Header */}
			{isFull && (
				<div className="flex items-center justify-between shrink-0">
					<h3 className="text-sm font-semibold">Habitudes</h3>
					<Button
						size="sm"
						onClick={handleAddHabit}
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
			)}

			{/* Habits List */}
			<div className="flex-1 overflow-y-auto">
				{habits.length === 0 ? (
					<div className="text-sm text-muted-foreground text-center py-8">
						Aucune habitude
					</div>
				) : (
					<div className={cn("flex flex-col", isCompact ? "gap-1" : "gap-2")}>
						{habits.map((habit) => {
							const isCompleted = habit.completedDates.includes(today);
							return (
								<motion.div
									key={habit.id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									className={cn(
										"p-2 rounded-md border cursor-pointer hover:bg-accent transition-colors",
										isCompleted && "bg-primary/10 border-primary/20",
										isCompact && "p-1.5 text-xs"
									)}
									onClick={() => handleToggleComplete(habit)}
								>
									<div className="flex items-center gap-2">
										<Button
											variant="ghost"
											size="icon"
											className={cn(
												"h-6 w-6 shrink-0",
												isCompleted && "bg-primary text-primary-foreground"
											)}
											onClick={(e) => {
												e.stopPropagation();
												handleToggleComplete(habit);
											}}
											onMouseDown={(e: React.MouseEvent) => {
												e.stopPropagation();
											}}
											onDragStart={(e: React.DragEvent) => {
												e.preventDefault();
												e.stopPropagation();
											}}
										>
											{isCompleted ? (
												<Check className="h-4 w-4" />
											) : (
												<X className="h-4 w-4" />
											)}
										</Button>
										<div className="flex-1 min-w-0">
											<div className={cn("font-medium", isCompact && "text-xs")}>
												{habit.name}
											</div>
											<div className="flex items-center gap-2 mt-1">
												{habit.streak > 0 && (
													<div className="flex items-center gap-1 text-xs text-muted-foreground">
														<Flame className="h-3 w-3 text-orange-500" />
														<span>{habit.streak}</span>
													</div>
												)}
												{habit.lastCompleted && (
													<div className="flex items-center gap-1 text-xs text-muted-foreground">
														<Calendar className="h-3 w-3" />
														<span>
															{format(new Date(habit.lastCompleted), "PPP", { locale: fr })}
														</span>
													</div>
												)}
											</div>
										</div>
										{isFull && (
											<div className="flex items-center gap-1 shrink-0">
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6"
													onClick={(e) => {
														e.stopPropagation();
														handleEditHabit(habit);
													}}
													onMouseDown={(e: React.MouseEvent) => {
														e.stopPropagation();
													}}
													onDragStart={(e: React.DragEvent) => {
														e.preventDefault();
														e.stopPropagation();
													}}
													aria-label="Modifier"
												>
													<Edit2 className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6 text-destructive hover:text-destructive"
													onClick={(e) => {
														e.stopPropagation();
														handleDeleteHabit(habit.id);
													}}
													onMouseDown={(e: React.MouseEvent) => {
														e.stopPropagation();
													}}
													onDragStart={(e: React.DragEvent) => {
														e.preventDefault();
														e.stopPropagation();
													}}
													aria-label="Supprimer"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										)}
									</div>
								</motion.div>
							);
						})}
					</div>
				)}
			</div>

			{/* Compact Add Button */}
			{isCompact && (
				<Button
					size="sm"
					onClick={handleAddHabit}
					className="shrink-0"
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
			)}

			{/* Edit Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Modifier l'habitude</DialogTitle>
						<DialogDescription>
							Modifiez le nom et la description de votre habitude
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<Input
							placeholder="Nom"
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
						/>
						<Input
							placeholder="Description (optionnel)"
							value={editDescription}
							onChange={(e) => setEditDescription(e.target.value)}
						/>
					</div>
					<DialogFooter>
						{selectedHabit && (
							<Button
								variant="destructive"
								onClick={() => {
									handleDeleteHabit(selectedHabit.id);
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
							onClick={handleSaveHabit}
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

export const HabitsWidget = memo(HabitsWidgetComponent);


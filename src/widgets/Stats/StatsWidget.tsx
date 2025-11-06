// src/widgets/Stats/StatsWidget.tsx
import { Card } from "@/components/ui/card";
import { useState, useEffect, useMemo, memo } from "react";
import { BarChart3, CheckSquare, Calendar, Target, DollarSign } from "lucide-react";
import type { WidgetProps } from "@/lib/widgetSize";
import { loadHabits } from "@/store/habitsStorage";
import { loadJournalEntries } from "@/store/journalStorage";
import { loadTransactions } from "@/store/financeStorage";
import type { Todo } from "@/store/todoStorage";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth } from "date-fns";

function StatsWidgetComponent({ size = "medium" }: WidgetProps) {
	const [todos, setTodos] = useState(() => {
		try {
			const stored = localStorage.getItem("todos:todos");
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	});
	const [habits, setHabits] = useState(() => loadHabits());
	const [entries, setEntries] = useState(() => loadJournalEntries());
	const [transactions, setTransactions] = useState(() => loadTransactions());

	const isCompact = useMemo(() => size === "compact", [size]);
	const isMedium = useMemo(() => size === "medium", [size]);
	const isFull = useMemo(() => size === "full", [size]);
	const padding = isCompact ? "p-2" : isMedium ? "p-3" : "p-4";

	useEffect(() => {
		try {
			const stored = localStorage.getItem("todos:todos");
			setTodos(stored ? JSON.parse(stored) : []);
		} catch {
			setTodos([]);
		}
		setHabits(loadHabits());
		setEntries(loadJournalEntries());
		setTransactions(loadTransactions());
	}, []);

	const stats = useMemo(() => {
		const monthStart = startOfMonth(new Date());
		const monthEnd = endOfMonth(new Date());
		
		const monthTodos = todos.filter((t: Todo) => {
			if (!t.deadline) return false;
			const deadline = new Date(t.deadline);
			return deadline >= monthStart && deadline <= monthEnd;
		});
		
		const monthTransactions = transactions.filter((t: { date: string }) => {
			const tDate = new Date(t.date);
			return tDate >= monthStart && tDate <= monthEnd;
		});

		return {
			todos: {
				total: todos.length,
				completed: todos.filter((t: Todo) => t.completed).length,
				thisMonth: monthTodos.length,
			},
			habits: {
				total: habits.length,
				completedToday: habits.filter((h) => 
					h.completedDates.includes(format(new Date(), "yyyy-MM-dd"))
				).length,
			},
			journal: {
				total: entries.length,
			},
			finance: {
				income: monthTransactions
					.filter((t) => t.type === "income")
					.reduce((sum, t) => sum + t.amount, 0),
				expenses: monthTransactions
					.filter((t) => t.type === "expense")
					.reduce((sum, t) => sum + t.amount, 0),
			},
		};
	}, [todos, habits, entries, transactions]);

	// Calcul des pourcentages pour la version medium
	const todosPercentage = stats.todos.total > 0 
		? Math.round((stats.todos.completed / stats.todos.total) * 100) 
		: 0;
	const habitsPercentage = stats.habits.total > 0 
		? Math.round((stats.habits.completedToday / stats.habits.total) * 100) 
		: 0;

	return (
		<Card className={cn("w-full h-full max-w-none flex flex-col min-h-0", padding)}>
			{isCompact ? (
				/* VERSION COMPACTE - Ultra minimaliste, juste icônes et valeurs */
				<div className="flex flex-col h-full gap-0.5">
					{/* Grille 2x2 des 4 stats - Version ultra compacte */}
					<div className="grid grid-cols-2 gap-0.5 flex-1">
						{/* Tâches */}
						<div className="rounded border bg-card p-1 flex flex-col items-center justify-center gap-0.5">
							<CheckSquare className="h-3 w-3 text-blue-500" />
							<div className="text-[10px] font-bold leading-tight">
								{stats.todos.completed}/{stats.todos.total}
							</div>
						</div>
						
						{/* Habitudes */}
						<div className="rounded border bg-card p-1 flex flex-col items-center justify-center gap-0.5">
							<Target className="h-3 w-3 text-orange-500" />
							<div className="text-[10px] font-bold leading-tight">
								{stats.habits.completedToday}/{stats.habits.total}
							</div>
						</div>
						
						{/* Journal */}
						<div className="rounded border bg-card p-1 flex flex-col items-center justify-center gap-0.5">
							<Calendar className="h-3 w-3 text-green-500" />
							<div className="text-[10px] font-bold leading-tight">
								{stats.journal.total}
							</div>
						</div>
						
						{/* Finance */}
						<div className="rounded border bg-card p-1 flex flex-col items-center justify-center gap-0.5">
							<DollarSign className="h-3 w-3 text-purple-500" />
							<div className="text-[10px] font-bold leading-tight">
								{(stats.finance.income - stats.finance.expenses).toFixed(0)}€
							</div>
						</div>
					</div>
				</div>
			) : isMedium ? (
				/* VERSION MEDIUM - Détails enrichis avec informations supplémentaires */
				<div className="flex flex-col h-full gap-2">
					{/* Header */}
					<div className="flex items-center gap-2 shrink-0">
						<BarChart3 className="h-4 w-4" />
						<h3 className="text-xs font-semibold">Statistiques</h3>
					</div>
					
					{/* Grille 2x2 avec détails */}
					<div className="grid grid-cols-2 gap-2 flex-1">
						{/* Tâches - avec pourcentage et ce mois */}
						<div className="rounded-md border bg-card p-2 flex flex-col">
							<div className="flex items-center gap-1.5 mb-1.5">
								<CheckSquare className="h-3.5 w-3.5 text-blue-500" />
								<div className="text-[10px] text-muted-foreground font-medium">Tâches</div>
							</div>
							<div className="text-lg font-bold mb-0.5">
								{stats.todos.completed}/{stats.todos.total}
							</div>
							<div className="text-[9px] text-muted-foreground mb-1">
								{todosPercentage}% complétées
							</div>
							<div className="text-[9px] text-muted-foreground">
								{stats.todos.thisMonth} ce mois
							</div>
						</div>
						
						{/* Habitudes - avec pourcentage */}
						<div className="rounded-md border bg-card p-2 flex flex-col">
							<div className="flex items-center gap-1.5 mb-1.5">
								<Target className="h-3.5 w-3.5 text-orange-500" />
								<div className="text-[10px] text-muted-foreground font-medium">Habitudes</div>
							</div>
							<div className="text-lg font-bold mb-0.5">
								{stats.habits.completedToday}/{stats.habits.total}
							</div>
							<div className="text-[9px] text-muted-foreground mb-1">
								{habitsPercentage}% aujourd'hui
							</div>
							<div className="text-[9px] text-muted-foreground">
								{stats.habits.total} au total
							</div>
						</div>
						
						{/* Journal */}
						<div className="rounded-md border bg-card p-2 flex flex-col">
							<div className="flex items-center gap-1.5 mb-1.5">
								<Calendar className="h-3.5 w-3.5 text-green-500" />
								<div className="text-[10px] text-muted-foreground font-medium">Journal</div>
							</div>
							<div className="text-lg font-bold mb-0.5">
								{stats.journal.total}
							</div>
							<div className="text-[9px] text-muted-foreground">
								Entrées totales
							</div>
						</div>
						
						{/* Finance - avec revenus et dépenses */}
						<div className="rounded-md border bg-card p-2 flex flex-col">
							<div className="flex items-center gap-1.5 mb-1.5">
								<DollarSign className="h-3.5 w-3.5 text-purple-500" />
								<div className="text-[10px] text-muted-foreground font-medium">Finance</div>
							</div>
							<div className="text-lg font-bold mb-0.5">
								{(stats.finance.income - stats.finance.expenses).toFixed(0)}€
							</div>
							<div className="text-[9px] text-muted-foreground mb-0.5">
								<span className="text-green-600 dark:text-green-400">+{stats.finance.income.toFixed(0)}€</span>
								{" / "}
								<span className="text-red-600 dark:text-red-400">-{stats.finance.expenses.toFixed(0)}€</span>
							</div>
							<div className="text-[9px] text-muted-foreground">
								Ce mois
							</div>
						</div>
					</div>
				</div>
			) : isFull ? (
				/* VERSION FULL - Version complète avec TOUTES les informations détaillées */
				<div className="flex flex-col h-full gap-3">
					{/* Header avec titre */}
					<div className="flex items-center gap-2 shrink-0 pb-2 border-b">
						<BarChart3 className="h-5 w-5" />
						<h3 className="text-sm font-semibold">Statistiques Globales</h3>
					</div>
					
					{/* Grille 2x2 avec informations complètes */}
					<div className="grid grid-cols-2 gap-3 flex-1">
						{/* Tâches - Version complète */}
						<div className="rounded-lg border bg-card p-3 flex flex-col">
							<div className="flex items-center gap-2 mb-2">
								<CheckSquare className="text-blue-500 h-5 w-5" />
								<div className="text-sm font-medium">Tâches</div>
							</div>
							<div className="text-3xl font-bold mb-1">
								{stats.todos.completed}/{stats.todos.total}
							</div>
							<div className="text-xs text-muted-foreground mb-2">
								{todosPercentage}% complétées
							</div>
							<div className="text-xs text-muted-foreground border-t pt-2">
								{stats.todos.thisMonth} tâches ce mois
							</div>
						</div>
						
						{/* Habitudes - Version complète */}
						<div className="rounded-lg border bg-card p-3 flex flex-col">
							<div className="flex items-center gap-2 mb-2">
								<Target className="text-orange-500 h-5 w-5" />
								<div className="text-sm font-medium">Habitudes</div>
							</div>
							<div className="text-3xl font-bold mb-1">
								{stats.habits.completedToday}/{stats.habits.total}
							</div>
							<div className="text-xs text-muted-foreground mb-2">
								{habitsPercentage}% aujourd'hui
							</div>
							<div className="text-xs text-muted-foreground border-t pt-2">
								{stats.habits.total} habitudes au total
							</div>
						</div>
						
						{/* Journal - Version complète */}
						<div className="rounded-lg border bg-card p-3 flex flex-col">
							<div className="flex items-center gap-2 mb-2">
								<Calendar className="text-green-500 h-5 w-5" />
								<div className="text-sm font-medium">Journal</div>
							</div>
							<div className="text-3xl font-bold mb-1">
								{stats.journal.total}
							</div>
							<div className="text-xs text-muted-foreground mb-2">
								Entrées totales
							</div>
							<div className="text-xs text-muted-foreground border-t pt-2">
								Suivi quotidien
							</div>
						</div>
						
						{/* Finance - Version complète */}
						<div className="rounded-lg border bg-card p-3 flex flex-col">
							<div className="flex items-center gap-2 mb-2">
								<DollarSign className="text-purple-500 h-5 w-5" />
								<div className="text-sm font-medium">Finance</div>
							</div>
							<div className="text-3xl font-bold mb-1">
								{(stats.finance.income - stats.finance.expenses).toFixed(0)}€
							</div>
							<div className="text-xs text-muted-foreground mb-2">
								Solde du mois
							</div>
							<div className="text-xs text-muted-foreground border-t pt-2 space-y-0.5">
								<div className="text-green-600 dark:text-green-400">
									+{stats.finance.income.toFixed(0)}€ revenus
								</div>
								<div className="text-red-600 dark:text-red-400">
									-{stats.finance.expenses.toFixed(0)}€ dépenses
								</div>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</Card>
	);
}

export const StatsWidget = memo(StatsWidgetComponent);


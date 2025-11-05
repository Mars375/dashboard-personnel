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
	const isFull = useMemo(() => size === "full" || size === "medium", [size]);
	const padding = isCompact ? "p-2" : "p-4";

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

	return (
		<Card className={cn("w-full h-full max-w-none flex flex-col min-h-0", padding)}>
			{isFull ? (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
						<h3 className="text-sm font-semibold">Statistiques</h3>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="p-3 rounded-md border bg-card">
							<div className="flex items-center gap-2 mb-2">
								<CheckSquare className="h-4 w-4 text-blue-500" />
								<div className="text-xs text-muted-foreground">Tâches</div>
							</div>
							<div className="text-2xl font-bold">{stats.todos.completed}/{stats.todos.total}</div>
							<div className="text-xs text-muted-foreground">Complétées</div>
						</div>
						<div className="p-3 rounded-md border bg-card">
							<div className="flex items-center gap-2 mb-2">
								<Target className="h-4 w-4 text-orange-500" />
								<div className="text-xs text-muted-foreground">Habitudes</div>
							</div>
							<div className="text-2xl font-bold">{stats.habits.completedToday}/{stats.habits.total}</div>
							<div className="text-xs text-muted-foreground">Aujourd'hui</div>
						</div>
						<div className="p-3 rounded-md border bg-card">
							<div className="flex items-center gap-2 mb-2">
								<Calendar className="h-4 w-4 text-green-500" />
								<div className="text-xs text-muted-foreground">Journal</div>
							</div>
							<div className="text-2xl font-bold">{stats.journal.total}</div>
							<div className="text-xs text-muted-foreground">Entrées</div>
						</div>
						<div className="p-3 rounded-md border bg-card">
							<div className="flex items-center gap-2 mb-2">
								<DollarSign className="h-4 w-4 text-purple-500" />
								<div className="text-xs text-muted-foreground">Finance</div>
							</div>
							<div className="text-2xl font-bold">
								{(stats.finance.income - stats.finance.expenses).toFixed(0)}€
							</div>
							<div className="text-xs text-muted-foreground">Solde</div>
						</div>
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center gap-2 flex-1">
					<BarChart3 className="h-8 w-8 text-muted-foreground" />
					<div className="text-xs font-bold">
						{stats.todos.completed + stats.habits.completedToday}
					</div>
					<div className="text-[10px] text-muted-foreground">complétés</div>
				</div>
			)}
		</Card>
	);
}

export const StatsWidget = memo(StatsWidgetComponent);


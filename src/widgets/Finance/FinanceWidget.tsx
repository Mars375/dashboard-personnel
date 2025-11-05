// src/widgets/Finance/FinanceWidget.tsx
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
import { DatePicker } from "@/components/ui/calendar-full";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import type { WidgetProps } from "@/lib/widgetSize";
import {
	loadTransactions,
	addTransaction,
	updateTransaction,
	deleteTransaction,
	loadBudgets,
	addBudget,
	updateBudget,
	deleteBudget,
	loadCategories,
	type Transaction,
	type Budget,
} from "@/store/financeStorage";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { LazyPieChart, LazyPie, LazyCell } from "@/components/ui/chart-lazy";

function FinanceWidgetComponent({ size = "medium" }: WidgetProps) {
	const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
	const [budgets, setBudgets] = useState<Budget[]>(() => loadBudgets());
	const [categories, setCategories] = useState<string[]>(() => loadCategories());
	const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
	const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
	const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
	const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
	const [editType, setEditType] = useState<"expense" | "income">("expense");
	const [editAmount, setEditAmount] = useState("");
	const [editCategory, setEditCategory] = useState("");
	const [editDescription, setEditDescription] = useState("");
	const [editDate, setEditDate] = useState<Date>(new Date());
	const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

	const isCompact = useMemo(() => size === "compact", [size]);
	const isFull = useMemo(() => size === "full" || size === "medium", [size]);
	const padding = isCompact ? "p-2" : "p-4";
	const gap = isCompact ? "gap-1" : "gap-2";

	useEffect(() => {
		setTransactions(loadTransactions());
		setBudgets(loadBudgets());
		setCategories(loadCategories());
	}, []);

	const handleAddTransaction = useCallback(() => {
		setSelectedTransaction(null);
		setEditType("expense");
		setEditAmount("");
		setEditCategory("");
		setEditDescription("");
		setEditDate(new Date());
		setIsTransactionDialogOpen(true);
	}, []);

	const handleEditTransaction = useCallback((transaction: Transaction) => {
		setSelectedTransaction(transaction);
		setEditType(transaction.type);
		setEditAmount(transaction.amount.toString());
		setEditCategory(transaction.category);
		setEditDescription(transaction.description || "");
		setEditDate(new Date(transaction.date));
		setIsTransactionDialogOpen(true);
	}, []);

	const handleSaveTransaction = useCallback(() => {
		const amount = parseFloat(editAmount);
		if (isNaN(amount) || amount <= 0) return;

		const dateStr = format(editDate, "yyyy-MM-dd");
		if (selectedTransaction) {
			updateTransaction(selectedTransaction.id, {
				type: editType,
				amount,
				category: editCategory || "Autre",
				description: editDescription,
				date: dateStr,
			});
		} else {
			addTransaction({
				type: editType,
				amount,
				category: editCategory || "Autre",
				description: editDescription,
				date: dateStr,
			});
		}
		setTransactions(loadTransactions());
		setIsTransactionDialogOpen(false);
	}, [selectedTransaction, editType, editAmount, editCategory, editDescription, editDate]);

	const handleDeleteTransaction = useCallback((id: string) => {
		if (confirm("Supprimer cette transaction ?")) {
			deleteTransaction(id);
			setTransactions(loadTransactions());
		}
	}, []);

	const handleAddBudget = useCallback(() => {
		setSelectedBudget(null);
		setEditAmount("");
		setEditCategory("");
		setIsBudgetDialogOpen(true);
	}, []);

	const handleSaveBudget = useCallback(() => {
		const amount = parseFloat(editAmount);
		if (isNaN(amount) || amount <= 0) return;

		if (selectedBudget) {
			updateBudget(selectedBudget.id, {
				category: editCategory || "Autre",
				amount,
				period: selectedBudget.period,
			});
		} else {
			addBudget({
				category: editCategory || "Autre",
				amount,
				period: "monthly",
			});
		}
		setBudgets(loadBudgets());
		setIsBudgetDialogOpen(false);
	}, [selectedBudget, editAmount, editCategory]);

	const handleDeleteBudget = useCallback((id: string) => {
		if (confirm("Supprimer ce budget ?")) {
			deleteBudget(id);
			setBudgets(loadBudgets());
		}
	}, []);

	// Statistiques du mois sélectionné
	const monthStats = useMemo(() => {
		const monthStart = startOfMonth(selectedMonth);
		const monthEnd = endOfMonth(selectedMonth);
		const monthTransactions = transactions.filter((t) => {
			const tDate = new Date(t.date);
			return tDate >= monthStart && tDate <= monthEnd;
		});

		const income = monthTransactions
			.filter((t) => t.type === "income")
			.reduce((sum, t) => sum + t.amount, 0);
		const expenses = monthTransactions
			.filter((t) => t.type === "expense")
			.reduce((sum, t) => sum + t.amount, 0);
		const balance = income - expenses;

		// Graphique par catégorie
		const categoryData = monthTransactions
			.filter((t) => t.type === "expense")
			.reduce((acc, t) => {
				acc[t.category] = (acc[t.category] || 0) + t.amount;
				return acc;
			}, {} as Record<string, number>);

		const chartData = Object.entries(categoryData).map(([category, amount]) => ({
			name: category,
			value: amount,
		}));

		// Budgets mensuels
		const monthlyBudgets = budgets.filter((b) => b.period === "monthly");
		const budgetTotal = monthlyBudgets.reduce((sum, b) => sum + b.amount, 0);
		const budgetUsed = expenses;
		const budgetRemaining = budgetTotal - budgetUsed;

		return {
			income,
			expenses,
			balance,
			chartData,
			budgetTotal,
			budgetUsed,
			budgetRemaining,
			transactionCount: monthTransactions.length,
		};
	}, [transactions, budgets, selectedMonth]);

	const COLORS = [
		"hsl(var(--chart-1))",
		"hsl(var(--chart-2))",
		"hsl(var(--chart-3))",
		"hsl(var(--chart-4))",
		"hsl(var(--chart-5))",
	];

	return (
		<Card className={cn("w-full h-full max-w-none flex flex-col min-h-0", padding, gap)}>
			{/* Header */}
			{isFull && (
				<div className="space-y-2 shrink-0">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold">Finance</h3>
						<div className="flex items-center gap-1">
							<Button
								size="sm"
								variant="outline"
								onClick={handleAddBudget}
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								Budget
							</Button>
							<Button
								size="sm"
								onClick={handleAddTransaction}
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
					{/* Sélecteur de mois */}
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="w-full justify-start text-left font-normal"
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								<Calendar className="h-4 w-4 mr-2" />
								{format(selectedMonth, "MMMM yyyy", { locale: fr })}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<DatePicker
								selected={selectedMonth}
								onSelect={(date) => {
									if (date) setSelectedMonth(date);
								}}
								captionLayout="dropdown"
							/>
						</PopoverContent>
					</Popover>
				</div>
			)}

			{/* Statistiques */}
			{isFull && (
				<div className="grid grid-cols-3 gap-2 shrink-0">
					<div className="p-2 rounded-md border bg-card">
						<div className="text-xs text-muted-foreground">Revenus</div>
						<div className="text-lg font-bold text-green-600">
							{monthStats.income.toFixed(2)}€
						</div>
					</div>
					<div className="p-2 rounded-md border bg-card">
						<div className="text-xs text-muted-foreground">Dépenses</div>
						<div className="text-lg font-bold text-red-600">
							{monthStats.expenses.toFixed(2)}€
						</div>
					</div>
					<div className="p-2 rounded-md border bg-card">
						<div className="text-xs text-muted-foreground">Solde</div>
						<div className={cn(
							"text-lg font-bold",
							monthStats.balance >= 0 ? "text-green-600" : "text-red-600"
						)}>
							{monthStats.balance.toFixed(2)}€
						</div>
					</div>
				</div>
			)}

			{/* Compact: Afficher juste le solde */}
			{isCompact && (
				<div className="flex flex-col items-center justify-center gap-1 flex-1">
					<div className="text-2xl font-bold">
						{monthStats.balance >= 0 ? (
							<span className="text-green-600">{monthStats.balance.toFixed(0)}€</span>
						) : (
							<span className="text-red-600">{monthStats.balance.toFixed(0)}€</span>
						)}
					</div>
					<div className="text-xs text-muted-foreground">
						{format(selectedMonth, "MMM yyyy", { locale: fr })}
					</div>
				</div>
			)}

			{/* Graphique */}
			{isFull && monthStats.chartData.length > 0 && (
				<div className="h-[150px] shrink-0">
					<LazyPieChart width={300} height={150}>
						<LazyPie
							data={monthStats.chartData}
							dataKey="value"
							nameKey="name"
							cx="50%"
							cy="50%"
							outerRadius={50}
							label
						>
							{monthStats.chartData.map((_, index) => (
								<LazyCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
							))}
						</LazyPie>
					</LazyPieChart>
				</div>
			)}

			{/* Liste des transactions */}
			{isFull && (
				<div className="flex-1 overflow-y-auto space-y-1">
					{transactions
						.filter((t) => {
							const tDate = new Date(t.date);
							const monthStart = startOfMonth(selectedMonth);
							const monthEnd = endOfMonth(selectedMonth);
							return tDate >= monthStart && tDate <= monthEnd;
						})
						.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
						.slice(0, 10)
						.map((transaction) => (
							<motion.div
								key={transaction.id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className="p-2 rounded-md border bg-card hover:bg-accent transition-colors"
							>
								<div className="flex items-center justify-between gap-2">
									<div className="flex items-center gap-2 flex-1 min-w-0">
										{transaction.type === "income" ? (
											<TrendingUp className="h-4 w-4 text-green-600 shrink-0" />
										) : (
											<TrendingDown className="h-4 w-4 text-red-600 shrink-0" />
										)}
										<div className="flex-1 min-w-0">
											<div className="font-medium truncate">
												{transaction.description || transaction.category}
											</div>
											<div className="text-xs text-muted-foreground">
												{format(new Date(transaction.date), "PPP", { locale: fr })}
											</div>
										</div>
										<div className={cn(
											"font-bold shrink-0",
											transaction.type === "income" ? "text-green-600" : "text-red-600"
										)}>
											{transaction.type === "income" ? "+" : "-"}
											{transaction.amount.toFixed(2)}€
										</div>
									</div>
									<div className="flex items-center gap-1 shrink-0">
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6"
											onClick={(e) => {
												e.stopPropagation();
												handleEditTransaction(transaction);
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
												handleDeleteTransaction(transaction.id);
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
								</div>
							</motion.div>
						))}
				</div>
			)}

			{/* Dialog Transaction */}
			<Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{selectedTransaction ? "Modifier" : "Ajouter"} une transaction
						</DialogTitle>
						<DialogDescription>
							Enregistrez vos revenus et dépenses.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<Select
							value={editType}
							onValueChange={(value) => setEditType(value as "expense" | "income")}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="expense">Dépense</SelectItem>
								<SelectItem value="income">Revenu</SelectItem>
							</SelectContent>
						</Select>
						<Input
							type="number"
							placeholder="Montant"
							value={editAmount}
							onChange={(e) => setEditAmount(e.target.value)}
						/>
						<Select value={editCategory} onValueChange={setEditCategory}>
							<SelectTrigger>
								<SelectValue placeholder="Catégorie" />
							</SelectTrigger>
							<SelectContent>
								{categories.map((cat) => (
									<SelectItem key={cat} value={cat}>
										{cat}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Input
							placeholder="Description (optionnel)"
							value={editDescription}
							onChange={(e) => setEditDescription(e.target.value)}
						/>
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" className="w-full justify-start text-left font-normal">
									<Calendar className="h-4 w-4 mr-2" />
									{format(editDate, "PPP", { locale: fr })}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<DatePicker
									selected={editDate}
									onSelect={(date) => {
										if (date) setEditDate(date);
									}}
									captionLayout="dropdown"
								/>
							</PopoverContent>
						</Popover>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsTransactionDialogOpen(false)}
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
							onClick={handleSaveTransaction}
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

			{/* Dialog Budget */}
			<Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{selectedBudget ? "Modifier" : "Ajouter"} un budget
						</DialogTitle>
						<DialogDescription>
							Définissez un budget pour une catégorie.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<Select value={editCategory} onValueChange={setEditCategory}>
							<SelectTrigger>
								<SelectValue placeholder="Catégorie" />
							</SelectTrigger>
							<SelectContent>
								{categories.map((cat) => (
									<SelectItem key={cat} value={cat}>
										{cat}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Input
							type="number"
							placeholder="Montant"
							value={editAmount}
							onChange={(e) => setEditAmount(e.target.value)}
						/>
					</div>
					<DialogFooter>
						{selectedBudget && (
							<Button
								variant="destructive"
								onClick={() => {
									handleDeleteBudget(selectedBudget.id);
									setIsBudgetDialogOpen(false);
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
							onClick={() => setIsBudgetDialogOpen(false)}
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
							onClick={handleSaveBudget}
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

export const FinanceWidget = memo(FinanceWidgetComponent);


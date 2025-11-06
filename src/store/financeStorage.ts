/**
 * Storage pour le widget Finance
 */

import { logger } from "@/lib/logger";

export interface Transaction {
	id: string;
	type: "expense" | "income";
	amount: number;
	category: string;
	description?: string;
	date: string; // YYYY-MM-DD
	createdAt: number;
}

export interface Budget {
	id: string;
	category: string;
	amount: number;
	period: "monthly" | "weekly" | "yearly";
	createdAt: number;
}

const STORAGE_KEY_TRANSACTIONS = "finance:transactions";
const STORAGE_KEY_BUDGETS = "finance:budgets";
const STORAGE_KEY_CATEGORIES = "finance:categories";

export function loadTransactions(): Transaction[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		logger.error("Erreur lors du chargement des transactions:", error);
	}
	return [];
}

export function saveTransactions(transactions: Transaction[]): void {
	try {
		localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
	} catch (error) {
		logger.error("Erreur lors de la sauvegarde des transactions:", error);
	}
}

export function addTransaction(transaction: Omit<Transaction, "id" | "createdAt">): Transaction {
	const transactions = loadTransactions();
	const newTransaction: Transaction = {
		...transaction,
		id: crypto.randomUUID(),
		createdAt: Date.now(),
	};
	transactions.push(newTransaction);
	saveTransactions(transactions);
	return newTransaction;
}

export function updateTransaction(
	id: string,
	updates: Partial<Omit<Transaction, "id" | "createdAt">>
): Transaction | null {
	const transactions = loadTransactions();
	const index = transactions.findIndex((t) => t.id === id);
	if (index === -1) return null;
	transactions[index] = { ...transactions[index], ...updates };
	saveTransactions(transactions);
	return transactions[index];
}

export function deleteTransaction(id: string): void {
	const transactions = loadTransactions();
	const filtered = transactions.filter((t) => t.id !== id);
	saveTransactions(filtered);
}

export function loadBudgets(): Budget[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY_BUDGETS);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		logger.error("Erreur lors du chargement des budgets:", error);
	}
	return [];
}

export function saveBudgets(budgets: Budget[]): void {
	try {
		localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(budgets));
	} catch (error) {
		logger.error("Erreur lors de la sauvegarde des budgets:", error);
	}
}

export function addBudget(budget: Omit<Budget, "id" | "createdAt">): Budget {
	const budgets = loadBudgets();
	const newBudget: Budget = {
		...budget,
		id: crypto.randomUUID(),
		createdAt: Date.now(),
	};
	budgets.push(newBudget);
	saveBudgets(budgets);
	return newBudget;
}

export function updateBudget(id: string, updates: Partial<Omit<Budget, "id" | "createdAt">>): Budget | null {
	const budgets = loadBudgets();
	const index = budgets.findIndex((b) => b.id === id);
	if (index === -1) return null;
	budgets[index] = { ...budgets[index], ...updates };
	saveBudgets(budgets);
	return budgets[index];
}

export function deleteBudget(id: string): void {
	const budgets = loadBudgets();
	const filtered = budgets.filter((b) => b.id !== id);
	saveBudgets(filtered);
}

export function loadCategories(): string[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY_CATEGORIES);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		logger.error("Erreur lors du chargement des catégories:", error);
	}
	return ["Alimentation", "Transport", "Logement", "Loisirs", "Santé", "Éducation", "Autre"];
}

export function saveCategories(categories: string[]): void {
	try {
		localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
	} catch (error) {
		logger.error("Erreur lors de la sauvegarde des catégories:", error);
	}
}



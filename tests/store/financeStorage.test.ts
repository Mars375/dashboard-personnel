import { describe, it, expect, beforeEach } from "vitest";
import {
	loadTransactions,
	addTransaction,
	updateTransaction,
	deleteTransaction,
	loadBudgets,
	addBudget,
	updateBudget,
	deleteBudget,
	type Transaction,
	type Budget,
} from "@/store/financeStorage";

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
	};
})();

Object.defineProperty(window, "localStorage", {
	value: localStorageMock,
});

describe("financeStorage", () => {
	beforeEach(() => {
		localStorageMock.clear();
	});

	describe("Transactions", () => {
		it("should load empty array when no transactions exist", () => {
			expect(loadTransactions()).toEqual([]);
		});

		it("should add a transaction", () => {
			const transaction = addTransaction({
				type: "expense",
				amount: 50,
				category: "Food",
				description: "Lunch",
				date: new Date().toISOString().split("T")[0],
			});

			expect(transaction.id).toBeDefined();
			expect(transaction.type).toBe("expense");
			expect(transaction.amount).toBe(50);
			expect(loadTransactions()).toHaveLength(1);
		});

		it("should update a transaction", () => {
			const transaction = addTransaction({
				type: "expense",
				amount: 50,
				category: "Food",
				date: new Date().toISOString().split("T")[0],
			});

			const updated = updateTransaction(transaction.id, { amount: 75 });
			expect(updated).not.toBeNull();
			expect(updated?.amount).toBe(75);
		});

	it("should delete a transaction", () => {
		const transaction = addTransaction({
			type: "expense",
			amount: 50,
			category: "Food",
			date: new Date().toISOString().split("T")[0],
		});

		deleteTransaction(transaction.id);
		expect(loadTransactions()).toHaveLength(0);
	});
	});

	describe("Budgets", () => {
		it("should load empty array when no budgets exist", () => {
			expect(loadBudgets()).toEqual([]);
		});

		it("should add a budget", () => {
			const budget = addBudget({
				category: "Food",
				amount: 500,
				period: "monthly",
			});

			expect(budget.id).toBeDefined();
			expect(budget.category).toBe("Food");
			expect(budget.amount).toBe(500);
			expect(loadBudgets()).toHaveLength(1);
		});

		it("should update a budget", () => {
			const budget = addBudget({
				category: "Food",
				amount: 500,
				period: "monthly",
			});

			const updated = updateBudget(budget.id, { amount: 600 });
			expect(updated).not.toBeNull();
			expect(updated?.amount).toBe(600);
		});

	it("should delete a budget", () => {
		const budget = addBudget({
			category: "Food",
			amount: 500,
			period: "monthly",
		});

		deleteBudget(budget.id);
		expect(loadBudgets()).toHaveLength(0);
	});
	});
});


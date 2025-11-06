// Persistance localStorage pour les habitudes

import { logger } from "@/lib/logger";

const STORAGE_KEY = "habits:habits";

export interface Habit {
	id: string;
	name: string;
	description?: string;
	color?: string;
	createdAt: string;
	streak: number;
	lastCompleted?: string;
	completedDates: string[]; // Dates YYYY-MM-DD
}

/**
 * Charge les habitudes depuis localStorage
 */
export function loadHabits(): Habit[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return [];
		}
		return JSON.parse(stored) as Habit[];
	} catch (error) {
		logger.error("Erreur lors du chargement des habitudes:", error);
		return [];
	}
}

/**
 * Sauvegarde les habitudes dans localStorage
 */
export function saveHabits(habits: Habit[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
	} catch (error) {
		logger.error("Erreur lors de la sauvegarde des habitudes:", error);
	}
}

/**
 * Ajoute une habitude
 */
export function addHabit(habit: Omit<Habit, "id" | "createdAt" | "streak" | "completedDates">): Habit {
	const habits = loadHabits();
	const newHabit: Habit = {
		...habit,
		id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		createdAt: new Date().toISOString(),
		streak: 0,
		completedDates: [],
	};
	habits.push(newHabit);
	saveHabits(habits);
	return newHabit;
}

/**
 * Met à jour une habitude
 */
export function updateHabit(id: string, updates: Partial<Habit>): Habit | null {
	const habits = loadHabits();
	const index = habits.findIndex((h) => h.id === id);
	if (index === -1) return null;
	
	habits[index] = {
		...habits[index],
		...updates,
	};
	saveHabits(habits);
	return habits[index];
}

/**
 * Supprime une habitude
 */
export function deleteHabit(id: string): boolean {
	const habits = loadHabits();
	const filtered = habits.filter((h) => h.id !== id);
	if (filtered.length === habits.length) return false;
	saveHabits(filtered);
	return true;
}

/**
 * Marque une habitude comme complétée pour aujourd'hui
 */
export function completeHabit(id: string): Habit | null {
	const habits = loadHabits();
	const habit = habits.find((h) => h.id === id);
	if (!habit) return null;
	
	const today = new Date().toISOString().split("T")[0];
	
	// Vérifier si déjà complétée aujourd'hui
	if (habit.completedDates.includes(today)) {
		return habit;
	}
	
	// Ajouter la date
	habit.completedDates.push(today);
	
	// Calculer le streak
	const sortedDates = [...habit.completedDates].sort();
	let streak = 1;
	for (let i = sortedDates.length - 2; i >= 0; i--) {
		const date = new Date(sortedDates[i]);
		const nextDate = new Date(sortedDates[i + 1]);
		const diffDays = Math.floor((nextDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
		if (diffDays === 1) {
			streak++;
		} else {
			break;
		}
	}
	
	habit.streak = streak;
	habit.lastCompleted = today;
	
	saveHabits(habits);
	return habit;
}

/**
 * Unmark une habitude pour aujourd'hui
 */
export function uncompleteHabit(id: string): Habit | null {
	const habits = loadHabits();
	const habit = habits.find((h) => h.id === id);
	if (!habit) return null;
	
	const today = new Date().toISOString().split("T")[0];
	habit.completedDates = habit.completedDates.filter((d) => d !== today);
	
	// Recalculer le streak
	const sortedDates = [...habit.completedDates].sort();
	let streak = 0;
	if (sortedDates.length > 0) {
		streak = 1;
		for (let i = sortedDates.length - 2; i >= 0; i--) {
			const date = new Date(sortedDates[i]);
			const nextDate = new Date(sortedDates[i + 1]);
			const diffDays = Math.floor((nextDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
			if (diffDays === 1) {
				streak++;
			} else {
				break;
			}
		}
	}
	
	habit.streak = streak;
	
	saveHabits(habits);
	return habit;
}



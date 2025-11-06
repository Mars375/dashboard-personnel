/**
 * Widget Context - Système de connexion entre widgets
 * Permet aux widgets de partager des données et de communiquer entre eux
 */

import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

export interface WidgetData {
	widgetId: string;
	type: string;
	data: Record<string, unknown>;
}

interface WidgetContextValue {
	// Publier des données depuis un widget
	publishData: (widgetId: string, type: string, data: Record<string, unknown>) => void;
	// S'abonner aux données d'un type de widget
	subscribe: (type: string, callback: (data: WidgetData) => void) => () => void;
	// Obtenir les données actuelles d'un type de widget
	getData: (type: string) => WidgetData | null;
	// Obtenir toutes les données d'un type
	getAllData: (type: string) => WidgetData[];
}

const WidgetContext = createContext<WidgetContextValue | null>(null);

export function WidgetProvider({ children }: { children: ReactNode }) {
	const [widgetDataMap, setWidgetDataMap] = useState<Map<string, WidgetData>>(new Map());
	const [subscribers, setSubscribers] = useState<Map<string, Set<(data: WidgetData) => void>>>(new Map());

	const publishData = useCallback((widgetId: string, type: string, data: Record<string, unknown>) => {
		const widgetData: WidgetData = { widgetId, type, data };
		setWidgetDataMap((prev) => {
			const next = new Map(prev);
			next.set(widgetId, widgetData);
			return next;
		});

		// Notifier les abonnés
		const typeSubscribers = subscribers.get(type);
		if (typeSubscribers) {
			typeSubscribers.forEach((callback) => callback(widgetData));
		}
	}, [subscribers]);

	const subscribe = useCallback((type: string, callback: (data: WidgetData) => void) => {
		setSubscribers((prev) => {
			const next = new Map(prev);
			if (!next.has(type)) {
				next.set(type, new Set());
			}
			next.get(type)!.add(callback);
			return next;
		});

		// Retourner une fonction de désabonnement
		return () => {
			setSubscribers((prev) => {
				const next = new Map(prev);
				const typeSubs = next.get(type);
				if (typeSubs) {
					typeSubs.delete(callback);
					if (typeSubs.size === 0) {
						next.delete(type);
					}
				}
				return next;
			});
		};
	}, []);

	const getData = useCallback((type: string): WidgetData | null => {
		for (const [_, data] of widgetDataMap.entries()) {
			if (data.type === type) {
				return data;
			}
		}
		return null;
	}, [widgetDataMap]);

	const getAllData = useCallback((type: string): WidgetData[] => {
		const results: WidgetData[] = [];
		for (const [_, data] of widgetDataMap.entries()) {
			if (data.type === type) {
				results.push(data);
			}
		}
		return results;
	}, [widgetDataMap]);

	const value: WidgetContextValue = {
		publishData,
		subscribe,
		getData,
		getAllData,
	};

	return <WidgetContext.Provider value={value}>{children}</WidgetContext.Provider>;
}

export function useWidgetContext() {
	const context = useContext(WidgetContext);
	if (!context) {
		throw new Error("useWidgetContext must be used within a WidgetProvider");
	}
	return context;
}


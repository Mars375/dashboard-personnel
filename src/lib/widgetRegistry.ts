import type { ComponentType } from "react";
import { Cloud, CheckSquare, Calendar } from "lucide-react";
import { WeatherWidget } from "@/widgets/Weather/WeatherWidget";
import { TodoWidget } from "@/widgets/Todo/TodoWidget";
import { CalendarWidget } from "@/widgets/Calendar/CalendarWidget";
import type { WidgetProps } from "./widgetSize";

export interface WidgetDefinition {
	id: string;
	name: string;
	description: string;
	icon: ComponentType<{ className?: string }>;
	component: ComponentType<WidgetProps>;
	defaultSize: { w: number; h: number };
	minSize: { w: number; h: number };
	maxSize?: { w: number; h: number };
}

export const widgetRegistry: WidgetDefinition[] = [
	{
		id: "weather",
		name: "Météo",
		description: "Affiche la météo actuelle et les prévisions",
		icon: Cloud,
		component: WeatherWidget,
		defaultSize: { w: 4, h: 3 },
		minSize: { w: 2, h: 3 }, // Permettre une largeur plus petite
		maxSize: { w: 10, h: 8 },
	},
	{
		id: "todo",
		name: "Tâches",
		description: "Gestion de vos tâches et todo lists",
		icon: CheckSquare,
		component: TodoWidget,
		defaultSize: { w: 4, h: 6 },
		minSize: { w: 3, h: 4 },
		maxSize: { w: 8, h: 10 },
	},
	{
		id: "calendar",
		name: "Calendrier",
		description: "Visualisez et gérez vos événements",
		icon: Calendar,
		component: CalendarWidget,
		defaultSize: { w: 4, h: 6 },
		minSize: { w: 2, h: 3 }, // Permettre d'atteindre le mode compact
		maxSize: { w: 8, h: 10 },
	},
];

export function getWidgetDefinition(type: string): WidgetDefinition | undefined {
	return widgetRegistry.find((widget) => widget.id === type);
}


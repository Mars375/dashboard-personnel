import type { ComponentType, LazyExoticComponent } from "react";
import { lazy } from "react";
import { Cloud, CheckSquare, Calendar, Bookmark, Target, BookOpen } from "lucide-react";
import type { WidgetProps } from "./widgetSize";

// Lazy loading des widgets pour optimiser le bundle size
const WeatherWidget = lazy(() =>
	import("@/widgets/Weather/WeatherWidget").then((module) => ({
		default: module.WeatherWidget,
	}))
);

const TodoWidget = lazy(() =>
	import("@/widgets/Todo/TodoWidget").then((module) => ({
		default: module.TodoWidget,
	}))
);

const CalendarWidget = lazy(() =>
	import("@/widgets/Calendar/CalendarWidget").then((module) => ({
		default: module.CalendarWidget,
	}))
);

const BookmarksWidget = lazy(() =>
	import("@/widgets/Bookmarks/BookmarksWidget").then((module) => ({
		default: module.BookmarksWidget,
	}))
);

const HabitsWidget = lazy(() =>
	import("@/widgets/Habits/HabitsWidget").then((module) => ({
		default: module.HabitsWidget,
	}))
);

const JournalWidget = lazy(() =>
	import("@/widgets/Journal/JournalWidget").then((module) => ({
		default: module.JournalWidget,
	}))
);

export interface WidgetDefinition {
	id: string;
	name: string;
	description: string;
	icon: ComponentType<{ className?: string }>;
	component: LazyExoticComponent<ComponentType<WidgetProps>>;
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
	{
		id: "bookmarks",
		name: "Bookmarks",
		description: "Gérez vos liens favoris et bookmarks",
		icon: Bookmark,
		component: BookmarksWidget,
		defaultSize: { w: 4, h: 6 },
		minSize: { w: 3, h: 4 },
		maxSize: { w: 8, h: 10 },
	},
	{
		id: "habits",
		name: "Habitudes",
		description: "Suivez vos habitudes quotidiennes",
		icon: Target,
		component: HabitsWidget,
		defaultSize: { w: 4, h: 6 },
		minSize: { w: 3, h: 4 },
		maxSize: { w: 8, h: 10 },
	},
	{
		id: "journal",
		name: "Journal",
		description: "Écrivez votre journal quotidien",
		icon: BookOpen,
		component: JournalWidget,
		defaultSize: { w: 4, h: 6 },
		minSize: { w: 3, h: 4 },
		maxSize: { w: 8, h: 10 },
	},
];

export function getWidgetDefinition(type: string): WidgetDefinition | undefined {
	return widgetRegistry.find((widget) => widget.id === type);
}


import type { ComponentType, LazyExoticComponent } from "react";
import { lazy } from "react";
import { Cloud, CheckSquare, Calendar, Bookmark, Target, BookOpen, DollarSign, Timer, BarChart3, Rss, Quote, LineChart } from "lucide-react";
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

const FinanceWidget = lazy(() =>
	import("@/widgets/Finance/FinanceWidget").then((module) => ({
		default: module.FinanceWidget,
	}))
);

const PomodoroWidget = lazy(() =>
	import("@/widgets/Pomodoro/PomodoroWidget").then((module) => ({
		default: module.PomodoroWidget,
	}))
);

const StatsWidget = lazy(() =>
	import("@/widgets/Stats/StatsWidget").then((module) => ({
		default: module.StatsWidget,
	}))
);

const RSSWidget = lazy(() =>
	import("@/widgets/RSS/RSSWidget").then((module) => ({
		default: module.RSSWidget,
	}))
);

const QuoteWidget = lazy(() =>
	import("@/widgets/Quote/QuoteWidget").then((module) => ({
		default: module.QuoteWidget,
	}))
);

const GraphiquesWidget = lazy(() =>
	import("@/widgets/Graphiques/GraphiquesWidget").then((module) => ({
		default: module.GraphiquesWidget,
	}))
);

export interface WidgetDefinition {
	id: string;
	name: string;
	description: string;
	detailedDescription?: string; // Description détaillée pour le bouton info
	features?: string[]; // Liste des fonctionnalités
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
	{
		id: "finance",
		name: "Finance",
		description: "Suivez vos revenus et dépenses",
		icon: DollarSign,
		component: FinanceWidget,
		defaultSize: { w: 4, h: 6 },
		minSize: { w: 3, h: 4 },
		maxSize: { w: 8, h: 10 },
	},
	{
		id: "pomodoro",
		name: "Pomodoro",
		description: "Technique Pomodoro pour la productivité",
		icon: Timer,
		component: PomodoroWidget,
		defaultSize: { w: 3, h: 4 },
		minSize: { w: 2, h: 3 },
		maxSize: { w: 6, h: 6 },
	},
	{
		id: "stats",
		name: "Statistiques",
		description: "Statistiques globales du dashboard",
		icon: BarChart3,
		component: StatsWidget,
		defaultSize: { w: 4, h: 6 },
		minSize: { w: 3, h: 4 },
		maxSize: { w: 8, h: 10 },
	},
	{
		id: "rss",
		name: "RSS",
		description: "Lecteur de flux RSS",
		icon: Rss,
		component: RSSWidget,
		defaultSize: { w: 4, h: 6 },
		minSize: { w: 3, h: 4 },
		maxSize: { w: 8, h: 10 },
	},
	{
		id: "quote",
		name: "Citation",
		description: "Citations inspirantes quotidiennes",
		icon: Quote,
		component: QuoteWidget,
		defaultSize: { w: 3, h: 3 },
		minSize: { w: 2, h: 2 },
		maxSize: { w: 6, h: 6 },
	},
	{
		id: "graphiques",
		name: "Graphiques",
		description: "Créez des graphiques personnalisés",
		icon: LineChart,
		component: GraphiquesWidget,
		defaultSize: { w: 4, h: 6 },
		minSize: { w: 3, h: 4 },
		maxSize: { w: 8, h: 10 },
	},
];

export function getWidgetDefinition(type: string): WidgetDefinition | undefined {
	return widgetRegistry.find((widget) => widget.id === type);
}


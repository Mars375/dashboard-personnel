import type { ComponentType, LazyExoticComponent } from "react";
import { lazy } from "react";
import { Cloud, CheckSquare, Calendar, Bookmark, Target, BookOpen, DollarSign, Timer, BarChart3, Rss, Quote, LineChart, TrendingUp } from "lucide-react";
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

const StockWidget = lazy(() =>
	import("@/widgets/Stock/StockWidget").then((module) => ({
		default: module.StockWidget,
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
		detailedDescription: "Widget météo complet avec recherche de villes, affichage des conditions actuelles, prévisions sur plusieurs jours, et synchronisation avec OpenWeatherMap.",
		features: [
			"Recherche et ajout de villes",
			"Conditions météo actuelles",
			"Prévisions sur plusieurs jours",
			"Version compacte avec design moderne",
		],
		icon: Cloud,
		component: WeatherWidget,
		defaultSize: { w: 4, h: 3 },
		minSize: { w: 2, h: 3 },
		maxSize: { w: 10, h: 8 },
	},
	{
		id: "todo",
		name: "Tâches",
		description: "Gestion de vos tâches et todo lists",
		detailedDescription: "Gestion complète de vos tâches avec listes multiples, priorités, deadlines, filtres, recherche, et synchronisation avec Google Tasks et Notion.",
		features: [
			"Listes multiples",
			"Priorités et deadlines",
			"Filtres et recherche",
			"Synchronisation Google Tasks / Notion",
			"Statistiques avec graphiques",
		],
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
		detailedDescription: "Calendrier interactif avec vue mensuelle, hebdomadaire et quotidienne, gestion d'événements, drag & drop, et synchronisation avec Google Calendar.",
		features: [
			"Vues mensuelle, hebdomadaire, quotidienne",
			"Gestion d'événements",
			"Drag & drop",
			"Synchronisation Google Calendar",
			"Virtualisation pour performance",
		],
		icon: Calendar,
		component: CalendarWidget,
		defaultSize: { w: 4, h: 6 },
		minSize: { w: 2, h: 3 },
		maxSize: { w: 8, h: 10 },
	},
	{
		id: "bookmarks",
		name: "Bookmarks",
		description: "Gérez vos liens favoris et bookmarks",
		detailedDescription: "Gestionnaire de bookmarks avec favicons automatiques, tags, recherche, et organisation de vos liens favoris.",
		features: [
			"Favicons automatiques",
			"Tags et catégories",
			"Recherche",
			"Organisation par hostname",
		],
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
		detailedDescription: "Suivi de vos habitudes avec système de streaks, heatmap des 7 derniers jours, statistiques, et renouvellement quotidien automatique.",
		features: [
			"Streaks et statistiques",
			"Heatmap 7 jours",
			"Renouvellement quotidien",
			"Suivi détaillé",
		],
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
		detailedDescription: "Journal personnel avec entrées par date, vue des dernières entrées, édition et suppression directement depuis l'entrée.",
		features: [
			"Entrées par date",
			"Vue des dernières entrées",
			"Édition et suppression",
			"Recherche par date",
		],
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
		detailedDescription: "Gestion financière complète avec suivi des revenus et dépenses, budgets par catégorie, graphiques, et statistiques mensuelles.",
		features: [
			"Revenus et dépenses",
			"Budgets par catégorie",
			"Graphiques de répartition",
			"Statistiques mensuelles",
		],
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
		detailedDescription: "Timer Pomodoro avec sessions de travail, pauses courtes et longues, suivi des sessions complétées, et statistiques.",
		features: [
			"Timer personnalisable",
			"Sessions de travail/pause",
			"Statistiques",
			"Suivi des sessions",
		],
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
		detailedDescription: "Tableau de bord des statistiques globales : tâches, habitudes, journal, et finances. Vue d'ensemble de votre productivité.",
		features: [
			"Statistiques globales",
			"Tâches, habitudes, journal, finances",
			"Vue d'ensemble",
			"Version compacte avec grille",
		],
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
		detailedDescription: "Lecteur de flux RSS avec gestion de multiples sources, suivi des articles non lus, et ouverture directe des articles.",
		features: [
			"Gestion de flux multiples",
			"Articles non lus",
			"Ouverture directe",
			"Version compacte avec aperçu",
		],
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
		detailedDescription: "Widget de citations avec citations par défaut, favoris, et refresh automatique toutes les 4 heures en mode compact.",
		features: [
			"Citations inspirantes",
			"Système de favoris",
			"Refresh automatique (compact)",
			"Citations par défaut incluses",
		],
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
		detailedDescription: "Créez et visualisez des graphiques personnalisés avec des données que vous pouvez saisir manuellement. Supporte les graphiques en ligne, barres, camembert et aires.",
		features: [
			"Création de graphiques personnalisés",
			"Types: Ligne, Barres, Camembert, Aire",
			"Ajout manuel de données",
			"Visualisation interactive",
		],
		icon: LineChart,
		component: GraphiquesWidget,
		defaultSize: { w: 4, h: 6 },
		minSize: { w: 3, h: 4 },
		maxSize: { w: 8, h: 10 },
	},
	{
		id: "stock",
		name: "Bourse",
		description: "Suivez les cours de la bourse en temps réel",
		detailedDescription: "Widget pour suivre les cours boursiers en temps réel. Ajoutez des actions à votre watchlist et suivez leurs performances. Les données sont mises à jour automatiquement toutes les 5 minutes.",
		features: [
			"Watchlist personnalisée",
			"Cours en temps réel",
			"Variations et pourcentages",
			"Cache pour performance",
			"Intégration avec autres widgets",
		],
		icon: TrendingUp,
		component: StockWidget,
		defaultSize: { w: 4, h: 6 },
		minSize: { w: 3, h: 4 },
		maxSize: { w: 8, h: 10 },
	},
];

export function getWidgetDefinition(type: string): WidgetDefinition | undefined {
	return widgetRegistry.find((widget) => widget.id === type);
}


import type { ComponentType, LazyExoticComponent } from "react";
import { lazy } from "react";
import { Cloud, CheckSquare, Calendar, Bookmark, Target, BookOpen, DollarSign, Timer, BarChart3, Rss, Quote, TrendingUp } from "lucide-react";
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
	usageGuide?: string; // Guide d'utilisation du widget
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
		// Tailles selon WIDGET_SIZE_THRESHOLDS :
		// - Compact : w ≤ 3, h ≤ 3, aire ≤ 9 (ex: 2x3, 3x3)
		// - Medium : w ≤ 5, h ≤ 6, aire ≤ 30 (ex: 4x4, 4x5, 5x5)
		// - Full : w > 5 OU h > 6 OU aire > 30 (ex: 6x6, 8x4)
		defaultSize: { w: 2, h: 3 }, // Compact (2x3=6) - même taille que Pomodoro
		minSize: { w: 2, h: 3 }, // Même contraintes que Pomodoro (2x3 minimum)
		maxSize: { w: 8, h: 8 },
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
		// Tailles selon WIDGET_SIZE_THRESHOLDS :
		// - Compact : w ≤ 3, h ≤ 3, aire ≤ 9 (ex: 3x3) - limité car minH=4
		// - Medium : w ≤ 5, h ≤ 6, aire ≤ 30 (ex: 4x4, 4x5, 4x6, 5x5, 5x6)
		// - Full : w > 5 OU h > 6 OU aire > 30 (ex: 6x6, 6x8, 8x6)
		defaultSize: { w: 4, h: 6 }, // Medium (4x6=24)
		minSize: { w: 2, h: 4 },
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
		// Tailles selon WIDGET_SIZE_THRESHOLDS :
		// - Compact : w ≤ 3, h ≤ 3, aire ≤ 9 (ex: 2x3, 3x3)
		// - Medium : w ≤ 5, h ≤ 6, aire ≤ 30 (ex: 4x4, 4x5, 4x6, 5x5, 5x6)
		// - Full : w > 5 OU h > 6 OU aire > 30 (ex: 6x6, 6x8, 8x6, 8x8, etc.)
		// Redimensionnable librement (pas de contraintes strictes)
		defaultSize: { w: 4, h: 6 }, // Medium (4x6=24)
		minSize: { w: 2, h: 3 }, // Très permissif pour permettre tous les redimensionnements
		maxSize: { w: 12, h: 12 }, // Très large pour permettre les grandes tailles
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
		minSize: { w: 2, h: 3 }, // Permet version compacte plus petite (grille 2x2 ou 2x3)
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
		minSize: { w: 2, h: 3 }, // Permet version compacte plus petite
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
		minSize: { w: 2, h: 3 }, // Permet version compacte plus petite
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
		minSize: { w: 2, h: 3 }, // Permet version compacte plus petite
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
			"Version compacte minimaliste",
			"Version medium avec détails",
		],
		icon: BarChart3,
		component: StatsWidget,
		defaultSize: { w: 4, h: 6 },
		minSize: { w: 2, h: 4 },
		maxSize: { w: 5, h: 6 }, // Limité à medium (5x6=30, taille max de medium)
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
		minSize: { w: 2, h: 3 }, // Permet version compacte plus petite
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
		minSize: { w: 2, h: 3 }, // Permet version compacte plus petite
		maxSize: { w: 8, h: 10 },
	},
];

export function getWidgetDefinition(type: string): WidgetDefinition | undefined {
	return widgetRegistry.find((widget) => widget.id === type);
}

/**
 * Récupère toutes les définitions de widgets (internes + externes)
 * Cette fonction doit être appelée après l'initialisation de widgetLibrary
 */
export async function getAllWidgetDefinitions(): Promise<WidgetDefinition[]> {
	const { widgetLibrary } = await import("./widgetLibrary");
	const externalWidgets = widgetLibrary.getExternalWidgets();
	
	// Convertir les widgets externes en WidgetDefinition
	const externalDefinitions: WidgetDefinition[] = externalWidgets
		.filter((w) => w.status === "loaded")
		.map((w) => {
			// Gérer l'icône (peut être une string ou un composant)
			let icon: ComponentType<{ className?: string }>;
			if (typeof w.icon === "string") {
				// Si c'est une string, utiliser une icône par défaut
				// TODO: Parser les noms d'icônes Lucide
				icon = Calendar; // Icône par défaut
			} else if (w.icon) {
				icon = w.icon;
			} else {
				icon = Calendar; // Icône par défaut
			}

			return {
				id: w.id,
				name: w.name,
				description: w.description,
				detailedDescription: w.detailedDescription,
				usageGuide: w.usageGuide,
				features: w.features,
				icon,
				component: w.component,
				defaultSize: w.defaultSize,
				minSize: w.minSize,
				maxSize: w.maxSize,
			};
		});

	return [...widgetRegistry, ...externalDefinitions];
}


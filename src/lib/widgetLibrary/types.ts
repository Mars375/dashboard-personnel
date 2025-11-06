import type { ComponentType, LazyExoticComponent } from "react";
import type { WidgetProps } from "../widgetSize";

/**
 * Définition d'un widget externe (depuis une source externe)
 */
export interface ExternalWidgetDefinition {
	/** ID unique du widget (doit être unique dans toute la bibliothèque) */
	id: string;
	/** Nom d'affichage du widget */
	name: string;
	/** Description courte */
	description: string;
	/** Description détaillée (optionnel) */
	detailedDescription?: string;
	/** Guide d'utilisation (optionnel) */
	usageGuide?: string;
	/** Liste des fonctionnalités (optionnel) */
	features?: string[];
	/** URL de l'icône (ou nom d'icône Lucide) */
	icon?: string | ComponentType<{ className?: string }>;
	/** URL du module JavaScript à charger */
	moduleUrl: string;
	/** Tailles par défaut */
	defaultSize: { w: number; h: number };
	/** Tailles minimales */
	minSize: { w: number; h: number };
	/** Tailles maximales (optionnel) */
	maxSize?: { w: number; h: number };
	/** Version du widget */
	version?: string;
	/** Auteur du widget (optionnel) */
	author?: string;
	/** Licence (optionnel) */
	license?: string;
	/** Tags pour la recherche (optionnel) */
	tags?: string[];
	/** Date d'ajout */
	addedAt?: string;
	/** Dernière mise à jour */
	updatedAt?: string;
	/** Source de la bibliothèque (URL, fichier local, etc.) */
	source?: string;
}

/**
 * Définition complète d'un widget (interne ou externe)
 */
export interface WidgetLibraryDefinition extends ExternalWidgetDefinition {
	/** Composant React chargé */
	component: LazyExoticComponent<ComponentType<WidgetProps>>;
	/** Statut de chargement */
	status: "loading" | "loaded" | "error";
	/** Erreur de chargement (si status === "error") */
	error?: string;
	/** Indique si le widget est interne (built-in) ou externe */
	isExternal: boolean;
}

/**
 * Métadonnées d'une bibliothèque de widgets
 */
export interface WidgetLibraryMetadata {
	/** ID unique de la bibliothèque */
	id: string;
	/** Nom de la bibliothèque */
	name: string;
	/** Description */
	description?: string;
	/** URL de la bibliothèque (si externe) */
	url?: string;
	/** Version */
	version?: string;
	/** Auteur */
	author?: string;
	/** Liste des widgets dans cette bibliothèque */
	widgets: ExternalWidgetDefinition[];
	/** Date de création */
	createdAt?: string;
	/** Dernière mise à jour */
	updatedAt?: string;
}

/**
 * Configuration pour le chargement d'un widget externe
 */
export interface WidgetLoadConfig {
	/** URL du module à charger */
	moduleUrl: string;
	/** Nom de l'export par défaut (si différent de "default") */
	exportName?: string;
	/** Timeout en millisecondes */
	timeout?: number;
	/** Cache policy */
	cache?: "default" | "no-cache" | "reload" | "force-cache";
}

/**
 * Résultat du chargement d'un widget
 */
export interface WidgetLoadResult {
	/** Succès du chargement */
	success: boolean;
	/** Composant chargé (si succès) */
	component?: LazyExoticComponent<ComponentType<WidgetProps>>;
	/** Erreur (si échec) */
	error?: string;
	/** Temps de chargement en ms */
	loadTime?: number;
}



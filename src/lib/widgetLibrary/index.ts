/**
 * Widget Library System
 * 
 * Système de bibliothèque de widgets avec ajout dynamique.
 * Permet de charger des widgets externes depuis des URLs ou des fichiers locaux.
 */

export * from "./types";
export * from "./widgetValidator";
export * from "./widgetLoader";
export * from "./widgetStorage";
export * from "./widgetLibrary";

// Export de l'instance singleton
export { widgetLibrary } from "./widgetLibrary";



import type { ExternalWidgetDefinition, WidgetLibraryMetadata } from "./types";

/**
 * Erreurs de validation possibles
 */
export const ValidationError = {
	INVALID_ID: "INVALID_ID",
	INVALID_NAME: "INVALID_NAME",
	INVALID_MODULE_URL: "INVALID_MODULE_URL",
	INVALID_SIZE: "INVALID_SIZE",
	DUPLICATE_ID: "DUPLICATE_ID",
	MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
	INVALID_VERSION: "INVALID_VERSION",
} as const;

export type ValidationErrorType = typeof ValidationError[keyof typeof ValidationError];

/**
 * Résultat de la validation
 */
export interface ValidationResult {
	/** Valide ou non */
	valid: boolean;
	/** Erreurs de validation */
	errors: Array<{
		field: string;
		error: ValidationErrorType;
		message: string;
	}>;
}

/**
 * Valide un widget externe
 */
export function validateWidget(widget: Partial<ExternalWidgetDefinition>): ValidationResult {
	const errors: ValidationResult["errors"] = [];

	// ID requis et valide
	if (!widget.id) {
		errors.push({
			field: "id",
			error: ValidationError.MISSING_REQUIRED_FIELD,
			message: "L'ID du widget est requis",
		});
	} else if (typeof widget.id !== "string" || widget.id.trim().length === 0) {
		errors.push({
			field: "id",
			error: ValidationError.INVALID_ID,
			message: "L'ID du widget doit être une chaîne non vide",
		});
	} else if (!/^[a-z0-9-]+$/.test(widget.id)) {
		errors.push({
			field: "id",
			error: ValidationError.INVALID_ID,
			message: "L'ID du widget ne peut contenir que des lettres minuscules, chiffres et tirets",
		});
	}

	// Nom requis
	if (!widget.name) {
		errors.push({
			field: "name",
			error: ValidationError.MISSING_REQUIRED_FIELD,
			message: "Le nom du widget est requis",
		});
	} else if (typeof widget.name !== "string" || widget.name.trim().length === 0) {
		errors.push({
			field: "name",
			error: ValidationError.INVALID_NAME,
			message: "Le nom du widget doit être une chaîne non vide",
		});
	}

	// Description requise
	if (!widget.description) {
		errors.push({
			field: "description",
			error: ValidationError.MISSING_REQUIRED_FIELD,
			message: "La description du widget est requise",
		});
	}

	// Module URL requis et valide
	if (!widget.moduleUrl) {
		errors.push({
			field: "moduleUrl",
			error: ValidationError.MISSING_REQUIRED_FIELD,
			message: "L'URL du module est requise",
		});
	} else if (typeof widget.moduleUrl !== "string") {
		errors.push({
			field: "moduleUrl",
			error: ValidationError.INVALID_MODULE_URL,
			message: "L'URL du module doit être une chaîne valide",
		});
	} else {
		try {
			new URL(widget.moduleUrl);
		} catch {
			// Vérifier si c'est un chemin relatif valide
			if (!widget.moduleUrl.startsWith("./") && !widget.moduleUrl.startsWith("../") && !widget.moduleUrl.startsWith("/")) {
				errors.push({
					field: "moduleUrl",
					error: ValidationError.INVALID_MODULE_URL,
					message: "L'URL du module doit être une URL valide ou un chemin relatif",
				});
			}
		}
	}

	// Tailles valides
	if (!widget.defaultSize) {
		errors.push({
			field: "defaultSize",
			error: ValidationError.MISSING_REQUIRED_FIELD,
			message: "La taille par défaut est requise",
		});
	} else {
		if (typeof widget.defaultSize.w !== "number" || widget.defaultSize.w < 1) {
			errors.push({
				field: "defaultSize.w",
				error: ValidationError.INVALID_SIZE,
				message: "La largeur par défaut doit être un nombre >= 1",
			});
		}
		if (typeof widget.defaultSize.h !== "number" || widget.defaultSize.h < 1) {
			errors.push({
				field: "defaultSize.h",
				error: ValidationError.INVALID_SIZE,
				message: "La hauteur par défaut doit être un nombre >= 1",
			});
		}
	}

	if (!widget.minSize) {
		errors.push({
			field: "minSize",
			error: ValidationError.MISSING_REQUIRED_FIELD,
			message: "La taille minimale est requise",
		});
	} else {
		if (typeof widget.minSize.w !== "number" || widget.minSize.w < 1) {
			errors.push({
				field: "minSize.w",
				error: ValidationError.INVALID_SIZE,
				message: "La largeur minimale doit être un nombre >= 1",
			});
		}
		if (typeof widget.minSize.h !== "number" || widget.minSize.h < 1) {
			errors.push({
				field: "minSize.h",
				error: ValidationError.INVALID_SIZE,
				message: "La hauteur minimale doit être un nombre >= 1",
			});
		}
		// Vérifier que minSize <= defaultSize
		if (widget.defaultSize && widget.minSize.w > widget.defaultSize.w) {
			errors.push({
				field: "minSize.w",
				error: ValidationError.INVALID_SIZE,
				message: "La largeur minimale ne peut pas être supérieure à la largeur par défaut",
			});
		}
		if (widget.defaultSize && widget.minSize.h > widget.defaultSize.h) {
			errors.push({
				field: "minSize.h",
				error: ValidationError.INVALID_SIZE,
				message: "La hauteur minimale ne peut pas être supérieure à la hauteur par défaut",
			});
		}
	}

	if (widget.maxSize) {
		if (typeof widget.maxSize.w !== "number" || widget.maxSize.w < 1) {
			errors.push({
				field: "maxSize.w",
				error: ValidationError.INVALID_SIZE,
				message: "La largeur maximale doit être un nombre >= 1",
			});
		}
		if (typeof widget.maxSize.h !== "number" || widget.maxSize.h < 1) {
			errors.push({
				field: "maxSize.h",
				error: ValidationError.INVALID_SIZE,
				message: "La hauteur maximale doit être un nombre >= 1",
			});
		}
		// Vérifier que defaultSize <= maxSize
		if (widget.defaultSize && widget.maxSize.w < widget.defaultSize.w) {
			errors.push({
				field: "maxSize.w",
				error: ValidationError.INVALID_SIZE,
				message: "La largeur maximale ne peut pas être inférieure à la largeur par défaut",
			});
		}
		if (widget.defaultSize && widget.maxSize.h < widget.defaultSize.h) {
			errors.push({
				field: "maxSize.h",
				error: ValidationError.INVALID_SIZE,
				message: "La hauteur maximale ne peut pas être inférieure à la hauteur par défaut",
			});
		}
	}

	// Version valide (si fournie)
	if (widget.version && typeof widget.version !== "string") {
		errors.push({
			field: "version",
			error: ValidationError.INVALID_VERSION,
			message: "La version doit être une chaîne valide (ex: '1.0.0')",
		});
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Valide une bibliothèque de widgets
 */
export function validateLibrary(library: Partial<WidgetLibraryMetadata>): ValidationResult {
	const errors: ValidationResult["errors"] = [];

	// ID requis
	if (!library.id) {
		errors.push({
			field: "id",
			error: ValidationError.MISSING_REQUIRED_FIELD,
			message: "L'ID de la bibliothèque est requis",
		});
	} else if (typeof library.id !== "string" || library.id.trim().length === 0) {
		errors.push({
			field: "id",
			error: ValidationError.INVALID_ID,
			message: "L'ID de la bibliothèque doit être une chaîne non vide",
		});
	}

	// Nom requis
	if (!library.name) {
		errors.push({
			field: "name",
			error: ValidationError.MISSING_REQUIRED_FIELD,
			message: "Le nom de la bibliothèque est requis",
		});
	}

	// Widgets requis et valides
	if (!library.widgets || !Array.isArray(library.widgets)) {
		errors.push({
			field: "widgets",
			error: ValidationError.MISSING_REQUIRED_FIELD,
			message: "La liste des widgets est requise",
		});
	} else {
		// Valider chaque widget
		const widgetIds = new Set<string>();
		library.widgets.forEach((widget, index) => {
			const widgetValidation = validateWidget(widget);
			if (!widgetValidation.valid) {
				widgetValidation.errors.forEach((error) => {
					errors.push({
						field: `widgets[${index}].${error.field}`,
						error: error.error,
						message: error.message,
					});
				});
			}

			// Vérifier les doublons d'ID
			if (widget.id) {
				if (widgetIds.has(widget.id)) {
					errors.push({
						field: `widgets[${index}].id`,
						error: ValidationError.DUPLICATE_ID,
						message: `L'ID '${widget.id}' est déjà utilisé dans cette bibliothèque`,
					});
				}
				widgetIds.add(widget.id);
			}
		});
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}


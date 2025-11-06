import { useMemo, memo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { X, GripVertical } from "lucide-react";
import { WidgetItem } from "./WidgetItem";
import { useDashboardStore } from "@/store/dashboardStore";
import { getWidgetDefinition } from "@/lib/widgetRegistry";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { calculateWidgetSize } from "@/lib/widgetSize";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface WidgetGridProps {
	searchQuery?: string;
}

function WidgetGridComponent({ searchQuery = "" }: WidgetGridProps) {
	const widgets = useDashboardStore((state) => state.widgets);
	const updateLayout = useDashboardStore((state) => state.updateLayout);
	const removeWidget = useDashboardStore((state) => state.removeWidget);

	// Filtrer les widgets selon la recherche
	const filteredWidgets = useMemo(() => {
		if (!searchQuery) return widgets;
		return widgets.filter((widget) => {
			const def = getWidgetDefinition(widget.type);
			if (!def) return false;
			const query = searchQuery.toLowerCase();
			return (
				def.name.toLowerCase().includes(query) ||
				def.description?.toLowerCase().includes(query) ||
				widget.type.toLowerCase().includes(query)
			);
		});
	}, [widgets, searchQuery]);

	// Convertir widgets en layout pour react-grid-layout
	const layouts = useMemo(() => {
		return filteredWidgets.map((widget) => {
			const widgetDef = getWidgetDefinition(widget.type);
			// PRIORITÉ : Toujours utiliser widgetDef.minSize (source de vérité)
			// widget.minW/minH peut être obsolète si le widget a été créé avant une mise à jour
			return {
				i: widget.id,
				x: widget.x,
				y: widget.y,
				w: widget.w,
				h: widget.h,
				minW: widgetDef?.minSize.w ?? widget.minW ?? 2,
				minH: widgetDef?.minSize.h ?? widget.minH ?? 2,
				maxW: widgetDef?.maxSize?.w ?? widget.maxW,
				maxH: widgetDef?.maxSize?.h ?? widget.maxH,
			};
		});
	}, [filteredWidgets]);

	const handleLayoutChange = (
		_layout: Layout[],
		layouts: { [key: string]: Layout[] }
	) => {
		// Utiliser le layout lg (desktop) comme référence principale
		const mainLayout =
			layouts.lg || layouts.md || layouts.sm || Object.values(layouts)[0];
		if (!mainLayout) return;

		const updatedWidgets = mainLayout
			.map((item) => {
				const originalWidget = widgets.find((w) => w.id === item.i);
				if (!originalWidget) return null;

				const widgetDef = getWidgetDefinition(originalWidget.type);
				if (!widgetDef) {
					return {
						...originalWidget,
						x: item.x,
						y: item.y,
						w: item.w,
						h: item.h,
					};
				}

				// Calculer la taille actuelle et précédente
				const currentSize = calculateWidgetSize({ w: item.w, h: item.h }, originalWidget.type);
				const previousSize = calculateWidgetSize(
					{ w: originalWidget.w, h: originalWidget.h },
					originalWidget.type
				);

				// Respecter les contraintes min/max du widget
				// PRIORITÉ : Toujours utiliser widgetDef.minSize (source de vérité)
				// originalWidget.minW/minH peut être obsolète si le widget a été créé avant une mise à jour
				const minW = widgetDef.minSize.w ?? originalWidget.minW ?? 2;
				const minH = widgetDef.minSize.h ?? originalWidget.minH ?? 2;
				const maxW = widgetDef.maxSize?.w ?? originalWidget.maxW;
				const maxH = widgetDef.maxSize?.h ?? originalWidget.maxH;

				// Tailles canoniques pour chaque variante (en respectant VRAIMENT les contraintes min/max)
				// Ces tailles sont utilisées lors des transitions pour éviter les tailles intermédiaires
				// MAIS on respecte toujours les minW/minH du widget, on ne force jamais de tailles arbitraires
				const isCalendar = originalWidget.type === "calendar";
				const getCanonicalSize = (size: "compact" | "medium" | "full") => {
					let canonicalW: number;
					let canonicalH: number;

					if (size === "compact") {
						if (isCalendar) {
							// Calendar compact : format vertical 2x3 (plus haut que large)
							// Mais respecter minW/minH si plus grand
							canonicalW = Math.max(2, minW);
							canonicalH = Math.max(3, minH);
							if (maxW) canonicalW = Math.min(canonicalW, Math.min(3, maxW));
							if (maxH) canonicalH = Math.min(canonicalH, Math.min(3, maxH));
						} else {
							// Compact : utiliser minW/minH directement (pas de minimum arbitraire de 3x3)
							// Si minW=2 et minH=3, on peut faire 2x3, pas forcément 3x3
							canonicalW = minW; // Utiliser directement minW, pas Math.max(3, minW)
							canonicalH = minH; // Utiliser directement minH, pas Math.max(3, minH)
							// Respecter maxW/maxH si définis (mais ne pas dépasser les seuils compact)
							if (maxW) canonicalW = Math.min(canonicalW, Math.min(3, maxW));
							if (maxH) canonicalH = Math.min(canonicalH, Math.min(3, maxH));
						}
					} else if (size === "medium") {
						if (isCalendar) {
							// Calendar medium : format vertical 4x6 (plus haut que large)
							canonicalW = Math.max(4, minW);
							canonicalH = Math.max(6, minH);
							if (maxW) canonicalW = Math.min(canonicalW, Math.min(5, maxW));
							if (maxH) canonicalH = Math.min(canonicalH, Math.min(6, maxH));
						} else {
							// Medium : utiliser minW/minH directement
							// Si minW=2 et minH=3, on peut faire 2x3 pour medium (pas de minimum arbitraire de 4x4)
							// On préfère 4x4 pour medium, mais on respecte minW/minH si plus petit
							canonicalW = Math.max(4, minW); // Préférer 4, mais respecter minW si plus petit
							canonicalH = Math.max(4, minH); // Préférer 4, mais respecter minH si plus petit
							// MAIS si minW < 4, on peut quand même utiliser minW (pas forcer 4)
							// Cette logique est utilisée uniquement lors de l'AGRANDISSEMENT
							// Lors de la RÉDUCTION, on utilise directement minW/minH (voir ÉTAPE 1)
							// Respecter maxW/maxH si définis (mais ne pas dépasser les seuils medium)
							if (maxW) canonicalW = Math.min(canonicalW, Math.min(5, maxW));
							if (maxH) canonicalH = Math.min(canonicalH, Math.min(6, maxH));
						}
					} else {
						if (isCalendar) {
							// Calendar full : format vertical 6x8 (plus haut que large)
							canonicalW = Math.max(6, minW);
							canonicalH = Math.max(8, minH);
							if (maxW) canonicalW = Math.min(canonicalW, maxW);
							if (maxH) canonicalH = Math.min(canonicalH, maxH);
						} else {
							// Full : utiliser minW/minH directement
							// Si minW=2 et minH=3, on peut faire 2x3 pour full (pas de minimum arbitraire de 6x6)
							// On préfère 6x6 pour full, mais on respecte minW/minH si plus petit
							canonicalW = Math.max(6, minW); // Préférer 6, mais respecter minW si plus petit
							canonicalH = Math.max(6, minH); // Préférer 6, mais respecter minH si plus petit
							// MAIS si minW < 6, on peut quand même utiliser minW (pas forcer 6)
							// Cette logique est utilisée uniquement lors de l'AGRANDISSEMENT
							// Lors de la RÉDUCTION, on utilise directement minW/minH (voir ÉTAPE 1)
							// Respecter maxW/maxH si définis
							if (maxW) canonicalW = Math.min(canonicalW, maxW);
							if (maxH) canonicalH = Math.min(canonicalH, maxH);
						}
					}

					return { w: canonicalW, h: canonicalH };
				};

				let finalW = item.w;
				let finalH = item.h;

				// ÉTAPE 1 : Appliquer les contraintes min/max EN PREMIER (AVANT toute autre logique)
				// C'est la source de vérité absolue - on ne peut jamais être en dessous de minW/minH
				finalW = Math.max(finalW, minW);
				finalH = Math.max(finalH, minH);
				if (maxW) finalW = Math.min(finalW, maxW);
				if (maxH) finalH = Math.min(finalH, maxH);

				// ÉTAPE 2 : DÉTECTION DE TRANSITION : Si la taille change, forcer la taille canonique
				// MAIS seulement si on AGRANDIT (pas si on réduit)
				const isEnlarging = 
					(previousSize === "compact" && currentSize !== "compact") ||
					(previousSize === "medium" && currentSize === "full");
				
				if (previousSize !== currentSize && isEnlarging) {
					// Transition détectée lors d'un AGRANDISSEMENT : forcer la taille canonique de la nouvelle taille
					// MAIS on respecte toujours minW/minH (déjà appliqué ci-dessus)
					const canonical = getCanonicalSize(currentSize);
					// Utiliser la taille canonique, mais s'assurer qu'elle respecte minW/minH
					finalW = Math.max(canonical.w, minW);
					finalH = Math.max(canonical.h, minH);
					// Respecter aussi maxW/maxH
					if (maxW) finalW = Math.min(finalW, maxW);
					if (maxH) finalH = Math.min(finalH, maxH);
				} else {
					// Pas de transition OU on RÉDUIT : on permet de réduire jusqu'à minW/minH
					// On ne force PAS les tailles canoniques lors de la réduction
					// On permet à l'utilisateur de réduire librement jusqu'à minW/minH
					// Les contraintes min/max sont déjà appliquées en ÉTAPE 1
					
					// S'assurer qu'on reste dans les limites de la taille actuelle (maximums)
					// MAIS on ne force jamais de tailles minimales arbitraires, on respecte minW/minH
					if (currentSize === "compact") {
						// Limiter à 3x3 maximum pour compact (selon WIDGET_SIZE_THRESHOLDS)
						// Mais respecter minW/minH : si minW=2, on peut faire 2x3, pas forcément 3x3
						const maxCompactW = maxW ? Math.min(3, maxW) : 3;
						const maxCompactH = maxH ? Math.min(3, maxH) : 3;
						finalW = Math.min(finalW, maxCompactW);
						finalH = Math.min(finalH, maxCompactH);
						// S'assurer que l'aire ne dépasse pas 9
						const area = finalW * finalH;
						if (area > 9) {
							const ratio = Math.sqrt(9 / area);
							finalW = Math.max(minW, Math.floor(finalW * ratio)); // Respecter minW, pas forcer 3
							finalH = Math.max(minH, Math.floor(finalH * ratio)); // Respecter minH, pas forcer 3
						}
					} else if (currentSize === "medium") {
						// Limiter à 5x6 maximum pour medium
						// MAIS on permet de réduire jusqu'à minW/minH (déjà appliqué en ÉTAPE 1)
						finalW = Math.min(finalW, maxW ? Math.min(5, maxW) : 5);
						finalH = Math.min(finalH, maxH ? Math.min(6, maxH) : 6);
						// S'assurer que l'aire ne dépasse pas 30
						const area = finalW * finalH;
						if (area > 30) {
							const ratio = Math.sqrt(30 / area);
							finalW = Math.max(minW, Math.floor(finalW * ratio));
							finalH = Math.max(minH, Math.floor(finalH * ratio));
						}
					}
					// Pour full, pas de limite supérieure (sauf maxW/maxH)
					// MAIS on permet toujours de réduire jusqu'à minW/minH (déjà appliqué en ÉTAPE 1)
				}

				// ÉTAPE 3 : Réappliquer les contraintes min/max APRÈS toutes les autres logiques
				// C'est une sécurité supplémentaire pour garantir qu'on respecte toujours minW/minH
				finalW = Math.max(finalW, minW);
				finalH = Math.max(finalH, minH);
				if (maxW) finalW = Math.min(finalW, maxW);
				if (maxH) finalH = Math.min(finalH, maxH);

				// CONTRAINTE DE RATIO D'ASPECT : Éviter les widgets trop larges et plats
				// Ratio minimum : h/w >= 0.6 (le widget ne peut pas être plus de 1.67x plus large que haut)
				// Cela évite les widgets "pancake" comme 8x2, 10x2, etc.
				// Exception pour Calendar : ratio minimum 0.4, mais peut être > 1
				const MIN_ASPECT_RATIO = isCalendar ? 0.4 : 0.6; // Plus strict pour les autres widgets
				const MAX_ASPECT_RATIO = 2.5; // Le widget ne peut pas être plus de 2.5x plus haut que large
				
				const currentAspectRatio = finalH / finalW;
				
				// Vérifier le ratio minimum (éviter les widgets trop larges)
				if (currentAspectRatio < MIN_ASPECT_RATIO) {
					// Le widget est trop large, augmenter la hauteur pour respecter le ratio
					const requiredH = Math.ceil(finalW * MIN_ASPECT_RATIO);
					finalH = Math.max(finalH, requiredH);
					// Respecter les contraintes max si elles existent
					if (maxH) finalH = Math.min(finalH, maxH);
					// Si on ne peut pas augmenter la hauteur assez, réduire la largeur
					if (finalH < requiredH && maxH) {
						const requiredW = Math.ceil(finalH / MIN_ASPECT_RATIO);
						finalW = Math.min(finalW, requiredW);
						if (minW) finalW = Math.max(finalW, minW);
					}
				}
				
				// Vérifier le ratio maximum (éviter les widgets trop hauts)
				if (currentAspectRatio > MAX_ASPECT_RATIO && !isCalendar) {
					// Le widget est trop haut, augmenter la largeur pour respecter le ratio
					const requiredW = Math.ceil(finalH / MAX_ASPECT_RATIO);
					finalW = Math.max(finalW, requiredW);
					// Respecter les contraintes max si elles existent
					if (maxW) finalW = Math.min(finalW, maxW);
					// Si on ne peut pas augmenter la largeur assez, réduire la hauteur
					if (finalW < requiredW && maxW) {
						const requiredH = Math.ceil(finalW * MAX_ASPECT_RATIO);
						finalH = Math.min(finalH, requiredH);
						if (minH) finalH = Math.max(finalH, minH);
					}
				}

				// DERNIÈRE VÉRIFICATION ABSOLUE : S'assurer qu'on respecte TOUJOURS minW/minH
				// (même après TOUS les ajustements - transitions, ratios, etc.)
				// C'est la contrainte absolue - on ne peut JAMAIS être en dessous
				finalW = Math.max(finalW, minW);
				finalH = Math.max(finalH, minH);
				if (maxW) finalW = Math.min(finalW, maxW);
				if (maxH) finalH = Math.min(finalH, maxH);

				return {
					...originalWidget,
					x: item.x,
					y: item.y,
					w: finalW,
					h: finalH,
					// Mettre à jour les contraintes minW/minH pour correspondre à widgetRegistry (source de vérité)
					// Cela garantit que les widgets peuvent être réduits correctement
					minW: widgetDef.minSize.w,
					minH: widgetDef.minSize.h,
					// Mettre à jour aussi maxW/maxH si définis
					maxW: widgetDef.maxSize?.w,
					maxH: widgetDef.maxSize?.h,
				};
			})
			.filter(Boolean) as typeof widgets;

		updateLayout(updatedWidgets);
	};

	// Breakpoints responsive
	const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
	const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

	return (
		<div className='w-full h-full'>
			<ResponsiveGridLayout
				className='layout'
				layouts={{
					lg: layouts,
					md: layouts,
					sm: layouts,
					xs: layouts,
					xxs: layouts,
				}}
				breakpoints={breakpoints}
				cols={cols}
				rowHeight={60}
				onLayoutChange={handleLayoutChange}
				margin={[16, 16]}
				containerPadding={[16, 16]}
				isDraggable={true}
				isResizable={true}
				draggableHandle='.widget-drag-handle'
				compactType='vertical'
				preventCollision={false}
			>
				{filteredWidgets.map((widget, index) => {
					const layout = layouts.find((l) => l.i === widget.id);
					if (!layout) return null;

					const widgetDef = getWidgetDefinition(widget.type);

					return (
						<div key={widget.id} className='widget-drag-handle relative group flex flex-col h-full'>
							{/* Barre d'outils discrète en haut - zone réservée permanente */}
							<div className='absolute top-0 left-0 right-0 h-8 z-10 flex items-center justify-between px-2 pointer-events-none'>
								{/* Indicateur de drag */}
								<div className='opacity-0 group-hover:opacity-100 transition-opacity'>
									<div className='flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 backdrop-blur-sm'>
										<GripVertical className='h-3 w-3 text-primary/70' />
										<span className='text-[10px] font-medium text-primary/70'>
											Déplacer
										</span>
									</div>
								</div>

								{/* Bouton supprimer */}
								<div className='opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto'>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												variant='ghost'
												size='icon'
												className='h-6 w-6 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive/70 hover:text-destructive border border-destructive/20 hover:border-destructive/40 transition-all shadow-sm hover:shadow-md'
												onMouseDown={(e: React.MouseEvent) => {
													e.stopPropagation();
												}}
												onDragStart={(e: React.DragEvent) => {
													e.preventDefault();
													e.stopPropagation();
												}}
												aria-label={`Supprimer le widget ${
													widgetDef?.name || ""
												}`}
											>
												<X className='h-3 w-3' />
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Supprimer le widget</AlertDialogTitle>
												<AlertDialogDescription>
													Êtes-vous sûr de vouloir supprimer le widget "
													{widgetDef?.name || ""}" ? Cette action est
													irréversible.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Annuler</AlertDialogCancel>
												<AlertDialogAction
													onClick={() => {
														removeWidget(widget.id);
													}}
													className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
												>
													Supprimer
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</div>
							</div>

							{/* Contenu du widget avec padding-top pour laisser l'espace à la barre d'outils */}
							<motion.div
								initial={{ opacity: 0, scale: 0.95, y: 4 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								transition={{
									duration: 0.3,
									delay: index * 0.05,
									ease: "easeOut",
								}}
								className='h-full w-full pt-8'
							>
								<WidgetItem layout={layout} />
							</motion.div>
						</div>
					);
				})}
			</ResponsiveGridLayout>
		</div>
	);
}

// Optimiser avec React.memo pour éviter les re-renders inutiles
export const WidgetGrid = memo(WidgetGridComponent);

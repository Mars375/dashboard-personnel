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
			return {
				i: widget.id,
				x: widget.x,
				y: widget.y,
				w: widget.w,
				h: widget.h,
				minW: widget.minW ?? widgetDef?.minSize.w ?? 2,
				minH: widget.minH ?? widgetDef?.minSize.h ?? 2,
				maxW: widget.maxW ?? widgetDef?.maxSize?.w,
				maxH: widget.maxH ?? widgetDef?.maxSize?.h,
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

				return {
					...originalWidget,
					x: item.x,
					y: item.y,
					w: item.w,
					h: item.h,
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
														const removeWidget =
															useDashboardStore.getState().removeWidget;
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

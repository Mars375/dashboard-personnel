import { useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { X } from "lucide-react";
import { WidgetItem } from "./WidgetItem";
import { useDashboardStore } from "@/store/dashboardStore";
import { getWidgetDefinition } from "@/lib/widgetRegistry";
import { Button } from "@/components/ui/button";
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

export function WidgetGrid() {
	const widgets = useDashboardStore((state) => state.widgets);
	const updateLayout = useDashboardStore((state) => state.updateLayout);

	// Convertir widgets en layout pour react-grid-layout
	const layouts = useMemo(() => {
		return widgets.map((widget) => {
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
	}, [widgets]);

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
				{widgets.map((widget) => {
					const layout = layouts.find((l) => l.i === widget.id);
					if (!layout) return null;

					const widgetDef = getWidgetDefinition(widget.type);

					return (
						<div key={widget.id} className='widget-drag-handle relative group'>
							{/* Bouton supprimer - en dehors du cadre */}
							<div
								className='absolute -top-2 -right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity'
								onMouseDown={(e) => e.stopPropagation()}
								onTouchStart={(e) => e.stopPropagation()}
							>
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button
											variant='destructive'
											size='icon'
											className='h-7 w-7 rounded-full shadow-lg pointer-events-auto border-2 border-background'
											aria-label={`Supprimer le widget ${
												widgetDef?.name || ""
											}`}
										>
											<X className='h-4 w-4' />
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
							<WidgetItem layout={layout} />
						</div>
					);
				})}
			</ResponsiveGridLayout>
		</div>
	);
}

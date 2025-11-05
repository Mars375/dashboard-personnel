import { useMemo, memo, Suspense } from "react";
import type { Layout } from "react-grid-layout";
import { getWidgetDefinition } from "@/lib/widgetRegistry";
import { useDashboardStore } from "@/store/dashboardStore";
import { calculateWidgetSize } from "@/lib/widgetSize";
import { WidgetSkeleton } from "@/components/ui/widget-skeleton";

interface WidgetItemProps {
	layout: Layout;
}

function WidgetItemComponent({ layout }: WidgetItemProps) {
	const widgets = useDashboardStore((state) => state.widgets);

	// Trouver le widget correspondant
	const widgetData = useMemo(() => {
		return widgets.find((w) => w.id === layout.i);
	}, [widgets, layout.i]);

	const widgetDef = widgetData ? getWidgetDefinition(widgetData.type) : null;

	if (!widgetData || !widgetDef) {
		return null;
	}

	const WidgetComponent = widgetDef.component;

	// Calculer la taille du widget pour déterminer la variante
	const widgetSize = useMemo(() => {
		return calculateWidgetSize({ w: layout.w, h: layout.h }, widgetData.type);
	}, [layout.w, layout.h, widgetData.type]);

	return (
		<div className='h-full w-full'>
			{/* Widget */}
			<div className='h-full w-full overflow-auto'>
				<div className='h-full w-full min-w-0'>
					<Suspense fallback={<WidgetSkeleton widgetType={widgetData.type} />}>
						<WidgetComponent
							size={widgetSize}
							width={layout.w}
							height={layout.h}
						/>
					</Suspense>
				</div>
			</div>
		</div>
	);
}

// Optimiser avec React.memo pour éviter les re-renders inutiles
export const WidgetItem = memo(WidgetItemComponent);

import { useMemo } from "react";
import type { Layout } from "react-grid-layout";
import { getWidgetDefinition } from "@/lib/widgetRegistry";
import { useDashboardStore } from "@/store/dashboardStore";
import { calculateWidgetSize } from "@/lib/widgetSize";

interface WidgetItemProps {
	layout: Layout;
}

export function WidgetItem({ layout }: WidgetItemProps) {
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
					<WidgetComponent
						size={widgetSize}
						width={layout.w}
						height={layout.h}
					/>
				</div>
			</div>
		</div>
	);
}

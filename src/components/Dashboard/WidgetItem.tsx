import { useMemo, memo, Suspense } from "react";
import type { Layout } from "react-grid-layout";
import { getWidgetDefinition } from "@/lib/widgetRegistry";
import { useDashboardStore } from "@/store/dashboardStore";
import { calculateWidgetSize } from "@/lib/widgetSize";
import { WidgetSkeleton } from "@/components/ui/widget-skeleton";
import { useIsMobile } from "@/hooks/useIsMobile";

interface WidgetItemProps {
	layout: Layout;
}

function WidgetItemComponent({ layout }: WidgetItemProps) {
	const widgets = useDashboardStore((state) => state.widgets);
	const isMobile = useIsMobile();

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
	// Sur mobile, forcer compact
	const widgetSize = useMemo(() => {
		if (isMobile) {
			return "compact";
		}
		return calculateWidgetSize({ w: layout.w, h: layout.h }, widgetData.type);
	}, [layout.w, layout.h, widgetData.type, isMobile]);

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

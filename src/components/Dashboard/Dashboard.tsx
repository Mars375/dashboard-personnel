import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WidgetGrid } from "./WidgetGrid";
import { WidgetPicker } from "./WidgetPicker";
import { useDashboardStore } from "@/store/dashboardStore";

export function Dashboard() {
	const openPicker = useDashboardStore((state) => state.openPicker);
	const widgets = useDashboardStore((state) => state.widgets);

	return (
		<div className="min-h-screen bg-background p-4">
			{/* Header avec bouton ajouter */}
			<div className="mb-4 flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Mon Dashboard</h1>
					<p className="text-sm text-muted-foreground">
						{widgets.length} widget{widgets.length > 1 ? "s" : ""} configuré{widgets.length > 1 ? "s" : ""}
					</p>
				</div>
				<Button onClick={openPicker} className="gap-2">
					<Plus className="h-4 w-4" />
					Ajouter un widget
				</Button>
			</div>

			{/* Grille de widgets */}
			{widgets.length === 0 ? (
				<div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
					<p className="text-lg text-muted-foreground">Aucun widget configuré</p>
					<p className="text-sm text-muted-foreground">
						Cliquez sur "Ajouter un widget" pour commencer
					</p>
					<Button onClick={openPicker} variant="outline" className="gap-2 mt-2">
						<Plus className="h-4 w-4" />
						Ajouter votre premier widget
					</Button>
				</div>
			) : (
				<WidgetGrid />
			)}

			{/* Dialog Widget Picker */}
			<WidgetPicker />
		</div>
	);
}





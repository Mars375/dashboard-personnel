import { Plus, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WidgetGrid } from "./WidgetGrid";
import { WidgetPicker } from "./WidgetPicker";
import { useDashboardStore } from "@/store/dashboardStore";
import { motion } from "framer-motion";
import { useState } from "react";

export function Dashboard() {
	const openPicker = useDashboardStore((state) => state.openPicker);
	const widgets = useDashboardStore((state) => state.widgets);
	const [isHoveringAdd, setIsHoveringAdd] = useState(false);

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			{/* Header moderne avec animations */}
			<motion.header
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 mb-4"
			>
				<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center justify-between">
						{/* Logo et titre */}
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.3, delay: 0.1 }}
							className="flex items-center gap-3"
						>
							<div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
								<LayoutDashboard className="h-5 w-5 text-primary" />
							</div>
							<div>
								<h1 className="text-2xl font-bold tracking-tight">Mon Dashboard</h1>
								<p className="text-xs sm:text-sm text-muted-foreground">
									{widgets.length} widget{widgets.length > 1 ? "s" : ""} configuré
									{widgets.length > 1 ? "s" : ""}
								</p>
							</div>
						</motion.div>

						{/* Bouton ajouter avec animation */}
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.3, delay: 0.1 }}
						>
							<Button
								onClick={openPicker}
								onMouseEnter={() => setIsHoveringAdd(true)}
								onMouseLeave={() => setIsHoveringAdd(false)}
								className="gap-2 shadow-md hover:shadow-lg transition-all duration-200"
								size="lg"
							>
								<motion.div
									animate={{
										rotate: isHoveringAdd ? 90 : 0,
										scale: isHoveringAdd ? 1.1 : 1,
									}}
									transition={{ duration: 0.2 }}
								>
									<Plus className="h-4 w-4" />
								</motion.div>
								<span className="hidden sm:inline">Ajouter un widget</span>
								<span className="sm:hidden">Ajouter</span>
							</Button>
						</motion.div>
					</div>
				</div>
			</motion.header>

			{/* Contenu principal */}
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">

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
			</div>

			{/* Dialog Widget Picker */}
			<WidgetPicker />
		</div>
	);
}





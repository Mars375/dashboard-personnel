import {
	Plus,
	LayoutDashboard,
	Sparkles,
	Search,
	Command,
	Sun,
	Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WidgetGrid } from "./WidgetGrid";
import { WidgetPicker } from "./WidgetPicker";
import { WidgetLibraryManager } from "./WidgetLibraryManager";
import { useDashboardStore } from "@/store/dashboardStore";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, memo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { getWidgetDefinition } from "@/lib/widgetRegistry";
import { useTheme } from "@/hooks/useTheme";
import { useIsMobile } from "@/hooks/useIsMobile";
import { GoogleOAuthButton } from "@/components/ui/google-oauth-button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

function DashboardComponent() {
	const openPicker = useDashboardStore((state) => state.openPicker);
	const widgets = useDashboardStore((state) => state.widgets);
	const [isHoveringAdd, setIsHoveringAdd] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const { theme, toggleTheme } = useTheme();
	const [isLibraryManagerOpen, setIsLibraryManagerOpen] = useState(false);
	const isMobile = useIsMobile();

	// Raccourcis clavier
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ctrl+K ou Cmd+K pour ouvrir le picker
			if ((e.ctrlKey || e.metaKey) && e.key === "k") {
				e.preventDefault();
				openPicker();
			}
			// Ctrl+F ou Cmd+F pour la recherche
			if ((e.ctrlKey || e.metaKey) && e.key === "f") {
				e.preventDefault();
				const searchInput = document.querySelector(
					'input[placeholder="Rechercher un widget..."]'
				) as HTMLInputElement;
				if (searchInput) {
					searchInput.focus();
				}
			}
			// Échap pour effacer la recherche
			if (e.key === "Escape" && searchQuery) {
				setSearchQuery("");
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [openPicker, searchQuery]);

	// Calculer les statistiques des widgets - optimisé avec useMemo
	const widgetStats = useMemo(() => {
		return widgets.reduce(
			(acc, widget) => {
				const def = getWidgetDefinition(widget.type);
				if (def) {
					acc[widget.type] = (acc[widget.type] || 0) + 1;
				}
				return acc;
			},
			{} as Record<string, number>
		);
	}, [widgets]);

	const totalWidgets = useMemo(() => widgets.length, [widgets]);
	const widgetTypesCount = useMemo(
		() => Object.keys(widgetStats).length,
		[widgetStats]
	);

	return (
		<div className='min-h-screen bg-linear-to-br from-background via-background to-muted/20'>
			{/* Header moderne avec animations */}
			<motion.header
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className='sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60 mb-4'
			>
				<div className='container mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4'>
					{/* Header mobile : layout vertical */}
					{isMobile ? (
						<div className='flex flex-col gap-3'>
							{/* Ligne 1 : Logo et titre */}
							<div className='flex items-center justify-between'>
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.3, delay: 0.1 }}
									className='flex items-center gap-2'
								>
									<motion.div
										whileHover={{ scale: 1.1, rotate: 5 }}
										transition={{ type: "spring", stiffness: 400, damping: 17 }}
										className='flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10'
									>
										<LayoutDashboard className='h-4 w-4 text-primary' />
									</motion.div>
									<div>
										<h1 className='text-lg font-bold tracking-tight'>Mon Dashboard</h1>
										<p className='text-[10px] text-muted-foreground'>
											{totalWidgets} widget{totalWidgets > 1 ? "s" : ""}
										</p>
									</div>
								</motion.div>
								{/* Bouton ajouter mobile */}
								<Button
									onClick={openPicker}
									size='sm'
									className='gap-1.5'
									aria-label='Ajouter un widget'
								>
									<Plus className='h-4 w-4' />
									<span>Ajouter</span>
								</Button>
							</div>
							{/* Ligne 2 : Actions secondaires */}
							<div className='flex items-center justify-between gap-2'>
								{/* Barre de recherche mobile */}
								<div className='relative flex-1'>
									<div className='relative flex items-center bg-background border border-border rounded-md h-9 px-2 gap-2'>
										<Search className='h-4 w-4 text-muted-foreground shrink-0' />
										<Input
											placeholder='Rechercher...'
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className='border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm'
										/>
										{searchQuery && (
											<Button
												variant='ghost'
												size='icon'
												className='h-5 w-5 shrink-0'
												onClick={() => setSearchQuery("")}
											>
												×
											</Button>
										)}
									</div>
								</div>
								{/* Boutons compacts */}
								<Button
									variant='outline'
									size='icon'
									onClick={() => setIsLibraryManagerOpen(true)}
									title="Bibliothèque"
								>
									<Sparkles className='h-4 w-4' />
								</Button>
								<GoogleOAuthButton
									variant='outline'
									size='icon'
									onCalendarConnect={async () => {
										const { calendarSyncManager } = await import("@/lib/sync/calendarSyncManager");
										calendarSyncManager.updateConfig({
											providers: { googleCalendar: { enabled: true, calendarId: "primary" } },
										});
									}}
									onTasksConnect={async () => {}}
									onCalendarDisconnect={async () => {
										const { calendarSyncManager } = await import("@/lib/sync/calendarSyncManager");
										calendarSyncManager.updateConfig({
											providers: { googleCalendar: { enabled: false } },
										});
									}}
									onTasksDisconnect={() => {}}
								/>
								<button
									onClick={toggleTheme}
									className='relative flex items-center justify-center h-9 w-9 rounded-full bg-muted/40 hover:bg-muted/60 transition-colors border border-border/50'
									aria-label='Basculer le thème'
								>
									{theme === "light" ? (
										<Sun className='h-4 w-4 text-foreground' />
									) : (
										<Moon className='h-4 w-4 text-foreground' />
									)}
								</button>
							</div>
						</div>
					) : (
						<div className='flex items-center justify-between'>
							{/* Logo et titre */}
							<motion.div
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.3, delay: 0.1 }}
								className='flex items-center gap-3'
							>
								<motion.div
									whileHover={{ scale: 1.1, rotate: 5 }}
									transition={{ type: "spring", stiffness: 400, damping: 17 }}
									className='flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10'
								>
									<LayoutDashboard className='h-5 w-5 text-primary' />
								</motion.div>
								<div>
									<h1
										className='text-2xl font-bold tracking-tight'
										id='dashboard-title'
									>
										Mon Dashboard
									</h1>
									<div className='flex items-center gap-1 flex-wrap mt-1'>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<p
														className='text-[10px] sm:text-xs text-muted-foreground cursor-help'
														aria-live='polite'
													>
														{totalWidgets} widget{totalWidgets > 1 ? "s" : ""} •{" "}
														{widgetTypesCount} type{widgetTypesCount > 1 ? "s" : ""}
													</p>
												</TooltipTrigger>
												<TooltipContent 
													side="bottom" 
													className="max-w-xs bg-popover border border-border text-popover-foreground [&>svg]:bg-popover [&>svg]:fill-popover"
												>
													<div className="flex flex-wrap gap-1">
														{Object.entries(widgetStats).map(([type, count]) => {
															const def = getWidgetDefinition(type);
															if (!def) return null;
															return (
																<Badge key={type} variant='secondary' className='text-[10px] px-1.5 py-0.5 h-5 leading-tight'>
																	{count}x {def.name}
																</Badge>
															);
														})}
													</div>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
										{(() => {
											const entries = Object.entries(widgetStats);
											const maxVisible = 5;
											const visible = entries.slice(0, maxVisible);
											const remaining = entries.length - maxVisible;
											
											return (
												<>
													{visible.map(([type, count]) => {
														const def = getWidgetDefinition(type);
														if (!def) return null;
														return (
															<Badge key={type} variant='secondary' className='text-[10px] px-1.5 py-0.5 h-5 leading-tight'>
																{count}x {def.name}
															</Badge>
														);
													})}
													{remaining > 0 && (
														<TooltipProvider>
															<Tooltip>
																<TooltipTrigger asChild>
																	<Badge variant='secondary' className='text-[10px] px-1.5 py-0.5 h-5 leading-tight cursor-help'>
																		+{remaining}
																	</Badge>
																</TooltipTrigger>
																<TooltipContent 
																	side="bottom" 
																	className="max-w-xs bg-popover border border-border text-popover-foreground [&>svg]:bg-popover [&>svg]:fill-popover"
																>
																	<div className="flex flex-wrap gap-1">
																		{entries.slice(maxVisible).map(([type, count]) => {
																			const def = getWidgetDefinition(type);
																			if (!def) return null;
																			return (
																				<Badge key={type} variant='secondary' className='text-[10px] px-1.5 py-0.5 h-5 leading-tight'>
																					{count}x {def.name}
																				</Badge>
																			);
																		})}
																	</div>
																</TooltipContent>
															</Tooltip>
														</TooltipProvider>
													)}
												</>
											);
										})()}
									</div>
								</div>
							</motion.div>

							{/* Actions rapides */}
							<motion.div
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.3, delay: 0.1 }}
								className='flex items-center gap-2'
							>
							{/* Barre de recherche */}
							<div className='relative hidden sm:flex'>
								<div className='relative flex items-center bg-background border border-border rounded-md h-10 px-3 gap-2 min-w-[200px]'>
									<Search className='h-4 w-4 text-muted-foreground shrink-0' />
									<Input
										placeholder='Rechercher un widget...'
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className='border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent'
									/>
									{searchQuery ? (
										<Button
											variant='ghost'
											size='icon'
											className='h-6 w-6 shrink-0'
											onClick={() => setSearchQuery("")}
											onMouseDown={(e: React.MouseEvent) => {
												e.stopPropagation();
											}}
											onDragStart={(e: React.DragEvent) => {
												e.preventDefault();
												e.stopPropagation();
											}}
										>
											×
										</Button>
									) : (
										<KbdGroup>
											<Kbd>
												<Command className='h-3 w-3' />
											</Kbd>
											<span className='text-muted-foreground'>+</span>
											<Kbd>F</Kbd>
										</KbdGroup>
									)}
								</div>
							</div>

							{/* Bouton Bibliothèque */}
							<Button
								variant='outline'
								size='sm'
								onClick={() => setIsLibraryManagerOpen(true)}
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
								title="Gérer la bibliothèque de widgets"
							>
								<Sparkles className='h-4 w-4' />
								<span className='ml-2 hidden sm:inline'>Bibliothèque</span>
							</Button>

							{/* Bouton Google OAuth */}
							<GoogleOAuthButton
								variant='outline'
								size='sm'
								onCalendarConnect={async () => {
									// Activer le provider Calendar après connexion
									const { calendarSyncManager } = await import(
										"@/lib/sync/calendarSyncManager"
									);
									const config = {
										providers: {
											googleCalendar: {
												enabled: true,
												calendarId: "primary",
											},
										},
									};
									calendarSyncManager.updateConfig(config);
								}}
								onTasksConnect={async () => {
									// Le provider Tasks sera initialisé dans TodoWidget lors de la première utilisation
									// On peut aussi l'initialiser globalement ici si nécessaire
								}}
								onCalendarDisconnect={async () => {
									const { calendarSyncManager } = await import(
										"@/lib/sync/calendarSyncManager"
									);
									const config = {
										providers: {
											googleCalendar: {
												enabled: false,
											},
										},
									};
									calendarSyncManager.updateConfig(config);
								}}
								onTasksDisconnect={() => {
									// Le provider Tasks sera supprimé dans TodoWidget
								}}
							/>

							{/* Switch thème ultra-moderne */}
							<button
								onClick={toggleTheme}
								className='relative hidden sm:flex items-center justify-center h-7 w-12 rounded-full bg-muted/40 hover:bg-muted/60 transition-colors duration-200 overflow-hidden group border border-border/50'
								aria-label='Basculer entre thème clair et sombre'
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								{/* Background animé selon le thème */}
								<motion.div
									initial={false}
									animate={{
										background:
											theme === "dark"
												? "linear-gradient(to right, transparent 0%, hsl(var(--primary) / 0.1) 100%)"
												: "linear-gradient(to right, hsl(var(--primary) / 0.1) 0%, transparent 100%)",
									}}
									transition={{ duration: 0.3 }}
									className='absolute inset-0'
								/>

								{/* Icône Sun - côté gauche */}
								<motion.div
									initial={false}
									animate={{
										opacity: theme === "light" ? 1 : 0.3,
										x: theme === "light" ? 0 : -4,
									}}
									transition={{ duration: 0.25, ease: "easeOut" }}
									className='absolute left-1.5 z-10'
								>
									<Sun className='h-3 w-3 text-foreground' />
								</motion.div>

								{/* Icône Moon - côté droit */}
								<motion.div
									initial={false}
									animate={{
										opacity: theme === "dark" ? 1 : 0.3,
										x: theme === "dark" ? 0 : 4,
									}}
									transition={{ duration: 0.25, ease: "easeOut" }}
									className='absolute right-1.5 z-10'
								>
									<Moon className='h-3 w-3 text-foreground' />
								</motion.div>

								{/* Indicateur ultra-compact */}
								<motion.div
									initial={false}
									animate={{
										x: theme === "dark" ? 22 : 2,
									}}
									transition={{
										type: "spring",
										stiffness: 700,
										damping: 40,
									}}
									className='absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-background border border-border shadow-sm z-20'
								/>
							</button>

							{/* Bouton ajouter avec animation */}
							<Button
								onClick={openPicker}
								onMouseEnter={() => setIsHoveringAdd(true)}
								onMouseLeave={() => setIsHoveringAdd(false)}
								className='gap-2 shadow-md hover:shadow-lg transition-all duration-200 pr-2'
								size='lg'
								aria-label='Ajouter un widget au dashboard'
							>
								<motion.div
									animate={{
										rotate: isHoveringAdd ? 90 : 0,
										scale: isHoveringAdd ? 1.1 : 1,
									}}
									transition={{ duration: 0.2 }}
								>
									<Plus className='h-4 w-4' />
								</motion.div>
								<span className='hidden sm:inline'>Ajouter un widget</span>
								<span className='sm:hidden'>Ajouter</span>
								{/* Raccourci intégré */}
								<kbd className='pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-primary-foreground/30 bg-primary-foreground/10 px-1.5 font-mono text-[10px] font-medium text-primary-foreground ml-1 shrink-0'>
									<Command className='h-3 w-3' />K
								</kbd>
							</Button>
						</motion.div>
					</div>
					)}
				</div>
			</motion.header>

			{/* Contenu principal */}
			<div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6'>
				{/* Grille de widgets */}
				<motion.div
					key={widgets.length === 0 ? "empty" : "grid"}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
				>
					{widgets.length === 0 ? (
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.3 }}
							className='flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center'
						>
							{/* Icône animée */}
							<motion.div
								initial={{ scale: 0, rotate: -180 }}
								animate={{ scale: 1, rotate: 0 }}
								transition={{
									delay: 0.2,
									type: "spring",
									stiffness: 200,
									damping: 15,
								}}
								className='relative'
							>
								<motion.div
									animate={{
										scale: [1, 1.1, 1],
										opacity: [0.3, 0.5, 0.3],
									}}
									transition={{
										duration: 2,
										repeat: Infinity,
										ease: "easeInOut",
									}}
									className='absolute inset-0 bg-primary/20 rounded-full blur-2xl'
								/>
								<div className='relative flex items-center justify-center h-24 w-24 rounded-full bg-primary/10 border-2 border-primary/20 shadow-lg'>
									<motion.div
										animate={{ rotate: [0, 360] }}
										transition={{
											duration: 20,
											repeat: Infinity,
											ease: "linear",
										}}
									>
										<Sparkles className='h-12 w-12 text-primary' />
									</motion.div>
								</div>
							</motion.div>

							{/* Texte */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
								className='space-y-2 max-w-md'
							>
								<h2 className='text-2xl font-semibold' id='empty-state-title'>
									Commencez votre dashboard
								</h2>
								<p
									className='text-muted-foreground'
									aria-describedby='empty-state-title'
								>
									Ajoutez des widgets pour personnaliser votre tableau de bord
									et rester organisé.
								</p>
							</motion.div>

							{/* Bouton CTA */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.4 }}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<Button
									onClick={openPicker}
									variant='default'
									size='lg'
									className='gap-2 shadow-lg hover:shadow-xl transition-all duration-200'
									aria-label='Ajouter votre premier widget'
								>
									<Plus className='h-4 w-4' />
									Ajouter votre premier widget
								</Button>
							</motion.div>

							{/* Suggestions de widgets */}
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.5 }}
								className='mt-8 text-xs text-muted-foreground'
							>
								<p>Suggestions : Météo • Tâches • Calendrier</p>
							</motion.div>
						</motion.div>
					) : (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							{searchQuery && (
								<div className='mb-4 flex items-center gap-2 text-sm text-muted-foreground'>
									<Search className='h-4 w-4' />
									<span>
										{
											widgets.filter((widget) => {
												const def = getWidgetDefinition(widget.type);
												if (!def) return false;
												const query = searchQuery.toLowerCase();
												return (
													def.name.toLowerCase().includes(query) ||
													def.description?.toLowerCase().includes(query) ||
													widget.type.toLowerCase().includes(query)
												);
											}).length
										}{" "}
										widget
										{widgets.filter((widget) => {
											const def = getWidgetDefinition(widget.type);
											if (!def) return false;
											const query = searchQuery.toLowerCase();
											return (
												def.name.toLowerCase().includes(query) ||
												def.description?.toLowerCase().includes(query) ||
												widget.type.toLowerCase().includes(query)
											);
										}).length > 1
											? "s"
											: ""}{" "}
										trouvé
										{widgets.filter((widget) => {
											const def = getWidgetDefinition(widget.type);
											if (!def) return false;
											const query = searchQuery.toLowerCase();
											return (
												def.name.toLowerCase().includes(query) ||
												def.description?.toLowerCase().includes(query) ||
												widget.type.toLowerCase().includes(query)
											);
										}).length > 1
											? "s"
											: ""}
									</span>
									<Button
										variant='ghost'
										size='sm'
										onClick={() => setSearchQuery("")}
										className='h-6 px-2 text-xs'
									>
										Effacer
									</Button>
								</div>
							)}
							<WidgetGrid searchQuery={searchQuery} />
						</motion.div>
					)}
				</motion.div>
			</div>

			{/* Dialog Widget Picker */}
			<WidgetPicker />
			<WidgetLibraryManager open={isLibraryManagerOpen} onOpenChange={setIsLibraryManagerOpen} />
		</div>
	);
}

// Optimiser avec React.memo pour éviter les re-renders inutiles
export const Dashboard = memo(DashboardComponent);

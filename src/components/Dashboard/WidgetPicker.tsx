import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { Search, Plus, CheckSquare, Square, Info, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { widgetRegistry } from "@/lib/widgetRegistry";
import { useDashboardStore } from "@/store/dashboardStore";
import { useState, memo } from "react";

function WidgetPickerComponent() {
	const isOpen = useDashboardStore((state) => state.isPickerOpen);
	const closePicker = useDashboardStore((state) => state.closePicker);
	const addWidget = useDashboardStore((state) => state.addWidget);
	const removeWidget = useDashboardStore((state) => state.removeWidget);
	const widgets = useDashboardStore((state) => state.widgets);

	const [selectedWidgets, setSelectedWidgets] = useState<Set<string>>(new Set());
	const [multiSelectMode, setMultiSelectMode] = useState(false);
	const [infoWidget, setInfoWidget] = useState<string | null>(null);

	const addedWidgetTypes = new Set(widgets.map((w) => w.type));
	
	// Fonction pour obtenir les IDs des widgets d'un type donné
	const getWidgetIdsByType = (type: string) => {
		return widgets.filter((w) => w.type === type).map((w) => w.id);
	};
	
	// Fonction pour supprimer tous les widgets d'un type
	const handleRemoveWidget = (widgetType: string) => {
		const widgetIds = getWidgetIdsByType(widgetType);
		widgetIds.forEach((id) => {
			removeWidget(id);
		});
	};

	const handleSelect = (widgetId: string) => {
		const isAdded = addedWidgetTypes.has(widgetId);
		if (!isAdded) {
			if (multiSelectMode) {
				// Mode sélection multiple : toggle la sélection
				setSelectedWidgets((prev) => {
					const next = new Set(prev);
					if (next.has(widgetId)) {
						next.delete(widgetId);
					} else {
						next.add(widgetId);
					}
					return next;
				});
			} else {
				// Mode normal : ajouter un seul widget et fermer
				addWidget(widgetId);
				closePicker();
			}
		}
	};

	const handleToggleMultiSelect = () => {
		setMultiSelectMode(!multiSelectMode);
		setSelectedWidgets(new Set());
	};

	const handleAddSelected = () => {
		selectedWidgets.forEach((widgetId) => {
			if (!addedWidgetTypes.has(widgetId)) {
				addWidget(widgetId);
			}
		});
		setSelectedWidgets(new Set());
		setMultiSelectMode(false);
		closePicker();
	};

	const handleDialogClose = (open: boolean) => {
		if (!open) {
			setSelectedWidgets(new Set());
			setMultiSelectMode(false);
			closePicker();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleDialogClose}>
			<DialogContent className='sm:max-w-[650px]'>
				<DialogHeader>
					<div className='flex items-center justify-between'>
						<div>
							<DialogTitle className='text-xl'>
								{multiSelectMode
									? `Ajouter plusieurs widgets ${selectedWidgets.size > 0 ? `(${selectedWidgets.size})` : ""}`
									: "Ajouter un widget"}
							</DialogTitle>
							<DialogDescription className='mt-1.5'>
								{multiSelectMode
									? "Sélectionnez plusieurs widgets à ajouter en une fois"
									: "Choisissez un widget à ajouter à votre dashboard. Les widgets déjà ajoutés sont marqués."}
							</DialogDescription>
						</div>
						<Button
							variant={multiSelectMode ? "default" : "outline"}
							size='sm'
							onClick={handleToggleMultiSelect}
							className='gap-2 shadow-sm hover:shadow-md transition-shadow'
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							{multiSelectMode ? (
								<>
									<CheckSquare className='h-4 w-4' />
									Mode multi
								</>
							) : (
								<>
									<Square className='h-4 w-4' />
									Mode multi
								</>
							)}
						</Button>
					</div>
				</DialogHeader>
				<Command className='rounded-lg border shadow-md bg-card'>
					<div className='flex h-10 items-center gap-2 border-b px-3 bg-muted/30'>
						<Search className='size-4 shrink-0 opacity-50' aria-hidden="true" />
						<CommandPrimitive.Input
							placeholder='Rechercher un widget...'
							className='flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50'
							aria-label="Rechercher un widget"
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						/>
					</div>
					<CommandList className='max-h-[400px]'>
						<CommandEmpty className='py-8 text-center text-muted-foreground'>
							Aucun widget trouvé.
						</CommandEmpty>
						<CommandGroup heading='Widgets disponibles'>
							{widgetRegistry.map((widget) => {
								const Icon = widget.icon;
								const isAdded = addedWidgetTypes.has(widget.id);
								const isSelected = selectedWidgets.has(widget.id);

								return (
									<CommandItem
										key={widget.id}
										value={`${widget.id} ${widget.name} ${widget.description}`}
										onSelect={() => {
											if (!isAdded) {
												handleSelect(widget.id);
											}
										}}
										className={`flex items-center gap-3 p-3 transition-colors ${
											isAdded ? 'cursor-default opacity-60' : 'cursor-pointer hover:bg-accent/50'
										}`}
										aria-label={`${widget.name}: ${widget.description}${isAdded ? " (déjà ajouté)" : ""}`}
										onMouseDown={(e: React.MouseEvent) => {
											// Si c'est un clic sur un bouton, ne rien faire (laisser le bouton gérer)
											if ((e.target as HTMLElement).closest('button')) {
												return;
											}
											// Si le widget est ajouté et que ce n'est pas un bouton, empêcher l'action
											if (isAdded) {
												e.preventDefault();
												e.stopPropagation();
											} else {
												e.stopPropagation();
											}
										}}
										onDragStart={(e: React.DragEvent) => {
											e.preventDefault();
											e.stopPropagation();
										}}
									>
										{multiSelectMode && !isAdded && (
											<Checkbox
												checked={isSelected}
												onCheckedChange={() => handleSelect(widget.id)}
												onClick={(e) => e.stopPropagation()}
												onMouseDown={(e: React.MouseEvent) => {
													e.stopPropagation();
												}}
												onDragStart={(e: React.DragEvent) => {
													e.preventDefault();
													e.stopPropagation();
												}}
												className='mr-1'
											/>
										)}
										<div className={`flex items-center justify-center h-10 w-10 rounded-lg ${
											isAdded ? 'bg-muted/50' : 'bg-primary/10'
										}`}>
											<Icon className={`h-5 w-5 ${
												isAdded ? 'text-muted-foreground' : 'text-primary'
											}`} />
										</div>
										<div className='flex-1 min-w-0'>
											<div className='flex items-center gap-2 flex-wrap'>
												<span className={`font-medium ${
													isAdded ? 'text-muted-foreground' : ''
												}`}>
													{widget.name}
												</span>
												{isAdded && (
													<Badge variant='secondary' className='text-xs opacity-60'>
														Ajouté
													</Badge>
												)}
												{multiSelectMode && isSelected && !isAdded && (
													<Badge variant='default' className='text-xs'>
														Sélectionné
													</Badge>
												)}
											</div>
											<p className='text-sm text-muted-foreground line-clamp-1'>
												{widget.description}
											</p>
										</div>
										<div className='flex items-center gap-1 shrink-0'>
											<Button
												variant='ghost'
												size='icon'
												className='h-8 w-8'
												onClick={(e) => {
													e.stopPropagation();
													setInfoWidget(widget.id);
												}}
												onMouseDown={(e: React.MouseEvent) => {
													e.stopPropagation();
												}}
												onDragStart={(e: React.DragEvent) => {
													e.preventDefault();
													e.stopPropagation();
												}}
												title="Plus d'informations"
											>
												<Info className='h-4 w-4' />
											</Button>
											{isAdded && !multiSelectMode && (
												<Button
													variant='outline'
													size='icon'
													className='h-8 w-8 text-muted-foreground hover:text-destructive hover:border-destructive/50'
													onClick={(e) => {
														e.stopPropagation();
														handleRemoveWidget(widget.id);
													}}
													onMouseDown={(e: React.MouseEvent) => {
														e.stopPropagation();
													}}
													onDragStart={(e: React.DragEvent) => {
														e.preventDefault();
														e.stopPropagation();
													}}
													title="Retirer"
												>
													<Minus className='h-4 w-4' />
												</Button>
											)}
											{!isAdded && !multiSelectMode && (
												<Button
													size='sm'
													onClick={(e) => {
														e.stopPropagation();
														handleSelect(widget.id);
													}}
													onMouseDown={(e: React.MouseEvent) => {
														e.stopPropagation();
													}}
													onDragStart={(e: React.DragEvent) => {
														e.preventDefault();
														e.stopPropagation();
													}}
												>
													<Plus className='h-4 w-4 mr-1' />
													Ajouter
												</Button>
											)}
										</div>
									</CommandItem>
								);
							})}
						</CommandGroup>
					</CommandList>
				</Command>
				{/* Dialog Info Widget */}
				{infoWidget && (() => {
					const widget = widgetRegistry.find((w) => w.id === infoWidget);
					if (!widget) return null;
					return (
						<Dialog open={!!infoWidget} onOpenChange={(open) => !open && setInfoWidget(null)}>
							<DialogContent className="sm:max-w-[500px]">
								<DialogHeader>
									<div className="flex items-center gap-3">
										<div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10">
											<widget.icon className="h-6 w-6 text-primary" />
										</div>
										<div>
											<DialogTitle>{widget.name}</DialogTitle>
											<DialogDescription>{widget.description}</DialogDescription>
										</div>
									</div>
								</DialogHeader>
								<div className="space-y-4 py-4">
									{widget.detailedDescription && (
										<div>
											<h4 className="text-sm font-semibold mb-2">Description</h4>
											<p className="text-sm text-muted-foreground">{widget.detailedDescription}</p>
										</div>
									)}
									{widget.usageGuide && (
										<div>
											<h4 className="text-sm font-semibold mb-2">Comment l'utiliser</h4>
											<p className="text-sm text-muted-foreground whitespace-pre-line">{widget.usageGuide}</p>
										</div>
									)}
									{widget.features && widget.features.length > 0 && (
										<div>
											<h4 className="text-sm font-semibold mb-2">Fonctionnalités</h4>
											<ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
												{widget.features.map((feature, idx) => (
													<li key={idx}>{feature}</li>
												))}
											</ul>
										</div>
									)}
									<div className="grid grid-cols-2 gap-4 pt-2 border-t">
										<div>
											<div className="text-xs text-muted-foreground">Taille par défaut</div>
											<div className="text-sm font-medium">{widget.defaultSize.w} × {widget.defaultSize.h}</div>
										</div>
										<div>
											<div className="text-xs text-muted-foreground">Taille minimale</div>
											<div className="text-sm font-medium">{widget.minSize.w} × {widget.minSize.h}</div>
										</div>
									</div>
								</div>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() => setInfoWidget(null)}
										onMouseDown={(e: React.MouseEvent) => {
											e.stopPropagation();
										}}
										onDragStart={(e: React.DragEvent) => {
											e.preventDefault();
											e.stopPropagation();
										}}
									>
										Fermer
									</Button>
									{addedWidgetTypes.has(widget.id) ? (
										<Button
											variant="outline"
											size="icon"
											className="h-9 w-9 text-muted-foreground hover:text-destructive hover:border-destructive/50"
											onClick={() => {
												handleRemoveWidget(widget.id);
												setInfoWidget(null);
											}}
											onMouseDown={(e: React.MouseEvent) => {
												e.stopPropagation();
											}}
											onDragStart={(e: React.DragEvent) => {
												e.preventDefault();
												e.stopPropagation();
											}}
											title="Retirer"
										>
											<Minus className="h-4 w-4" />
										</Button>
									) : (
										<Button
											onClick={() => {
												handleSelect(widget.id);
												setInfoWidget(null);
											}}
											onMouseDown={(e: React.MouseEvent) => {
												e.stopPropagation();
											}}
											onDragStart={(e: React.DragEvent) => {
												e.preventDefault();
												e.stopPropagation();
											}}
										>
											<Plus className="h-4 w-4 mr-2" />
											Ajouter
										</Button>
									)}
								</DialogFooter>
							</DialogContent>
						</Dialog>
					);
				})()}

				{multiSelectMode && selectedWidgets.size > 0 && (
					<DialogFooter className='border-t pt-4'>
						<Button
							variant='outline'
							onClick={handleToggleMultiSelect}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							Annuler
						</Button>
						<Button
							onClick={handleAddSelected}
							className='gap-2 shadow-md hover:shadow-lg transition-shadow'
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<Plus className='h-4 w-4' />
							Ajouter {selectedWidgets.size} widget
							{selectedWidgets.size > 1 ? "s" : ""}
						</Button>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
}

// Optimiser avec React.memo pour éviter les re-renders inutiles
export const WidgetPicker = memo(WidgetPickerComponent);

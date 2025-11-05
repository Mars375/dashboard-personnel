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
import { Search, Plus, CheckSquare, Square } from "lucide-react";
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
	const widgets = useDashboardStore((state) => state.widgets);

	const [selectedWidgets, setSelectedWidgets] = useState<Set<string>>(new Set());
	const [multiSelectMode, setMultiSelectMode] = useState(false);

	const addedWidgetTypes = new Set(widgets.map((w) => w.type));

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
										onSelect={() => handleSelect(widget.id)}
										disabled={isAdded}
										className='flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors'
										aria-label={`${widget.name}: ${widget.description}${isAdded ? " (déjà ajouté)" : ""}`}
										aria-disabled={isAdded}
										onMouseDown={(e: React.MouseEvent) => {
											if (!isAdded) {
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
													<Badge variant='secondary' className='text-xs'>
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
												className='shrink-0'
											>
												<Plus className='h-4 w-4 mr-1' />
												Ajouter
											</Button>
										)}
									</CommandItem>
								);
							})}
						</CommandGroup>
					</CommandList>
				</Command>
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

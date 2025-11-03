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
import { useState } from "react";

export function WidgetPicker() {
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
			<DialogContent className='sm:max-w-[600px]'>
				<DialogHeader>
					<div className='flex items-center justify-between'>
						<div>
							<DialogTitle>
								{multiSelectMode
									? `Ajouter plusieurs widgets ${selectedWidgets.size > 0 ? `(${selectedWidgets.size})` : ""}`
									: "Ajouter un widget"}
							</DialogTitle>
							<DialogDescription>
								{multiSelectMode
									? "Sélectionnez plusieurs widgets à ajouter en une fois"
									: "Choisissez un widget à ajouter à votre dashboard. Les widgets déjà ajoutés sont marqués."}
							</DialogDescription>
						</div>
						<Button
							variant={multiSelectMode ? "default" : "outline"}
							size='sm'
							onClick={handleToggleMultiSelect}
							className='gap-2'
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
				<Command className='rounded-lg border shadow-md'>
					<div className='flex h-9 items-center gap-2 border-b px-3'>
						<Search className='size-4 shrink-0 opacity-50' />
						<CommandPrimitive.Input
							placeholder='Rechercher un widget...'
							className='flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50'
						/>
					</div>
					<CommandList>
						<CommandEmpty>Aucun widget trouvé.</CommandEmpty>
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
										className='flex items-center gap-3 p-3 cursor-pointer'
									>
										{multiSelectMode && !isAdded && (
											<Checkbox
												checked={isSelected}
												onCheckedChange={() => handleSelect(widget.id)}
												onClick={(e) => e.stopPropagation()}
												className='mr-1'
											/>
										)}
										<Icon className='h-5 w-5 text-muted-foreground' />
										<div className='flex-1'>
											<div className='flex items-center gap-2'>
												<span className='font-medium'>{widget.name}</span>
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
											<p className='text-sm text-muted-foreground'>
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
					<DialogFooter>
						<Button variant='outline' onClick={handleToggleMultiSelect}>
							Annuler
						</Button>
						<Button onClick={handleAddSelected} className='gap-2'>
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

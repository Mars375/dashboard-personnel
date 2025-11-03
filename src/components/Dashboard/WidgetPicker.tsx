import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { widgetRegistry } from "@/lib/widgetRegistry";
import { useDashboardStore } from "@/store/dashboardStore";

export function WidgetPicker() {
	const isOpen = useDashboardStore((state) => state.isPickerOpen);
	const closePicker = useDashboardStore((state) => state.closePicker);
	const addWidget = useDashboardStore((state) => state.addWidget);
	const widgets = useDashboardStore((state) => state.widgets);

	const addedWidgetTypes = new Set(widgets.map((w) => w.type));

	const handleSelect = (widgetId: string) => {
		const isAdded = addedWidgetTypes.has(widgetId);
		if (!isAdded) {
			addWidget(widgetId);
			closePicker();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={closePicker}>
			<DialogContent className='sm:max-w-[600px]'>
				<DialogHeader>
					<DialogTitle>Ajouter un widget</DialogTitle>
					<DialogDescription>
						Choisissez un widget à ajouter à votre dashboard. Les widgets déjà
						ajoutés sont marqués.
					</DialogDescription>
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

								return (
									<CommandItem
										key={widget.id}
										value={`${widget.id} ${widget.name} ${widget.description}`}
										onSelect={() => handleSelect(widget.id)}
										disabled={isAdded}
										className='flex items-center gap-3 p-3 cursor-pointer'
									>
										<Icon className='h-5 w-5 text-muted-foreground' />
										<div className='flex-1'>
											<div className='flex items-center gap-2'>
												<span className='font-medium'>{widget.name}</span>
												{isAdded && (
													<Badge variant='secondary' className='text-xs'>
														Ajouté
													</Badge>
												)}
											</div>
											<p className='text-sm text-muted-foreground'>
												{widget.description}
											</p>
										</div>
										{!isAdded && (
											<Button
												size='sm'
												onClick={(e) => {
													e.stopPropagation();
													handleSelect(widget.id);
												}}
											>
												Ajouter
											</Button>
										)}
									</CommandItem>
								);
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	);
}

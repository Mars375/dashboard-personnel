/**
 * Composant EventItem - Ligne d'événement individuelle
 * Extrait de CalendarWidget pour améliorer la maintenabilité
 */

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import type { CalendarEvent } from "../types";

interface EventItemProps {
	event: CalendarEvent;
	onEdit: () => void;
	onDelete: () => void;
	onDragStart: () => void;
	onDragEnd: () => void;
	isDragging: boolean;
}

function EventItemComponent({
	event,
	onEdit,
	onDelete,
	onDragStart,
	onDragEnd,
	isDragging,
}: EventItemProps) {
	const eventColor = event.color || "";

	// Formater l'heure de l'événement
	const formatEventTime = () => {
		if (!event.time) return null;
		return event.time;
	};

	const formattedTime = formatEventTime();
	const sourceCalendar = event.sourceCalendar;

	// Déterminer la couleur de la barre via after pseudo-element
	const afterBgColor = eventColor ? `${eventColor}70` : undefined;

	const handleDragStart = (e: React.DragEvent) => {
		try {
			e.stopPropagation();
			e.dataTransfer.effectAllowed = "move";
			onDragStart();
		} catch (error) {
			logger.warn(
				"Erreur lors du drag start (peut être causée par une extension):",
				error
			);
		}
	};

	const handleDragEnd = (e: React.DragEvent) => {
		try {
			e.stopPropagation();
			onDragEnd();
		} catch (error) {
			logger.warn(
				"Erreur lors du drag end (peut être causée par une extension):",
				error
			);
		}
	};

	return (
		<div
			draggable
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			className={cn(
				"bg-muted relative rounded-md p-2 pl-6 text-sm cursor-move group",
				"after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full",
				afterBgColor ? "" : "after:bg-primary/70",
				isDragging && "opacity-50"
			)}
			style={
				afterBgColor
					? ({
							"--after-bg": afterBgColor,
					  } as React.CSSProperties & { "--after-bg": string })
					: undefined
			}
		>
			{/* Barre colorée via after pseudo-element avec couleur custom */}
			{afterBgColor && (
				<style
					dangerouslySetInnerHTML={{
						__html: `.group[style*="--after-bg"]::after { background-color: var(--after-bg) !important; }`,
					}}
				/>
			)}
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1">
					<div className="font-medium">{event.title}</div>
					<div className="flex items-center gap-2 flex-wrap">
						{formattedTime && (
							<div className="text-muted-foreground text-xs">
								{formattedTime}
							</div>
						)}
						{sourceCalendar && (
							<span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-background rounded border">
								{sourceCalendar}
							</span>
						)}
					</div>
				</div>
				<div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6"
						onClick={(e) => {
							e.stopPropagation();
							onEdit();
						}}
						onMouseDown={(e: React.MouseEvent) => {
							e.stopPropagation();
						}}
						onDragStart={(e: React.DragEvent) => {
							e.preventDefault();
							e.stopPropagation();
						}}
						aria-label="Modifier l'événement"
					>
						<Edit2 className="h-3 w-3" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6"
						onClick={(e) => {
							e.stopPropagation();
							onDelete();
						}}
						onMouseDown={(e: React.MouseEvent) => {
							e.stopPropagation();
						}}
						onDragStart={(e: React.DragEvent) => {
							e.preventDefault();
							e.stopPropagation();
						}}
						aria-label="Supprimer l'événement"
					>
						×
					</Button>
				</div>
			</div>
		</div>
	);
}

export const EventItem = memo(EventItemComponent);


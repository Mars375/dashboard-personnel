/**
 * Composant TodoItem - Ligne de tâche individuelle
 * Extrait de TodoWidget pour améliorer la maintenabilité
 */

import { memo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Star, X, Edit2, Calendar } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/ui/calendar-full";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Todo } from "@/store/todoStorage";
import { motion } from "framer-motion";

interface TodoItemProps {
	todo: Todo;
	editingId: string | null;
	editingValue: string;
	editingDeadline: Date | undefined;
	deadlinePickerOpen: boolean;
	onToggle: (todo: Todo) => void;
	onDelete: (id: string) => void;
	onStartEdit: (todo: Todo) => void;
	onEditValueChange: (value: string) => void;
	onEditDeadlineChange: (date: Date | undefined) => void;
	onSaveEdit: (id: string) => void;
	onCancelEdit: () => void;
	onToggleDeadlinePicker: (open: boolean) => void;
	onTogglePriority: (todo: Todo) => void;
	isSyncing: boolean;
	editInputRef: React.RefObject<HTMLInputElement | null> | React.RefObject<HTMLInputElement>;
}

function TodoItemComponent({
	todo,
	editingId,
	editingValue,
	editingDeadline,
	deadlinePickerOpen,
	onToggle,
	onDelete,
	onStartEdit,
	onEditValueChange,
	onEditDeadlineChange,
	onSaveEdit,
	onCancelEdit,
	onToggleDeadlinePicker,
	onTogglePriority,
	isSyncing,
	editInputRef,
}: TodoItemProps) {
	const isEditing = editingId === todo.id;
	const deadlineStatus = getDeadlineStatus(todo.deadline);

	return (
		<motion.div
			initial={{ opacity: 0, y: -5 }}
			animate={{ opacity: 1, y: 0 }}
			layout
			className={cn(
				"rounded border p-2 text-xs group flex items-center gap-2",
				todo.priority
					? "border-yellow-400/50 bg-yellow-50/30 dark:bg-yellow-950/10"
					: "border-border",
				todo.completed && "opacity-60"
			)}
		>
			<Checkbox
				checked={todo.completed}
				onCheckedChange={() => onToggle(todo)}
				className="h-4 w-4 shrink-0"
				aria-label={
					todo.completed
						? "Marquer comme non terminé"
						: "Marquer comme terminé"
				}
			/>
			<div className="flex-1 min-w-0">
				{isEditing ? (
					<div className="flex flex-col gap-1">
						<Input
							ref={editInputRef}
							value={editingValue}
							onChange={(e) => onEditValueChange(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									onSaveEdit(todo.id);
								} else if (e.key === "Escape") {
									onCancelEdit();
								}
							}}
							className="h-7 text-xs"
							autoFocus
						/>
						{/* Deadline picker pour édition */}
						<div className="flex items-center gap-1">
							<Popover open={deadlinePickerOpen} onOpenChange={onToggleDeadlinePicker}>
								<PopoverTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="h-6 px-2 text-xs"
										type="button"
									>
										<Calendar className="h-3 w-3 mr-1" />
										{editingDeadline
											? format(editingDeadline, "PPP", { locale: fr })
											: "Définir deadline"}
									</Button>
								</PopoverTrigger>
								<PopoverContent
									className="w-auto p-0"
									align="start"
								>
									<DatePicker
										selected={editingDeadline}
										onSelect={(date) => {
											onEditDeadlineChange(date);
											if (date) {
												onToggleDeadlinePicker(false);
											}
										}}
										captionLayout="dropdown"
									/>
								</PopoverContent>
							</Popover>
							{editingDeadline && (
								<Button
									variant="ghost"
									size="sm"
									className="h-6 px-2 text-xs"
									onClick={() => onEditDeadlineChange(undefined)}
								>
									×
								</Button>
							)}
						</div>
						<div className="flex gap-1">
							<Button
								variant="default"
								size="sm"
								className="h-6 px-2 text-xs"
								onClick={() => onSaveEdit(todo.id)}
							>
								Enregistrer
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 px-2 text-xs"
								onClick={onCancelEdit}
							>
								Annuler
							</Button>
						</div>
					</div>
				) : (
					<>
						<div
							className={cn(
								"font-medium truncate text-sm",
								todo.completed &&
									"line-through text-muted-foreground"
							)}
							onDoubleClick={() => onStartEdit(todo)}
						>
							{todo.title}
						</div>
						{deadlineStatus && !todo.completed && (
							<span
								className={cn(
									"text-xs",
									deadlineStatus.status === "overdue" &&
										"text-destructive font-medium"
								)}
							>
								{deadlineStatus.status === "overdue"
									? "⚠"
									: deadlineStatus.text}
							</span>
						)}
						{isSyncing && (
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="flex items-center ml-1">
										<Spinner className="size-3 text-blue-500" />
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<p>Synchronisation en cours...</p>
								</TooltipContent>
							</Tooltip>
						)}
					</>
				)}
			</div>
			<div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
				<Button
					variant="ghost"
					size="sm"
					className="h-6 w-6 p-0"
					onClick={() => onTogglePriority(todo)}
				>
					<Star
						className={cn(
							"h-3 w-3",
							todo.priority
								? "fill-yellow-400 text-yellow-400"
								: "text-muted-foreground"
						)}
					/>
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="h-6 w-6 p-0"
					onClick={() => onStartEdit(todo)}
				>
					<Edit2 className="h-3 w-3" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="h-6 w-6 p-0 text-destructive"
					onClick={() => onDelete(todo.id)}
				>
					<X className="h-3 w-3" />
				</Button>
			</div>
		</motion.div>
	);
}

/**
 * Fonction utilitaire pour obtenir le statut de la deadline
 */
function getDeadlineStatus(deadline?: string) {
	if (!deadline) return null;

	const deadlineDate = new Date(deadline);
	const now = Date.now();
	const diff = deadlineDate.getTime() - now;
	const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

	if (days < 0) {
		return {
			status: "overdue" as const,
			text: "En retard",
			variant: "destructive" as const,
		};
	}
	if (days === 0) {
		return {
			status: "today" as const,
			text: "Aujourd'hui",
			variant: "default" as const,
		};
	}
	if (days <= 3) {
		return {
			status: "soon" as const,
			text: `${days}j`,
			variant: "secondary" as const,
		};
	}
	return {
		status: "upcoming" as const,
		text: deadlineDate.toLocaleDateString("fr-FR", {
			day: "numeric",
			month: "short",
		}),
		variant: "outline" as const,
	};
}

export const TodoItem = memo(TodoItemComponent);


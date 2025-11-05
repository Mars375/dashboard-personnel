/**
 * Composant TodoAddForm - Formulaire d'ajout de tâche
 * Extrait de TodoWidget pour améliorer la maintenabilité
 */

import { memo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/calendar-full";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TodoAddFormProps {
	onSubmit: (title: string, deadline?: string) => void;
	size?: "compact" | "medium" | "full";
}

function TodoAddFormComponent({
	onSubmit,
	size = "full",
}: TodoAddFormProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [newTodoDeadline, setNewTodoDeadline] = useState<Date | undefined>();
	const [showNewDeadline, setShowNewDeadline] = useState(false);

	const isCompact = size === "compact";
	const isMedium = size === "medium";
	const isFull = size === "full";

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const input = inputRef.current;
		if (input?.value.trim()) {
			// Convertir Date en string YYYY-MM-DD pour la deadline
			const deadlineStr = newTodoDeadline
				? `${newTodoDeadline.getFullYear()}-${String(
						newTodoDeadline.getMonth() + 1
				  ).padStart(2, "0")}-${String(newTodoDeadline.getDate()).padStart(
						2,
						"0"
				  )}`
				: undefined;

			onSubmit(input.value.trim(), deadlineStr);
			input.value = "";
			setNewTodoDeadline(undefined);
			setShowNewDeadline(false);
		}
	};

	// Version compacte : formulaire minimal
	if (isCompact) {
		return (
			<form onSubmit={handleSubmit} className="flex gap-1">
				<Input
					ref={inputRef}
					placeholder="Nouvelle tâche..."
					className="flex-1 h-7 text-sm"
					aria-label="Nouvelle tâche"
				/>
				<Button type="submit" size="sm" className="h-7 px-2">
					+
				</Button>
			</form>
		);
	}

	// Version medium : formulaire avec bouton
	if (isMedium) {
		return (
			<form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
				<div className="flex gap-1.5">
					<Input
						ref={inputRef}
						placeholder="Ajouter une tâche..."
						className="flex-1 h-9 text-sm"
						aria-label="Nouvelle tâche"
					/>
					<Button type="submit" size="sm" className="h-9">
						Ajouter
					</Button>
				</div>
			</form>
		);
	}

	// Version full : formulaire complet avec deadline
	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-2">
			<div className="flex gap-2">
				<Input
					ref={inputRef}
					placeholder="Ajouter une tâche..."
					className="flex-1"
					aria-label="Nouvelle tâche"
				/>
				<Button type="submit">Ajouter</Button>
			</div>
			{showNewDeadline ? (
				<div className="flex gap-2 items-center">
					<DatePicker
						date={newTodoDeadline}
						onDateChange={setNewTodoDeadline}
					>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="flex-1 justify-start text-left font-normal"
						>
							<Calendar className="h-4 w-4 mr-2" />
							{newTodoDeadline
								? format(newTodoDeadline, "PPP", { locale: fr })
								: "Sélectionner une date limite"}
						</Button>
					</DatePicker>
					{newTodoDeadline && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => {
								setNewTodoDeadline(undefined);
								setShowNewDeadline(false);
							}}
						>
							Annuler
						</Button>
					)}
				</div>
			) : (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setShowNewDeadline(true)}
					className="w-fit"
				>
					<Calendar className="h-4 w-4 mr-2" />
					Ajouter une date limite
				</Button>
			)}
		</form>
	);
}

export const TodoAddForm = memo(TodoAddFormComponent);


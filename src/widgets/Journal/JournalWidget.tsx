// src/widgets/Journal/JournalWidget.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/calendar-full";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { Plus, Calendar, X, Edit2, FileText, Clock } from "lucide-react";
import type { WidgetProps } from "@/lib/widgetSize";
import {
	loadJournalEntries,
	addJournalEntry,
	updateJournalEntry,
	deleteJournalEntry,
	getJournalEntryByDate,
	type JournalEntry,
} from "@/store/journalStorage";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function JournalWidgetComponent({ size = "medium" }: WidgetProps) {
	const [entries, setEntries] = useState<JournalEntry[]>(() => loadJournalEntries());
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editTitle, setEditTitle] = useState("");
	const [editContent, setEditContent] = useState("");
	const [editDate, setEditDate] = useState<Date>(new Date());
	const [showRecentEntries, setShowRecentEntries] = useState(false);

	const isCompact = useMemo(() => size === "compact", [size]);
	const isFull = useMemo(() => size === "full" || size === "medium", [size]);

	useEffect(() => {
		setEntries(loadJournalEntries());
	}, []);

	useEffect(() => {
		const dateStr = format(selectedDate, "yyyy-MM-dd");
		const entry = getJournalEntryByDate(dateStr);
		setSelectedEntry(entry);
		if (entry) {
			setEditTitle(entry.title);
			setEditContent(entry.content);
			setEditDate(new Date(entry.date));
		} else {
			setEditTitle("");
			setEditContent("");
			setEditDate(selectedDate);
		}
	}, [selectedDate]);

	// Récupérer les dernières entrées pour différenciation visuelle
	const recentEntries = useMemo(() => {
		return [...entries]
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
			.slice(0, 5);
	}, [entries]);

	const handleSaveEntry = useCallback(() => {
		const dateStr = format(editDate, "yyyy-MM-dd");
		if (selectedEntry) {
			updateJournalEntry(selectedEntry.id, {
				date: dateStr,
				title: editTitle || "Sans titre",
				content: editContent,
			});
		} else {
			addJournalEntry({
				date: dateStr,
				title: editTitle || "Sans titre",
				content: editContent,
			});
		}
		const updatedEntries = loadJournalEntries();
		setEntries(updatedEntries);
		// Mettre à jour la date sélectionnée pour afficher la nouvelle entrée
		setSelectedDate(editDate);
		setIsDialogOpen(false);
	}, [selectedEntry, editDate, editTitle, editContent]);

	const handleDeleteEntry = useCallback(() => {
		if (selectedEntry && confirm("Supprimer cette entrée ?")) {
			deleteJournalEntry(selectedEntry.id);
			setEntries(loadJournalEntries());
			setSelectedEntry(null);
			setEditTitle("");
			setEditContent("");
		}
	}, [selectedEntry]);

	const padding = isCompact ? "p-2" : "p-4";
	const gap = isCompact ? "gap-1" : "gap-2";

	return (
		<Card
			className={cn(
				"w-full h-full max-w-none flex flex-col min-h-0",
				padding,
				gap,
				isCompact ? "overflow-hidden" : "overflow-auto"
			)}
		>
			{/* COMPACT VERSION - Ultra-compact avec liste des dernières entrées */}
			{isCompact && (
				<div className="flex-1 overflow-y-auto min-w-0 flex flex-col">
					{/* Header minimaliste */}
					<div className="flex items-center justify-between mb-1.5 shrink-0 pb-1 border-b">
						<div className="flex items-center gap-1">
							<FileText className="h-3 w-3 text-muted-foreground" />
							<span className="text-[10px] font-semibold">{entries.length}</span>
						</div>
						<Button
							size="sm"
							variant="default"
							onClick={() => setIsDialogOpen(true)}
							className="h-6"
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<Plus className="h-3 w-3" />
						</Button>
					</div>
					
					{/* Liste ultra-compacte des dernières entrées */}
					{entries.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-1 flex-1 text-center py-2">
							<FileText className="h-4 w-4 text-muted-foreground" />
							<div className="text-[10px] text-muted-foreground">Aucune entrée</div>
						</div>
					) : (
						<div className="flex flex-col gap-1 flex-1">
							{recentEntries.slice(0, 8).map((entry) => (
								<button
									key={entry.id}
									className="p-1.5 rounded border bg-card hover:bg-accent transition-colors text-left min-w-0"
									onClick={() => {
										setSelectedDate(new Date(entry.date));
										setIsDialogOpen(true);
									}}
									onMouseDown={(e: React.MouseEvent) => {
										e.stopPropagation();
									}}
									onDragStart={(e: React.DragEvent) => {
										e.preventDefault();
										e.stopPropagation();
									}}
								>
									<div className="flex items-center gap-1.5 min-w-0">
										<Clock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
										<div className="flex-1 min-w-0">
											<div className="text-[10px] font-medium truncate leading-tight">{entry.title}</div>
											<div className="text-[9px] text-muted-foreground mt-0.5">
												{format(new Date(entry.date), "dd MMM", { locale: fr })}
											</div>
										</div>
									</div>
								</button>
							))}
						</div>
					)}
					
					{/* Indicateur si plus d'entrées */}
					{entries.length > 8 && (
						<div className="text-[9px] text-muted-foreground text-center pt-0.5 shrink-0">
							+{entries.length - 8}
						</div>
					)}
				</div>
			)}

			{/* Header avec vue récentes */}
			{isFull && (
				<div className="space-y-2 shrink-0">
					<div className="flex items-center gap-2">
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="flex-1 justify-start text-left font-normal"
									onMouseDown={(e: React.MouseEvent) => {
										e.stopPropagation();
									}}
									onDragStart={(e: React.DragEvent) => {
										e.preventDefault();
										e.stopPropagation();
									}}
								>
									<Calendar className="h-4 w-4 mr-2" />
									{format(selectedDate, "PPP", { locale: fr })}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<DatePicker
									selected={selectedDate}
									onSelect={(date) => {
										if (date) setSelectedDate(date);
									}}
									captionLayout="dropdown"
								/>
							</PopoverContent>
						</Popover>
						<Button
							size="sm"
							variant={showRecentEntries ? "default" : "outline"}
							onClick={() => setShowRecentEntries(!showRecentEntries)}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
							title="Afficher les dernières entrées"
						>
							<FileText className="h-4 w-4" />
						</Button>
						<Button
							size="sm"
							onClick={() => setIsDialogOpen(true)}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<Plus className="h-4 w-4" />
						</Button>
					</div>
					{entries.length > 0 && (
						<div className="text-xs text-muted-foreground">
							{entries.length} entrée{entries.length > 1 ? "s" : ""} au total
						</div>
					)}
				</div>
			)}

			{/* Entry Content - Vue date ou récentes */}
			{isFull && (
				<div className="flex-1 overflow-y-auto">
					{showRecentEntries ? (
						// Vue des dernières entrées
						<div className="space-y-2">
							{recentEntries.length === 0 ? (
								<div className="text-sm text-muted-foreground text-center py-8">
									Aucune entrée
								</div>
							) : (
								recentEntries.map((entry) => (
									<motion.div
										key={entry.id}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										className="p-2 rounded-md border cursor-pointer hover:bg-accent transition-colors"
										onClick={() => {
											setSelectedDate(new Date(entry.date));
											setShowRecentEntries(false);
										}}
									>
										<div className="flex items-start justify-between gap-2">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<Clock className="h-3 w-3 text-muted-foreground shrink-0" />
													<span className="text-xs text-muted-foreground">
														{format(new Date(entry.date), "PPP", { locale: fr })}
													</span>
												</div>
												<div className="font-medium truncate">{entry.title}</div>
												{entry.content && (
													<div className="text-xs text-muted-foreground line-clamp-2 mt-1">
														{entry.content}
													</div>
												)}
											</div>
										</div>
									</motion.div>
								))
							)}
						</div>
					) : selectedEntry ? (
						// Vue entrée sélectionnée
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className="space-y-2"
						>
							<div className="flex items-start justify-between gap-2">
								<div className="flex-1">
									<div className="font-semibold text-lg">{selectedEntry.title}</div>
									<div className="text-muted-foreground whitespace-pre-wrap mt-2">
										{selectedEntry.content || "Aucun contenu"}
									</div>
								</div>
								<div className="flex items-center gap-1 shrink-0">
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6"
										onClick={() => setIsDialogOpen(true)}
										onMouseDown={(e: React.MouseEvent) => {
											e.stopPropagation();
										}}
										onDragStart={(e: React.DragEvent) => {
											e.preventDefault();
											e.stopPropagation();
										}}
										aria-label="Modifier"
									>
										<Edit2 className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6 text-destructive hover:text-destructive"
										onClick={handleDeleteEntry}
										onMouseDown={(e: React.MouseEvent) => {
											e.stopPropagation();
										}}
										onDragStart={(e: React.DragEvent) => {
											e.preventDefault();
											e.stopPropagation();
										}}
										aria-label="Supprimer"
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</motion.div>
					) : (
						<div className="text-sm text-muted-foreground text-center py-8">
							Aucune entrée pour cette date
						</div>
					)}
				</div>
			)}

			{/* Edit Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Écriture du journal</DialogTitle>
						<DialogDescription>
							Écrivez votre entrée de journal pour {format(editDate, "PPP", { locale: fr })}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" className="w-full justify-start text-left font-normal">
									<Calendar className="h-4 w-4 mr-2" />
									{format(editDate, "PPP", { locale: fr })}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<DatePicker
									selected={editDate}
									onSelect={(date) => {
										if (date) setEditDate(date);
									}}
									captionLayout="dropdown"
								/>
							</PopoverContent>
						</Popover>
						<Input
							placeholder="Titre"
							value={editTitle}
							onChange={(e) => setEditTitle(e.target.value)}
						/>
						<Textarea
							placeholder="Contenu..."
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							className="min-h-[200px]"
						/>
					</div>
					<DialogFooter>
						{selectedEntry && (
							<Button
								variant="destructive"
								onClick={handleDeleteEntry}
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								<X className="h-4 w-4 mr-2" />
								Supprimer
							</Button>
						)}
						<Button
							variant="outline"
							onClick={() => setIsDialogOpen(false)}
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
							onClick={handleSaveEntry}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							Enregistrer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}

export const JournalWidget = memo(JournalWidgetComponent);


// src/widgets/Notes/NotesWidget.tsx
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { Search, Plus, Edit2, Trash2, MoreVertical } from "lucide-react";
import type { WidgetProps } from "@/lib/widgetSize";
import {
	loadNotes,
	addNote,
	updateNote,
	deleteNote,
	type Note,
} from "@/store/notesStorage";
import { cn } from "@/lib/utils";

function NotesWidgetComponent({ size = "medium" }: WidgetProps) {
	const [notes, setNotes] = useState<Note[]>(() => loadNotes());
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedNote, setSelectedNote] = useState<Note | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editTitle, setEditTitle] = useState("");
	const [editContent, setEditContent] = useState("");

	const isCompact = useMemo(() => size === "compact", [size]);
	const isFull = useMemo(() => size === "full" || size === "medium", [size]);

	useEffect(() => {
		setNotes(loadNotes());
	}, []);

	const filteredNotes = useMemo(() => {
		if (!searchQuery.trim()) return notes;
		const query = searchQuery.toLowerCase();
		return notes.filter(
			(note) =>
				note.title.toLowerCase().includes(query) ||
				note.content.toLowerCase().includes(query) ||
				note.tags?.some((tag) => tag.toLowerCase().includes(query))
		);
	}, [notes, searchQuery]);

	const handleAddNote = useCallback(() => {
		const newNote = addNote({
			title: "Nouvelle note",
			content: "",
		});
		setNotes(loadNotes());
		setSelectedNote(newNote);
		setEditTitle(newNote.title);
		setEditContent(newNote.content);
		setIsDialogOpen(true);
	}, []);

	const handleEditNote = useCallback((note: Note) => {
		setSelectedNote(note);
		setEditTitle(note.title);
		setEditContent(note.content);
		setIsDialogOpen(true);
	}, []);

	const handleSaveNote = useCallback(() => {
		if (!selectedNote) return;
		
		updateNote(selectedNote.id, {
			title: editTitle || "Sans titre",
			content: editContent,
		});
		setNotes(loadNotes());
		setIsDialogOpen(false);
		setSelectedNote(null);
	}, [selectedNote, editTitle, editContent]);

	const handleDeleteNote = useCallback((id: string) => {
		if (confirm("Supprimer cette note ?")) {
			deleteNote(id);
			setNotes(loadNotes());
			if (selectedNote?.id === id) {
				setIsDialogOpen(false);
				setSelectedNote(null);
			}
		}
	}, [selectedNote]);

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
			{/* Header */}
			{isFull && (
				<div className="flex items-center gap-2 shrink-0">
					<Search className="h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Rechercher..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="flex-1"
					/>
					<Button size="sm" onClick={handleAddNote}>
						<Plus className="h-4 w-4" />
					</Button>
				</div>
			)}

			{/* Notes List */}
			<div className="flex-1 overflow-y-auto">
				{filteredNotes.length === 0 ? (
					<div className="text-sm text-muted-foreground text-center py-8">
						{searchQuery ? "Aucune note trouvée" : "Aucune note"}
					</div>
				) : (
					<div className={cn("flex flex-col", isCompact ? "gap-1" : "gap-2")}>
						{filteredNotes.map((note) => (
							<motion.div
								key={note.id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className={cn(
									"p-2 rounded-md border cursor-pointer hover:bg-accent transition-colors",
									isCompact && "p-1.5 text-xs"
								)}
								onClick={() => isFull && handleEditNote(note)}
							>
								<div className="flex items-start justify-between gap-2">
									<div className="flex-1 min-w-0">
										<div className={cn("font-medium truncate", isCompact && "text-xs")}>
											{note.title || "Sans titre"}
										</div>
										{note.content && (
											<div
												className={cn(
													"text-muted-foreground line-clamp-2 mt-1",
													isCompact && "text-[10px] line-clamp-1"
												)}
											>
												{note.content}
											</div>
										)}
										{note.tags && note.tags.length > 0 && (
											<div className="flex gap-1 mt-1 flex-wrap">
												{note.tags.slice(0, 2).map((tag, idx) => (
													<span
														key={idx}
														className={cn(
															"px-1.5 py-0.5 bg-muted rounded text-[10px]",
															isCompact && "text-[8px] px-1 py-0"
														)}
													>
														{tag}
													</span>
												))}
											</div>
										)}
									</div>
									{isFull && (
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6"
													onClick={(e) => e.stopPropagation()}
												>
													<MoreVertical className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => handleEditNote(note)}>
													<Edit2 className="h-4 w-4 mr-2" />
													Modifier
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onClick={() => handleDeleteNote(note.id)}
													className="text-destructive"
												>
													<Trash2 className="h-4 w-4 mr-2" />
													Supprimer
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									)}
								</div>
							</motion.div>
						))}
					</div>
				)}
			</div>

			{/* Compact Add Button */}
			{isCompact && (
				<Button size="sm" onClick={handleAddNote} className="shrink-0">
					<Plus className="h-4 w-4" />
				</Button>
			)}

			{/* Edit Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Modifier la note</DialogTitle>
						<DialogDescription>
							Modifiez le titre et le contenu de votre note
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
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
						<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
							Annuler
						</Button>
						<Button onClick={handleSaveNote}>Enregistrer</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}

export const NotesWidget = memo(NotesWidgetComponent);


// src/widgets/Bookmarks/BookmarksWidget.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { Search, Plus, ExternalLink, X, Link2 } from "lucide-react";
import type { WidgetProps } from "@/lib/widgetSize";
import {
	loadBookmarks,
	addBookmark,
	updateBookmark,
	deleteBookmark,
	getFaviconUrl,
	type Bookmark,
} from "@/store/bookmarksStorage";
import { cn } from "@/lib/utils";

function BookmarksWidgetComponent({ size = "medium" }: WidgetProps) {
	const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => loadBookmarks());
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editTitle, setEditTitle] = useState("");
	const [editUrl, setEditUrl] = useState("");
	const [editDescription, setEditDescription] = useState("");

	const isCompact = useMemo(() => size === "compact", [size]);
	const isMedium = useMemo(() => size === "medium", [size]);
	const isFull = useMemo(() => size === "full", [size]);

	useEffect(() => {
		setBookmarks(loadBookmarks());
	}, []);

	const filteredBookmarks = useMemo(() => {
		if (!searchQuery.trim()) return bookmarks;
		const query = searchQuery.toLowerCase();
		return bookmarks.filter(
			(b) =>
				b.title.toLowerCase().includes(query) ||
				b.url.toLowerCase().includes(query) ||
				b.description?.toLowerCase().includes(query) ||
				b.tags?.some((tag) => tag.toLowerCase().includes(query))
		);
	}, [bookmarks, searchQuery]);

	const handleAddBookmark = useCallback(() => {
		setSelectedBookmark(null);
		setEditTitle("");
		setEditUrl("");
		setEditDescription("");
		setIsDialogOpen(true);
	}, []);


	const handleSaveBookmark = useCallback(() => {
		if (!editUrl.trim()) return;
		
		const url = editUrl.startsWith("http") ? editUrl : `https://${editUrl}`;
		const favicon = getFaviconUrl(url);
		
		if (selectedBookmark) {
			updateBookmark(selectedBookmark.id, {
				title: editTitle || new URL(url).hostname,
				url,
				description: editDescription,
				favicon,
			});
		} else {
			addBookmark({
				title: editTitle || new URL(url).hostname,
				url,
				description: editDescription,
				favicon,
			});
		}
		setBookmarks(loadBookmarks());
		setIsDialogOpen(false);
		setSelectedBookmark(null);
	}, [selectedBookmark, editTitle, editUrl, editDescription]);

	const handleDeleteBookmark = useCallback((id: string) => {
		if (confirm("Supprimer ce bookmark ?")) {
			deleteBookmark(id);
			setBookmarks(loadBookmarks());
			if (selectedBookmark?.id === id) {
				setIsDialogOpen(false);
				setSelectedBookmark(null);
			}
		}
	}, [selectedBookmark]);

	const handleOpenBookmark = useCallback((url: string) => {
		window.open(url, "_blank", "noopener,noreferrer");
	}, []);

	const padding = isCompact ? "p-2" : isMedium ? "p-3" : "p-4";
	const gap = isCompact ? "gap-1" : isMedium ? "gap-2" : "gap-2";

	return (
		<Card
			className={cn(
				"w-full h-full max-w-none flex flex-col min-h-0",
				padding,
				gap,
				isCompact ? "overflow-hidden" : "overflow-auto"
			)}
		>
			{/* COMPACT VERSION - Ultra minimaliste avec favicons uniquement */}
			{isCompact && (
				<div className="flex flex-col gap-1 flex-1 overflow-y-auto min-w-0">
					{/* Header minimaliste */}
					<div className="flex items-center justify-between shrink-0 pb-0.5">
						<div className="flex items-center gap-1">
							<Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
							<div className="text-[10px] font-semibold">{bookmarks.length}</div>
						</div>
						<Button
							size="sm"
							variant="ghost"
							className="h-5 w-5 p-0 shrink-0"
							onClick={handleAddBookmark}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
							title="Ajouter un bookmark"
						>
							<Plus className="h-3 w-3" />
						</Button>
					</div>
					{bookmarks.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-1 flex-1 text-center">
							<Link2 className="h-4 w-4 text-muted-foreground" />
							<div className="text-[10px] text-muted-foreground">Aucun</div>
						</div>
					) : (
						<div className="grid grid-cols-3 gap-1">
							{bookmarks.slice(0, 9).map((bookmark) => (
								<div
									key={bookmark.id}
									className="relative group"
									onMouseDown={(e: React.MouseEvent) => {
										e.stopPropagation();
									}}
									onDragStart={(e: React.DragEvent) => {
										e.preventDefault();
										e.stopPropagation();
									}}
								>
									{/* Favicon cliquable pour ouvrir */}
									<button
										className="w-full aspect-square rounded border bg-card hover:bg-accent transition-colors flex items-center justify-center p-0.5"
										onClick={() => handleOpenBookmark(bookmark.url)}
										title={bookmark.title || new URL(bookmark.url).hostname}
									>
										{bookmark.favicon ? (
											<img
												src={bookmark.favicon}
												alt=""
												className="w-full h-full rounded object-contain"
												onError={(e) => {
													(e.target as HTMLImageElement).style.display = "none";
												}}
											/>
										) : (
											<Link2 className="h-3 w-3 text-muted-foreground" />
										)}
									</button>
									{/* Bouton supprimer au hover */}
									<Button
										variant="ghost"
										size="icon"
										className="absolute -top-1 -right-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-opacity z-10"
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteBookmark(bookmark.id);
										}}
										onMouseDown={(e: React.MouseEvent) => {
											e.stopPropagation();
										}}
										onDragStart={(e: React.DragEvent) => {
											e.preventDefault();
											e.stopPropagation();
										}}
										title="Supprimer"
									>
										<X className="h-2.5 w-2.5" />
									</Button>
								</div>
							))}
						</div>
					)}
					{bookmarks.length > 9 && (
						<div className="text-[9px] text-muted-foreground text-center pt-0.5 shrink-0">
							+{bookmarks.length - 9}
						</div>
					)}
				</div>
			)}

			{/* MEDIUM/FULL VERSION - Version intermédiaire avec recherche */}
			{(isMedium || isFull) && (
				<>
					{/* Header avec recherche */}
					<div className="flex items-center gap-2 shrink-0">
						<Search className="h-4 w-4 text-muted-foreground shrink-0" />
						<Input
							placeholder="Rechercher..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="flex-1 h-8 text-sm"
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						/>
						<Button
							size="sm"
							variant="default"
							className="h-8 px-2 shrink-0"
							onClick={handleAddBookmark}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<Plus className="h-3.5 w-3.5" />
						</Button>
					</div>

					{/* Liste des bookmarks */}
					<div className="flex-1 overflow-y-auto min-w-0">
						{filteredBookmarks.length === 0 ? (
							<div className="text-xs text-muted-foreground text-center py-6">
								{searchQuery ? "Aucun bookmark trouvé" : "Aucun bookmark"}
							</div>
						) : (
							<div className="flex flex-col gap-1.5">
								{filteredBookmarks.map((bookmark) => (
									<div
										key={bookmark.id}
										className="p-2 rounded-md border bg-card hover:bg-accent transition-colors cursor-pointer min-w-0"
										onClick={() => handleOpenBookmark(bookmark.url)}
										onMouseDown={(e: React.MouseEvent) => {
											e.stopPropagation();
										}}
										onDragStart={(e: React.DragEvent) => {
											e.preventDefault();
											e.stopPropagation();
										}}
									>
										<div className="flex items-center gap-2 min-w-0">
											{bookmark.favicon ? (
												<img
													src={bookmark.favicon}
													alt=""
													className="shrink-0 rounded border w-6 h-6"
													onError={(e) => {
														(e.target as HTMLImageElement).style.display = "none";
													}}
												/>
											) : (
												<div className="shrink-0 rounded border bg-muted flex items-center justify-center w-6 h-6">
													<Link2 className="w-3.5 h-3.5 text-muted-foreground" />
												</div>
											)}
											<div className="flex-1 min-w-0">
												<div className="text-sm font-medium truncate">{bookmark.title || bookmark.url}</div>
												<div className="text-[11px] text-muted-foreground truncate mt-0.5">
													{new URL(bookmark.url).hostname}
												</div>
											</div>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 shrink-0"
												onClick={(e) => {
													e.stopPropagation();
													handleOpenBookmark(bookmark.url);
												}}
												onMouseDown={(e: React.MouseEvent) => {
													e.stopPropagation();
												}}
												onDragStart={(e: React.DragEvent) => {
													e.preventDefault();
													e.stopPropagation();
												}}
												aria-label="Ouvrir"
											>
												<ExternalLink className="h-3.5 w-3.5" />
											</Button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</>
			)}


			{/* Edit Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Modifier le bookmark</DialogTitle>
						<DialogDescription>
							Ajoutez ou modifiez un bookmark avec son URL
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<Input
							placeholder="URL (ex: example.com)"
							value={editUrl}
							onChange={(e) => setEditUrl(e.target.value)}
							className="font-mono"
						/>
						<Input
							placeholder="Titre (optionnel)"
							value={editTitle}
							onChange={(e) => setEditTitle(e.target.value)}
						/>
						<Input
							placeholder="Description (optionnel)"
							value={editDescription}
							onChange={(e) => setEditDescription(e.target.value)}
						/>
					</div>
					<DialogFooter>
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
							onClick={handleSaveBookmark}
							disabled={!editUrl.trim()}
							onMouseDown={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
							onDragStart={(e: React.DragEvent) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<Link2 className="h-4 w-4 mr-2" />
							Enregistrer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}

export const BookmarksWidget = memo(BookmarksWidgetComponent);


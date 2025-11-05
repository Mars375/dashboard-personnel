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
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { Search, Plus, ExternalLink, Trash2, Edit2, Link2 } from "lucide-react";
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
	const isFull = useMemo(() => size === "full" || size === "medium", [size]);

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

	const handleEditBookmark = useCallback((bookmark: Bookmark) => {
		setSelectedBookmark(bookmark);
		setEditTitle(bookmark.title);
		setEditUrl(bookmark.url);
		setEditDescription(bookmark.description || "");
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
					<Button
						size="sm"
						onClick={handleAddBookmark}
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
			)}

			{isCompact && (
				<div className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
					<div className="flex items-center justify-between shrink-0 pb-1 border-b">
						<div className="flex items-center gap-1.5">
							<Link2 className="h-4 w-4 text-muted-foreground" />
							<div className="text-xs font-bold">{bookmarks.length}</div>
							<div className="text-[10px] text-muted-foreground">bookmarks</div>
						</div>
						<Button
							size="sm"
							variant="ghost"
							className="h-6 px-2"
							onClick={handleAddBookmark}
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
					{bookmarks.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 flex-1 text-center">
							<Link2 className="h-6 w-6 text-muted-foreground" />
							<div className="text-xs text-muted-foreground">Aucun bookmark</div>
						</div>
					) : (
						bookmarks.slice(0, 6).map((bookmark) => (
							<div
								key={bookmark.id}
								className="p-2 rounded border bg-card hover:bg-accent transition-colors cursor-pointer"
								onClick={() => handleOpenBookmark(bookmark.url)}
							>
								<div className="flex items-center gap-2">
									{bookmark.favicon ? (
										<img
											src={bookmark.favicon}
											alt=""
											className="h-4 w-4 shrink-0 rounded border"
											onError={(e) => {
												(e.target as HTMLImageElement).style.display = "none";
											}}
										/>
									) : (
										<div className="h-4 w-4 shrink-0 rounded border bg-muted flex items-center justify-center">
											<Link2 className="h-2.5 w-2.5 text-muted-foreground" />
										</div>
									)}
									<div className="flex-1 min-w-0">
										<div className="text-xs font-medium truncate">{bookmark.title || bookmark.url}</div>
										<div className="text-[10px] text-muted-foreground truncate">{new URL(bookmark.url).hostname}</div>
									</div>
								</div>
							</div>
						))
					)}
					{bookmarks.length > 6 && (
						<div className="text-[10px] text-muted-foreground text-center pt-1">
							+{bookmarks.length - 6} autres
						</div>
					)}
				</div>
			)}

			{/* Bookmarks List - Full */}
			{isFull && (
				<div className="flex-1 overflow-y-auto">
					{filteredBookmarks.length === 0 ? (
						<div className="text-sm text-muted-foreground text-center py-8">
							{searchQuery ? "Aucun bookmark trouvé" : "Aucun bookmark"}
						</div>
					) : (
						<div className="flex flex-col gap-2">
							{filteredBookmarks.map((bookmark) => (
								<motion.div
									key={bookmark.id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									className="p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
									onClick={() => handleOpenBookmark(bookmark.url)}
								>
									<div className="flex items-start justify-between gap-2">
										<div className="flex items-start gap-3 flex-1 min-w-0">
											{bookmark.favicon ? (
												<img
													src={bookmark.favicon}
													alt=""
													className="shrink-0 rounded-md border w-8 h-8"
													onError={(e) => {
														(e.target as HTMLImageElement).style.display = "none";
													}}
												/>
											) : (
												<div className="shrink-0 rounded-md border bg-muted flex items-center justify-center w-8 h-8">
													<Link2 className="w-4 h-4 text-muted-foreground" />
												</div>
											)}
											<div className="flex-1 min-w-0">
												<div className="font-semibold truncate">{bookmark.title || bookmark.url}</div>
												<div className="text-muted-foreground truncate mt-0.5 text-xs">
													{new URL(bookmark.url).hostname}
												</div>
												{bookmark.description && (
													<div className="text-muted-foreground line-clamp-2 mt-1 text-xs">
														{bookmark.description}
													</div>
												)}
												{bookmark.tags && bookmark.tags.length > 0 && (
													<div className="flex gap-1 mt-1.5 flex-wrap">
														{bookmark.tags.slice(0, 3).map((tag, idx) => (
															<span
																key={idx}
																className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px]"
															>
																{tag}
															</span>
														))}
													</div>
												)}
											</div>
										</div>
										<div className="flex items-center gap-1 shrink-0">
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6"
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
												<ExternalLink className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6"
												onClick={(e) => {
													e.stopPropagation();
													handleEditBookmark(bookmark);
												}}
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
												aria-label="Supprimer"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</motion.div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Compact Add Button */}
			{isCompact && (
				<Button
					size="sm"
					onClick={handleAddBookmark}
					className="shrink-0"
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


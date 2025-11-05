// src/widgets/RSS/RSSWidget.tsx
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
import { Plus, Trash2, Edit2, Rss as RSSIcon } from "lucide-react";
import type { WidgetProps } from "@/lib/widgetSize";
import {
	loadFeeds,
	addFeed,
	updateFeed,
	deleteFeed,
	loadItems,
	markItemAsRead,
	type RSSFeed,
	type RSSItem,
} from "@/store/rssStorage";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function RSSWidgetComponent({ size = "medium" }: WidgetProps) {
	const [feeds, setFeeds] = useState<RSSFeed[]>(() => loadFeeds());
	const [items, setItems] = useState<RSSItem[]>(() => loadItems());
	const [selectedFeed, setSelectedFeed] = useState<RSSFeed | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editName, setEditName] = useState("");
	const [editUrl, setEditUrl] = useState("");

	const isCompact = useMemo(() => size === "compact", [size]);
	const isFull = useMemo(() => size === "full" || size === "medium", [size]);
	const padding = isCompact ? "p-2" : "p-4";
	const gap = isCompact ? "gap-1" : "gap-2";

	useEffect(() => {
		setFeeds(loadFeeds());
		setItems(loadItems());
	}, []);

	const handleAddFeed = useCallback(() => {
		setSelectedFeed(null);
		setEditName("");
		setEditUrl("");
		setIsDialogOpen(true);
	}, []);

	const handleEditFeed = useCallback((feed: RSSFeed) => {
		setSelectedFeed(feed);
		setEditName(feed.name);
		setEditUrl(feed.url);
		setIsDialogOpen(true);
	}, []);

	const handleSaveFeed = useCallback(() => {
		if (!editUrl.trim()) return;
		if (selectedFeed) {
			updateFeed(selectedFeed.id, {
				name: editName || editUrl,
				url: editUrl,
			});
		} else {
			addFeed({
				name: editName || editUrl,
				url: editUrl,
			});
		}
		setFeeds(loadFeeds());
		setIsDialogOpen(false);
	}, [selectedFeed, editName, editUrl]);

	const handleDeleteFeed = useCallback((id: string) => {
		if (confirm("Supprimer ce flux RSS ?")) {
			deleteFeed(id);
			setFeeds(loadFeeds());
			setItems(loadItems());
		}
	}, []);

	const handleOpenItem = useCallback((item: RSSItem) => {
		markItemAsRead(item.id);
		setItems(loadItems());
		window.open(item.link, "_blank");
	}, []);

	const unreadItems = useMemo(() => {
		return items.filter((i) => !i.read).slice(0, isFull ? 20 : 5);
	}, [items, isFull]);

	return (
		<Card className={cn("w-full h-full max-w-none flex flex-col min-h-0", padding, gap)}>
			{isFull && (
				<div className="space-y-2 shrink-0">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold">RSS</h3>
						<Button
							size="sm"
							onClick={handleAddFeed}
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
					{feeds.length > 0 && (
						<div className="flex gap-1 flex-wrap">
							{feeds.map((feed) => (
								<div
									key={feed.id}
									className="flex items-center gap-1 px-2 py-1 rounded-md border bg-card text-xs"
								>
									<RSSIcon className="h-3 w-3" />
									<span className="truncate max-w-[100px]">{feed.name}</span>
									<Button
										variant="ghost"
										size="icon"
										className="h-4 w-4"
										onClick={(e) => {
											e.stopPropagation();
											handleEditFeed(feed);
										}}
										onMouseDown={(e: React.MouseEvent) => {
											e.stopPropagation();
										}}
										onDragStart={(e: React.DragEvent) => {
											e.preventDefault();
											e.stopPropagation();
										}}
									>
										<Edit2 className="h-3 w-3" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="h-4 w-4 text-destructive"
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteFeed(feed.id);
										}}
										onMouseDown={(e: React.MouseEvent) => {
											e.stopPropagation();
										}}
										onDragStart={(e: React.DragEvent) => {
											e.preventDefault();
											e.stopPropagation();
										}}
									>
										<Trash2 className="h-3 w-3" />
									</Button>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{isCompact && (
				<div className="flex flex-col items-center justify-center gap-1 flex-1">
					<RSSIcon className="h-8 w-8 text-muted-foreground" />
					<div className="text-xs font-bold">{unreadItems.length}</div>
					<div className="text-[10px] text-muted-foreground">non lus</div>
				</div>
			)}

			{isFull && (
				<div className="flex-1 overflow-y-auto space-y-1">
					{unreadItems.length === 0 ? (
						<div className="text-sm text-muted-foreground text-center py-8">
							Aucun article non lu
						</div>
					) : (
						unreadItems.map((item) => (
							<motion.div
								key={item.id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className="p-2 rounded-md border bg-card hover:bg-accent transition-colors cursor-pointer"
								onClick={() => handleOpenItem(item)}
							>
								<div className="font-medium text-sm truncate">{item.title}</div>
								{item.description && (
									<div className="text-xs text-muted-foreground line-clamp-2 mt-1">
										{item.description}
									</div>
								)}
								<div className="text-xs text-muted-foreground mt-1">
									{format(new Date(item.pubDate), "PPP", { locale: fr })}
								</div>
							</motion.div>
						))
					)}
				</div>
			)}

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{selectedFeed ? "Modifier" : "Ajouter"} un flux RSS</DialogTitle>
						<DialogDescription>Ajoutez un flux RSS pour suivre vos sources.</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<Input
							placeholder="Nom du flux"
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
						/>
						<Input
							placeholder="URL du flux RSS"
							value={editUrl}
							onChange={(e) => setEditUrl(e.target.value)}
						/>
					</div>
					<DialogFooter>
						{selectedFeed && (
							<Button
								variant="destructive"
								onClick={() => {
									handleDeleteFeed(selectedFeed.id);
									setIsDialogOpen(false);
								}}
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								<Trash2 className="h-4 w-4 mr-2" />
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
							onClick={handleSaveFeed}
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

export const RSSWidget = memo(RSSWidgetComponent);


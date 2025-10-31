import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
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
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ButtonGroup } from "@/components/ui/button-group";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useTodos, type TodoFilter } from "@/hooks/useTodos";
import { saveTodos, type Todo } from "@/store/todoStorage";
import {
	requestNotificationPermission,
	getNotificationPermission,
	loadNotificationSettings,
	saveNotificationSettings,
	checkAndSendNotifications,
	type NotificationSettings,
} from "@/lib/notifications";
import { syncManager } from "@/lib/sync/syncManager";
import {
	Star,
	Trash2,
	Edit2,
	Search,
	Calendar,
	Download,
	Upload,
	AlertCircle,
	BarChart3,
	PieChart,
	Undo2,
	Redo2,
	ChevronDown,
	Plus,
	Folder,
	Bell,
	BellOff,
	RefreshCw,
} from "lucide-react";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Pie, Cell } from "recharts";

export function TodoWidget() {
	const {
		todos,
		currentListId,
		lists,
		setCurrentList,
		addList,
		renameList,
		deleteList,
		addTodo,
		toggleTodo,
		deleteTodo,
		editTodo,
		togglePriority,
		setDeadline,
		filteredTodos,
		activeCount,
		completedCount,
		priorityCount,
		overdueCount,
		undo,
		redo,
		canUndo,
		canRedo,
	} = useTodos();

	const [filter, setFilter] = useState<TodoFilter>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingValue, setEditingValue] = useState("");
	const [editingDeadline, setEditingDeadline] = useState("");
	const [newTodoDeadline, setNewTodoDeadline] = useState("");
	const [showNewDeadline, setShowNewDeadline] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [todoToDelete, setTodoToDelete] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [showStats, setShowStats] = useState(false);
	const [newListName, setNewListName] = useState("");
	const [showNewList, setShowNewList] = useState(false);
	const [editingListId, setEditingListId] = useState<string | null>(null);
	const [editingListName, setEditingListName] = useState("");
	const [notificationSettings, setNotificationSettings] =
		useState<NotificationSettings>(() => loadNotificationSettings());
	const [notificationPermission, setNotificationPermission] =
		useState<NotificationPermission>(getNotificationPermission());
	const [isSyncing, setIsSyncing] = useState(false);
	const notificationNotifiedRef = useRef<Set<string>>(new Set());
	const inputRef = useRef<HTMLInputElement>(null);
	const editInputRef = useRef<HTMLInputElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const cardRef = useRef<HTMLDivElement>(null);
	const newListInputRef = useRef<HTMLInputElement>(null);

	const filtered = filteredTodos(filter, searchQuery);
	const totalCount = todos.length;
	const progressPercentage =
		totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

	// Chart data - Using theme colors matching buttons (--primary: oklch(0.205 0 0) ≈ hsl(0, 0%, 21%))
	const statusChartData = [
		{ name: "Actives", value: activeCount, fill: "hsl(0, 0%, 60%)" }, // Gris
		{
			name: "Terminées",
			value: completedCount,
			fill: "hsl(0, 0%, 21%)", // Noir comme les boutons (--primary)
		},
	];

	const priorityChartData = [
		{
			name: "Prioritaires",
			value: priorityCount,
			fill: "hsl(47.9, 95.8%, 53.1%)", // Jaune/Orange (accent pour priorité)
		},
		{
			name: "Normales",
			value: totalCount - priorityCount,
			fill: "hsl(0, 0%, 21%)", // Noir comme les boutons (--primary)
		},
	];

	const chartConfig = {
		Actives: {
			label: "Actives",
			color: "hsl(0, 0%, 60%)", // Gris
		},
		Terminées: {
			label: "Terminées",
			color: "hsl(0, 0%, 21%)", // Noir comme les boutons
		},
		Prioritaires: {
			label: "Prioritaires",
			color: "hsl(47.9, 95.8%, 53.1%)", // Jaune/Orange (pour contraste)
		},
		Normales: {
			label: "Normales",
			color: "hsl(0, 0%, 21%)", // Noir comme les boutons
		},
	};

	// Focus edit input when editing starts
	useEffect(() => {
		if (editingId && editInputRef.current) {
			editInputRef.current.focus();
			editInputRef.current.select();
		}
	}, [editingId]);

	const handleAddTodo = (e: React.FormEvent) => {
		e.preventDefault();
		const input = inputRef.current;
		if (input?.value.trim()) {
			addTodo(input.value, newTodoDeadline || undefined);
			input.value = "";
			setNewTodoDeadline("");
			setShowNewDeadline(false);
			toast.success("Tâche ajoutée");
		}
	};

	const startEdit = (todo: Todo) => {
		setEditingId(todo.id);
		setEditingValue(todo.title);
		setEditingDeadline(todo.deadline || "");
	};

	const saveEdit = (id: string) => {
		if (editingValue.trim()) {
			editTodo(id, editingValue);
			setDeadline(id, editingDeadline || undefined);
		}
		setEditingId(null);
		setEditingValue("");
		setEditingDeadline("");
	};

	const cancelEdit = () => {
		setEditingId(null);
		setEditingValue("");
		setEditingDeadline("");
	};

	const exportTodos = () => {
		const dataStr = JSON.stringify(todos, null, 2);
		const dataBlob = new Blob([dataStr], { type: "application/json" });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `todos-${new Date().toISOString().split("T")[0]}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		toast.success("Tâches exportées avec succès");
	};

	const importTodos = () => {
		fileInputRef.current?.click();
	};

	const handleFileImport = (file: File) => {
		if (!file || !file.name.endsWith(".json")) {
			toast.error("Fichier invalide", {
				description: "Veuillez utiliser un fichier JSON",
			});
			return;
		}

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const imported = JSON.parse(event.target?.result as string) as Todo[];
				if (Array.isArray(imported)) {
					saveTodos(currentListId, imported);
					toast.success(`${imported.length} tâche(s) importée(s)`, {
						description: "Rechargement de la page...",
					});
					setTimeout(() => window.location.reload(), 1000);
				}
			} catch {
				toast.error("Erreur lors de l'import", {
					description: "Le fichier JSON est invalide",
				});
			}
		};
		reader.readAsText(file);
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) handleFileImport(file);
		e.target.value = ""; // Reset input
	};

	// Drag & drop handlers
	useEffect(() => {
		const card = cardRef.current;
		if (!card) return;

		const handleDragOver = (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			if (e.dataTransfer?.types.includes("Files")) {
				setIsDragging(true);
			}
		};

		const handleDragLeave = (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);
		};

		const handleDrop = (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);

			const file = e.dataTransfer?.files[0];
			if (file) {
				handleFileImport(file);
			}
		};

		card.addEventListener("dragover", handleDragOver);
		card.addEventListener("dragleave", handleDragLeave);
		card.addEventListener("drop", handleDrop);

		return () => {
			card.removeEventListener("dragover", handleDragOver);
			card.removeEventListener("dragleave", handleDragLeave);
			card.removeEventListener("drop", handleDrop);
		};
	}, []);

	// Keyboard shortcuts for undo/redo
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
				e.preventDefault();
				if (canUndo) undo();
			} else if (
				(e.ctrlKey || e.metaKey) &&
				(e.key === "y" || (e.shiftKey && e.key === "z"))
			) {
				e.preventDefault();
				if (canRedo) redo();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [undo, redo, canUndo, canRedo]);

	const handleDeleteClick = (id: string) => {
		setTodoToDelete(id);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (todoToDelete) {
			deleteTodo(todoToDelete);
			toast.success("Tâche supprimée");
			setTodoToDelete(null);
		}
		setDeleteDialogOpen(false);
	};

	const handleAddList = () => {
		if (newListName.trim()) {
			addList(newListName);
			toast.success(`Liste "${newListName}" créée`);
			setNewListName("");
			setShowNewList(false);
		}
	};

	const handleRenameList = (listId: string) => {
		if (editingListName.trim()) {
			renameList(listId, editingListName);
			toast.success("Liste renommée");
			setEditingListId(null);
			setEditingListName("");
		}
	};

	const handleDeleteList = (listId: string, listName: string) => {
		if (lists.length <= 1) {
			toast.error("Impossible de supprimer la dernière liste");
			return;
		}
		deleteList(listId);
		toast.success(`Liste "${listName}" supprimée`);
	};

	const currentList = lists.find((l) => l.id === currentListId);

	// Request notification permission on mount
	useEffect(() => {
		if (notificationPermission === "default" && "Notification" in window) {
			// Auto-request permission if not already granted/denied
			requestNotificationPermission().then((permission) => {
				setNotificationPermission(permission);
			});
		}
	}, [notificationPermission]);

	// Check for deadline notifications
	useEffect(() => {
		if (!notificationSettings.enabled) return;
		if (notificationPermission !== "granted") return;

		const checkNotifications = () => {
			checkAndSendNotifications(
				todos,
				notificationSettings.remindBeforeDays,
				notificationNotifiedRef.current
			);
		};

		// Check immediately
		checkNotifications();

		// Set up interval
		const interval = setInterval(
			checkNotifications,
			notificationSettings.checkInterval * 60 * 1000
		);

		return () => clearInterval(interval);
	}, [todos, notificationSettings, notificationPermission]);

	// Handle notification permission request
	const handleRequestNotificationPermission = async () => {
		const permission = await requestNotificationPermission();
		setNotificationPermission(permission);
		if (permission === "granted") {
			toast.success("Notifications activées");
		} else {
			toast.error("Notifications refusées");
		}
	};

	// Toggle notifications
	const toggleNotifications = () => {
		const newSettings: NotificationSettings = {
			...notificationSettings,
			enabled: !notificationSettings.enabled,
		};
		setNotificationSettings(newSettings);
		saveNotificationSettings(newSettings);
		toast.success(
			newSettings.enabled
				? "Notifications activées"
				: "Notifications désactivées"
		);
	};

	// Sync with external APIs
	const handleSync = async () => {
		setIsSyncing(true);
		try {
			await syncManager.syncAll();
			toast.success("Synchronisation réussie");
		} catch (error) {
			toast.error("Erreur lors de la synchronisation");
			console.error("Sync error:", error);
		} finally {
			setIsSyncing(false);
		}
	};

	const getDeadlineStatus = (deadline?: string) => {
		if (!deadline) return null;
		const deadlineDate = new Date(deadline);
		const now = Date.now();
		const diff = deadlineDate.getTime() - now;
		const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

		if (days < 0)
			return {
				status: "overdue",
				text: "En retard",
				variant: "destructive" as const,
			};
		if (days === 0)
			return {
				status: "today",
				text: "Aujourd'hui",
				variant: "default" as const,
			};
		if (days <= 3)
			return {
				status: "soon",
				text: `${days}j`,
				variant: "secondary" as const,
			};
		return {
			status: "upcoming",
			text: deadlineDate.toLocaleDateString("fr-FR", {
				day: "numeric",
				month: "short",
			}),
			variant: "outline" as const,
		};
	};

	return (
		<TooltipProvider>
			<Card
				ref={cardRef}
				className={`w-full max-w-md p-4 flex flex-col gap-3 relative transition-colors ${
					isDragging ? "border-2 border-primary bg-primary/5" : ""
				}`}
			>
				{/* List selector */}
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-2 flex-1'>
						{showNewList ? (
							<div className='flex items-center gap-2 flex-1'>
								<Folder className='h-4 w-4 text-muted-foreground' />
								<Input
									ref={newListInputRef}
									placeholder='Nom de la liste...'
									value={newListName}
									onChange={(e) => setNewListName(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") handleAddList();
										if (e.key === "Escape") {
											setShowNewList(false);
											setNewListName("");
										}
									}}
									className='h-8 flex-1'
									autoFocus
								/>
								<Button size='sm' onClick={handleAddList}>
									Ajouter
								</Button>
								<Button
									size='sm'
									variant='ghost'
									onClick={() => {
										setShowNewList(false);
										setNewListName("");
									}}
								>
									Annuler
								</Button>
							</div>
						) : (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant='outline' className='flex items-center gap-2'>
										<Folder className='h-4 w-4' />
										<span>{currentList?.name || "Liste"}</span>
										<ChevronDown className='h-4 w-4' />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='start' className='w-56'>
									<DropdownMenuLabel>Listes</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{lists.map((list) => (
										<div
											key={list.id}
											className='flex items-center justify-between group px-2 py-1.5 hover:bg-accent rounded-sm'
										>
											{editingListId === list.id ? (
												<div className='flex items-center gap-2 flex-1'>
													<Input
														value={editingListName}
														onChange={(e) => setEditingListName(e.target.value)}
														onKeyDown={(e) => {
															if (e.key === "Enter") handleRenameList(list.id);
															if (e.key === "Escape") {
																setEditingListId(null);
																setEditingListName("");
															}
														}}
														onBlur={() => handleRenameList(list.id)}
														className='h-7 text-sm'
														autoFocus
													/>
												</div>
											) : (
												<>
													<button
														onClick={() => setCurrentList(list.id)}
														className={`flex-1 text-left text-sm ${
															list.id === currentListId ? "font-semibold" : ""
														}`}
													>
														{list.name}
													</button>
													<div className='flex gap-1 opacity-0 group-hover:opacity-100'>
														<Button
															variant='ghost'
															size='icon'
															className='h-6 w-6'
															onClick={() => {
																setEditingListId(list.id);
																setEditingListName(list.name);
															}}
														>
															<Edit2 className='h-3 w-3' />
														</Button>
														{lists.length > 1 && (
															<Button
																variant='ghost'
																size='icon'
																className='h-6 w-6 text-destructive'
																onClick={() =>
																	handleDeleteList(list.id, list.name)
																}
															>
																<Trash2 className='h-3 w-3' />
															</Button>
														)}
													</div>
												</>
											)}
										</div>
									))}
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={() => setShowNewList(true)}>
										<Plus className='h-4 w-4 mr-2' />
										Nouvelle liste
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
					<ButtonGroup aria-label='Actions des tâches'>
						{/* Export/Import */}
						<ButtonGroup>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant='ghost'
										size='icon'
										className='h-8 w-8'
										onClick={exportTodos}
										aria-label='Exporter les tâches'
									>
										<Download className='h-4 w-4' />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Exporter les tâches</p>
								</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant='ghost'
										size='icon'
										className='h-8 w-8'
										onClick={importTodos}
										aria-label='Importer les tâches'
									>
										<Upload className='h-4 w-4' />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Importer des tâches</p>
								</TooltipContent>
							</Tooltip>
						</ButtonGroup>

						{/* Undo/Redo */}
						<ButtonGroup>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant='ghost'
										size='icon'
										className='h-8 w-8'
										onClick={undo}
										disabled={!canUndo}
										aria-label='Annuler'
									>
										<Undo2 className='h-4 w-4' />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Annuler (Ctrl+Z)</p>
								</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant='ghost'
										size='icon'
										className='h-8 w-8'
										onClick={redo}
										disabled={!canRedo}
										aria-label='Refaire'
									>
										<Redo2 className='h-4 w-4' />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Refaire (Ctrl+Shift+Z)</p>
								</TooltipContent>
							</Tooltip>
						</ButtonGroup>

						{/* Notifications et Sync */}
						<ButtonGroup>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant='ghost'
										size='icon'
										className='h-8 w-8'
										onClick={
											notificationPermission === "granted"
												? toggleNotifications
												: handleRequestNotificationPermission
										}
										aria-label='Notifications'
									>
										{notificationPermission === "granted" &&
										notificationSettings.enabled ? (
											<Bell className='h-4 w-4' />
										) : (
											<BellOff className='h-4 w-4' />
										)}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>
										{notificationPermission === "granted"
											? notificationSettings.enabled
												? "Désactiver les notifications"
												: "Activer les notifications"
											: "Activer les notifications"}
									</p>
								</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant='ghost'
										size='icon'
										className='h-8 w-8'
										onClick={handleSync}
										disabled={isSyncing}
										aria-label='Synchroniser'
									>
										<RefreshCw
											className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
										/>
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Synchroniser avec les services externes</p>
								</TooltipContent>
							</Tooltip>
						</ButtonGroup>

						<input
							ref={fileInputRef}
							type='file'
							accept='.json'
							onChange={handleFileInputChange}
							className='hidden'
						/>
					</ButtonGroup>
				</div>

				{/* Drag & drop overlay */}
				{isDragging && (
					<div className='absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-50'>
						<div className='text-center'>
							<Upload className='h-8 w-8 mx-auto mb-2 text-primary' />
							<p className='text-sm font-medium'>Déposez le fichier JSON ici</p>
						</div>
					</div>
				)}

				{/* Stats */}
				{totalCount > 0 && (
					<div className='space-y-3'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center justify-between text-sm flex-1'>
								<span className='text-muted-foreground'>Progression</span>
								<span className='font-medium'>{progressPercentage}%</span>
							</div>
							<Button
								variant='ghost'
								size='sm'
								onClick={() => setShowStats(!showStats)}
								className='h-8'
								aria-label='Afficher les statistiques'
							>
								{showStats ? (
									<BarChart3 className='h-4 w-4' />
								) : (
									<PieChart className='h-4 w-4' />
								)}
							</Button>
						</div>
						<Progress value={progressPercentage} className='w-full' />
						<div className='flex gap-4 text-xs text-muted-foreground'>
							<span>
								{activeCount} active{activeCount !== 1 ? "s" : ""}
							</span>
							<span>
								{completedCount} terminée{completedCount !== 1 ? "s" : ""}
							</span>
							{priorityCount > 0 && (
								<span>
									{priorityCount} prioritaire{priorityCount !== 1 ? "s" : ""}
								</span>
							)}
							{overdueCount > 0 && (
								<span className='text-red-600 font-medium'>
									{overdueCount} en retard
								</span>
							)}
						</div>

						{/* Visual Statistics Charts */}
						{showStats && (
							<div className='grid grid-cols-2 gap-4 pt-2'>
								{/* Status Pie Chart */}
								<div className='space-y-2'>
									<h4 className='text-xs font-medium text-muted-foreground'>
										Par statut
									</h4>
									<ChartContainer config={chartConfig} className='h-[120px]'>
										<RechartsPieChart>
											<ChartTooltip
												content={<ChartTooltipContent hideLabel />}
											/>
											<Pie
												data={statusChartData}
												dataKey='value'
												nameKey='name'
												cx='50%'
												cy='50%'
												outerRadius={50}
											>
												{statusChartData.map((entry, index) => (
													<Cell key={`cell-${index}`} fill={entry.fill} />
												))}
											</Pie>
										</RechartsPieChart>
									</ChartContainer>
								</div>

								{/* Priority Pie Chart */}
								{priorityCount > 0 && (
									<div className='space-y-2'>
										<h4 className='text-xs font-medium text-muted-foreground'>
											Par priorité
										</h4>
										<ChartContainer config={chartConfig} className='h-[120px]'>
											<RechartsPieChart>
												<ChartTooltip
													content={<ChartTooltipContent hideLabel />}
												/>
												<Pie
													data={priorityChartData}
													dataKey='value'
													nameKey='name'
													cx='50%'
													cy='50%'
													outerRadius={50}
												>
													{priorityChartData.map((entry, index) => (
														<Cell key={`cell-${index}`} fill={entry.fill} />
													))}
												</Pie>
											</RechartsPieChart>
										</ChartContainer>
									</div>
								)}
							</div>
						)}
					</div>
				)}

				{/* Search */}
				<div className='relative'>
					<Search className='absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
					<Input
						type='text'
						placeholder='Rechercher...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='pl-8'
						aria-label='Rechercher dans les tâches'
					/>
				</div>

				{/* Add todo form */}
				<form onSubmit={handleAddTodo} className='flex flex-col gap-2'>
					<div className='flex gap-2'>
						<Input
							ref={inputRef}
							placeholder='Ajouter une tâche...'
							className='flex-1'
							aria-label='Nouvelle tâche'
						/>
						<Button type='submit'>Ajouter</Button>
					</div>
					{showNewDeadline ? (
						<div className='flex gap-2 items-center'>
							<Calendar className='h-4 w-4 text-muted-foreground' />
							<Input
								type='date'
								value={newTodoDeadline}
								onChange={(e) => setNewTodoDeadline(e.target.value)}
								className='flex-1'
								aria-label='Date limite'
							/>
							<Button
								type='button'
								variant='ghost'
								size='sm'
								onClick={() => {
									setShowNewDeadline(false);
									setNewTodoDeadline("");
								}}
							>
								Annuler
							</Button>
						</div>
					) : (
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={() => setShowNewDeadline(true)}
							className='w-fit'
						>
							<Calendar className='h-4 w-4 mr-2' />
							Ajouter une date limite
						</Button>
					)}
				</form>

				{/* Filter buttons */}
				<div className='flex gap-2 text-sm items-center flex-wrap'>
					<Button
						variant={filter === "all" ? "default" : "outline"}
						size='sm'
						onClick={() => setFilter("all")}
						aria-label='Toutes les tâches'
					>
						Toutes
					</Button>
					<Button
						variant={filter === "active" ? "default" : "outline"}
						size='sm'
						onClick={() => setFilter("active")}
						aria-label='Tâches actives'
					>
						Actives
					</Button>
					<Button
						variant={filter === "completed" ? "default" : "outline"}
						size='sm'
						onClick={() => setFilter("completed")}
						aria-label='Tâches terminées'
					>
						Terminées
					</Button>
					<Button
						variant={filter === "priority" ? "default" : "outline"}
						size='sm'
						onClick={() => setFilter("priority")}
						aria-label='Tâches prioritaires'
					>
						<Star className='h-3 w-3 mr-1' />
						Prioritaires
					</Button>
				</div>

				{/* Todo list */}
				<div className='flex flex-col gap-2 min-h-[200px] max-h-[400px] overflow-y-auto'>
					{filtered.length === 0 ? (
						<motion.div
							key='empty'
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className='text-center text-muted-foreground py-8'
						>
							{searchQuery
								? "Aucune tâche ne correspond à votre recherche"
								: filter === "all"
								? "Aucune tâche. Ajoutez-en une !"
								: filter === "active"
								? "Aucune tâche active"
								: filter === "completed"
								? "Aucune tâche terminée"
								: "Aucune tâche prioritaire"}
						</motion.div>
					) : (
						filtered.map((todo) => {
							const deadlineStatus = getDeadlineStatus(todo.deadline);
							return (
								<motion.div
									key={todo.id}
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, x: -20 }}
									layout
									className={`flex items-start gap-2 p-2 rounded-md border ${
										todo.priority
											? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20"
											: ""
									} ${todo.completed ? "opacity-60" : ""}`}
								>
									{/* Checkbox */}
									<Checkbox
										checked={todo.completed}
										onCheckedChange={() => toggleTodo(todo.id)}
										aria-label={
											todo.completed
												? "Marquer comme non terminé"
												: "Marquer comme terminé"
										}
									/>

									{/* Todo content */}
									<div className='flex-1 min-w-0'>
										{editingId === todo.id ? (
											<div className='flex flex-col gap-2'>
												<Input
													ref={editInputRef}
													value={editingValue}
													onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
														setEditingValue(e.target.value)
													}
													onBlur={() => saveEdit(todo.id)}
													onKeyDown={(
														e: React.KeyboardEvent<HTMLInputElement>
													) => {
														if (e.key === "Enter") {
															saveEdit(todo.id);
														} else if (e.key === "Escape") {
															cancelEdit();
														}
													}}
													className='flex-1 h-8'
												/>
												<div className='flex gap-2 items-center'>
													<Calendar className='h-4 w-4 text-muted-foreground' />
													<Input
														type='date'
														value={editingDeadline}
														onChange={(e) => setEditingDeadline(e.target.value)}
														className='flex-1'
													/>
												</div>
											</div>
										) : (
											<>
												<span
													className={`flex-1 block ${
														todo.completed
															? "line-through text-muted-foreground"
															: ""
													}`}
													onDoubleClick={() => startEdit(todo)}
												>
													{todo.title}
												</span>
												{deadlineStatus && !todo.completed && (
													<Badge
														variant={deadlineStatus.variant}
														className='mt-1 flex items-center gap-1'
													>
														{deadlineStatus.status === "overdue" && (
															<AlertCircle className='h-3 w-3' />
														)}
														{deadlineStatus.text}
													</Badge>
												)}
											</>
										)}
									</div>
									{!editingId && (
										<div className='flex gap-1'>
											{/* Priority button */}
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant='ghost'
														size='icon'
														className='h-7 w-7'
														onClick={() => togglePriority(todo.id)}
														aria-label={
															todo.priority
																? "Retirer la priorité"
																: "Marquer comme prioritaire"
														}
													>
														<Star
															className={`h-4 w-4 ${
																todo.priority
																	? "fill-yellow-400 text-yellow-400"
																	: "text-muted-foreground"
															}`}
														/>
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													<p>
														{todo.priority
															? "Retirer la priorité"
															: "Marquer comme prioritaire"}
													</p>
												</TooltipContent>
											</Tooltip>
											{/* Edit button */}
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant='ghost'
														size='icon'
														className='h-7 w-7'
														onClick={() => startEdit(todo)}
														aria-label='Modifier la tâche'
													>
														<Edit2 className='h-4 w-4 text-muted-foreground' />
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													<p>Modifier la tâche</p>
												</TooltipContent>
											</Tooltip>
											{/* Delete button */}
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant='ghost'
														size='icon'
														className='h-7 w-7 text-red-600 hover:text-red-700'
														onClick={() => handleDeleteClick(todo.id)}
														aria-label='Supprimer la tâche'
													>
														<Trash2 className='h-4 w-4' />
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													<p>Supprimer la tâche</p>
												</TooltipContent>
											</Tooltip>
										</div>
									)}
								</motion.div>
							);
						})
					)}
				</div>

				{/* Delete confirmation dialog */}
				<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Supprimer la tâche</DialogTitle>
							<DialogDescription>
								Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action
								est irréversible.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant='outline'
								onClick={() => setDeleteDialogOpen(false)}
							>
								Annuler
							</Button>
							<Button variant='destructive' onClick={confirmDelete}>
								Supprimer
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</Card>
		</TooltipProvider>
	);
}

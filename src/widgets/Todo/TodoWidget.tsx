import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { ButtonGroup } from "@/components/ui/button-group";
import { motion } from "framer-motion";
import { useState, useRef, useEffect, useCallback, memo } from "react";
import { useTodos } from "@/hooks/useTodos";
import type { TodoFilter } from "@/lib/constants";
import { saveTodos, type Todo } from "@/store/todoStorage";
import { useTodoStore } from "@/store/todoStore";
import { DatePicker } from "@/components/ui/calendar-full";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
	requestNotificationPermission,
	getNotificationPermission,
	loadNotificationSettings,
	saveNotificationSettings,
	checkAndSendNotifications,
	type NotificationSettings,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { getOAuthManager } from "@/lib/auth/oauthManager";
import { GoogleTasksSyncProvider } from "@/lib/sync/googleTasksSync";
import type { SyncConfig } from "@/lib/sync/apiSync";
import {
	getCurrentTodos,
	getCurrentLists,
	getTodoByTitle,
	waitForListAdded,
	waitForCurrentListChanged,
} from "@/lib/todoUtils";
import { logger } from "@/lib/logger";
import { syncMessages, getSyncError, syncWarnings } from "@/lib/syncMessages";
import {
	SYNC_INTERVALS,
	RETRY_DELAYS,
	TODO_FILTERS,
} from "@/lib/constants";
import { shouldVirtualize } from "@/lib/performance";
import { VirtualizedList } from "@/components/ui/virtualized-list";
import {
	TodoFilters,
	TodoSearchBar,
	TodoAddForm,
	TodoItem,
	TodoStats,
} from "./components";
import {
	X,
	Edit2,
	Calendar,
	Download,
	Upload,
	Undo2,
	Redo2,
	ChevronDown,
	Plus,
	Folder,
	Bell,
	BellOff,
	RefreshCw,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { WidgetProps } from "@/lib/widgetSize";

function TodoWidgetComponent({ size = "medium" }: WidgetProps) {
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
		updateTodoId,
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

	const [filter, setFilter] = useState<TodoFilter>(TODO_FILTERS.ALL);
	const [searchQuery, setSearchQuery] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingValue, setEditingValue] = useState("");
	const [editingDeadline, setEditingDeadline] = useState<Date | undefined>(
		undefined
	);
	const [newTodoDeadline, setNewTodoDeadline] = useState<Date | undefined>(
		undefined
	);
	const [showNewDeadline, setShowNewDeadline] = useState(false);
	const [deadlinePickerOpen, setDeadlinePickerOpen] = useState(false);
	const [newTodoDeadlinePickerOpen, setNewTodoDeadlinePickerOpen] =
		useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [todoToDelete, setTodoToDelete] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [newListName, setNewListName] = useState("");
	const [showNewList, setShowNewList] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [googleTasksProvider, setGoogleTasksProvider] =
		useState<GoogleTasksSyncProvider | null>(null);
	const [editingListId, setEditingListId] = useState<string | null>(null);
	const [editingListName, setEditingListName] = useState("");
	const [notificationSettings, setNotificationSettings] =
		useState<NotificationSettings>(() => loadNotificationSettings());
	const [notificationPermission, setNotificationPermission] =
		useState<NotificationPermission>(getNotificationPermission());
	const notificationNotifiedRef = useRef<Set<string>>(new Set());
	const inputRef = useRef<HTMLInputElement>(null);
	const editInputRef = useRef<HTMLInputElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const cardRef = useRef<HTMLDivElement>(null);
	const newListInputRef = useRef<HTMLInputElement>(null);
	const syncingTodoIdsRef = useRef<Set<string>>(new Set()); // Pour éviter les doublons lors de la synchronisation
	const [syncingTodoIds, setSyncingTodoIds] = useState<Set<string>>(new Set()); // État pour les indicateurs visuels

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

	// Gérer les clics en dehors du formulaire d'édition pour sauvegarder
	useEffect(() => {
		if (!editingId) return;

		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			// Ne pas sauvegarder si on clique sur le DatePicker ou ses éléments
			if (
				target.closest('[role="dialog"]') ||
				target.closest("[data-radix-popper-content-wrapper]") ||
				target.closest("[data-radix-popover-content]") ||
				target.closest(".group")
			) {
				return;
			}

			// Sauvegarder si on clique en dehors du formulaire d'édition
			if (!target.closest("[data-editing-todo]")) {
				const todoId = editingId;
				if (todoId) {
					// Utiliser les valeurs actuelles depuis les états
					saveEdit(todoId);
				}
			}
		};

		// Petit délai pour éviter la sauvegarde immédiate lors de l'ouverture
		const timeoutId = setTimeout(() => {
			document.addEventListener("mousedown", handleClickOutside);
		}, 100);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener("mousedown", handleClickOutside);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editingId]); // Ne dépendre que de editingId, les valeurs seront récupérées depuis les états

	const handleAddTodo = async (e: React.FormEvent) => {
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

			const todoTitle = input.value.trim();

			// Ajouter la tâche localement
			addTodo(todoTitle, deadlineStr);

			// Créer immédiatement dans Google Tasks si connecté (synchronisation instantanée)
			if (googleTasksProvider && googleTasksProvider.enabled) {
				// Synchroniser immédiatement en utilisant une subscription pour détecter la nouvelle tâche
				(async () => {
					try {
						// Utiliser une approche plus efficace avec subscription au lieu de polling
						let newTodo: Todo | undefined;
						let unsubscribe: (() => void) | undefined;

						// Attendre un court délai pour que la tâche soit ajoutée au store
						await new Promise((resolve) =>
							setTimeout(resolve, RETRY_DELAYS.INITIAL)
						);

						// Essayer de trouver la tâche (max 2 tentatives avec délais plus courts)
						for (let attempt = 0; attempt < 2 && !newTodo; attempt++) {
							if (attempt > 0) {
								await new Promise((resolve) =>
									setTimeout(resolve, RETRY_DELAYS.INITIAL)
								);
							}
							// Utiliser la fonction utilitaire pour récupérer la tâche
							newTodo = getTodoByTitle(todoTitle, true);
						}

						// Si toujours pas trouvée, utiliser une subscription pour écouter les changements
						if (!newTodo) {
							const findTodoPromise = new Promise<Todo | undefined>(
								(resolve) => {
									unsubscribe = useTodoStore.subscribe((state) => {
										const found = state.present
											.filter(
												(t) =>
													t.title === todoTitle &&
													!t.completed &&
													!t.id.startsWith("google-")
											)
											.sort(
												(a, b) => (b.createdAt || 0) - (a.createdAt || 0)
											)[0];
										if (found) {
											if (unsubscribe) {
												unsubscribe();
											}
											resolve(found);
										}
									});

									// Timeout après un délai raisonnable
									setTimeout(() => {
										if (unsubscribe) {
											unsubscribe();
											unsubscribe = undefined;
										}
										resolve(undefined);
									}, RETRY_DELAYS.INITIAL * 5);
								}
							);

							newTodo = await findTodoPromise;
							if (unsubscribe) {
								unsubscribe();
								unsubscribe = undefined;
							}
						}

						if (newTodo) {
							logger.debug(
								`🚀 Synchronisation immédiate dans Google Tasks: "${newTodo.title}"`
							);
							// Marquer la tâche comme en cours de synchronisation
							syncingTodoIdsRef.current.add(newTodo.id);
							setSyncingTodoIds(new Set(syncingTodoIdsRef.current));

							// Récupérer le nom de la liste actuelle pour synchroniser dans la bonne liste Google Tasks
							const currentList = lists.find((l) => l.id === currentListId);
							const listName = currentList?.name;
							const idMap = await googleTasksProvider.pushTodos(
								[newTodo],
								listName
							);
							// Mettre à jour l'ID local avec l'ID Google si créé
							if (idMap.has(newTodo.id)) {
								const googleId = idMap.get(newTodo.id)!;
								updateTodoId(newTodo.id, googleId);
								logger.debug(
									`🔄 ID de tâche mis à jour: ${newTodo.id} → ${googleId}`
								);
								// Retirer de la liste des tâches en cours de synchronisation
								syncingTodoIdsRef.current.delete(newTodo.id);
								setSyncingTodoIds(new Set(syncingTodoIdsRef.current));
								const successMsg = syncMessages.taskCreated(
									newTodo.title,
									listName
								);
								toast.success(successMsg.title, {
									description: successMsg.description,
								});
							} else {
								// Retirer de la liste des tâches en cours de synchronisation même en cas d'erreur
								syncingTodoIdsRef.current.delete(newTodo.id);
								setSyncingTodoIds(new Set(syncingTodoIdsRef.current));
								logger.warn(
									`⚠️ Aucun ID Google retourné pour la tâche "${newTodo.title}"`
								);
								const warningMsg = syncWarnings.noGoogleIdReturned(
									newTodo.title
								);
								toast.warning(warningMsg.title, {
									description: warningMsg.description,
								});
							}
						} else {
							// Si toujours pas trouvé, synchroniser toutes les tâches locales non synchronisées
							logger.warn(
								`⚠️ Tâche "${todoTitle}" non trouvée, synchronisation de toutes les tâches locales...`
							);
							const allTodos = getCurrentTodos();
							const localOnlyTodos = allTodos.filter(
								(t) => !t.id.startsWith("google-")
							);
							if (localOnlyTodos.length > 0) {
								// Récupérer le nom de la liste actuelle pour synchroniser dans la bonne liste Google Tasks
								const currentList = lists.find((l) => l.id === currentListId);
								const listName = currentList?.name;
								const idMap = await googleTasksProvider.pushTodos(
									localOnlyTodos,
									listName
								);
								for (const [localId, googleId] of idMap.entries()) {
									updateTodoId(localId, googleId);
								}
								const successMsg = syncMessages.tasksSynced(
									localOnlyTodos.length,
									listName
								);
								toast.success(successMsg.title, {
									description: successMsg.description,
								});
							}
						}
					} catch (error) {
						logger.error(
							"Erreur lors de la synchronisation avec Google Tasks:",
							error
						);
						const errorInfo = getSyncError(error);
						toast.error(errorInfo.title, {
							description: errorInfo.description,
						});
					}
				})();
			}

			input.value = "";
			setNewTodoDeadline(undefined);
			setShowNewDeadline(false);
			toast.success(
				deadlineStr ? "Tâche ajoutée avec deadline" : "Tâche ajoutée"
			);
		}
	};

	const startEdit = (todo: Todo) => {
		setEditingId(todo.id);
		setEditingValue(todo.title);
		setEditingDeadline(todo.deadline ? new Date(todo.deadline) : undefined);
	};

	const saveEdit = async (id: string) => {
		if (editingValue.trim()) {
			editTodo(id, editingValue);
			// Convertir Date en string YYYY-MM-DD pour la deadline
			const deadlineStr = editingDeadline
				? `${editingDeadline.getFullYear()}-${String(
						editingDeadline.getMonth() + 1
				  ).padStart(2, "0")}-${String(editingDeadline.getDate()).padStart(
						2,
						"0"
				  )}`
				: undefined;

			setDeadline(id, deadlineStr);

			// Synchroniser avec Google Tasks si connecté
			if (googleTasksProvider && googleTasksProvider.enabled) {
				try {
					// Marquer la tâche comme en cours de synchronisation
					syncingTodoIdsRef.current.add(id);
					setSyncingTodoIds(new Set(syncingTodoIdsRef.current));

					// Attendre que le state soit mis à jour (editTodo et setDeadline sont asynchrones)
					await new Promise((resolve) =>
						setTimeout(resolve, RETRY_DELAYS.INITIAL)
					);
					const updatedTodo = todos.find((t) => t.id === id);
					if (updatedTodo) {
						// Créer une copie avec les valeurs mises à jour pour s'assurer qu'on envoie les bonnes valeurs
						const todoToSync: Todo = {
							...updatedTodo,
							title: editingValue.trim(),
							deadline: deadlineStr,
						};
						// Récupérer le nom de la liste actuelle pour synchroniser dans la bonne liste Google Tasks
						const currentList = lists.find((l) => l.id === currentListId);
						const listName = currentList?.name;
						await googleTasksProvider.pushTodos([todoToSync], listName);
						logger.debug(
							`✅ Tâche "${todoToSync.title}" mise à jour dans Google Tasks`
						);
						// Retirer de la liste des tâches en cours de synchronisation
						syncingTodoIdsRef.current.delete(id);
						setSyncingTodoIds(new Set(syncingTodoIdsRef.current));
						const successMsg = syncMessages.taskUpdated(
							todoToSync.title,
							listName
						);
						toast.success(successMsg.title, {
							description: successMsg.description,
						});
					}
				} catch (error) {
					// Retirer de la liste des tâches en cours de synchronisation même en cas d'erreur
					syncingTodoIdsRef.current.delete(id);
					setSyncingTodoIds(new Set(syncingTodoIdsRef.current));
					logger.error(
						"Erreur lors de la synchronisation avec Google Tasks:",
						error
					);
					const errorInfo = getSyncError(error);
					toast.error(errorInfo.title, {
						description: errorInfo.description,
					});
				}
			}
		}
		setEditingId(null);
		setEditingValue("");
		setEditingDeadline(undefined);
	};

	const cancelEdit = () => {
		setEditingId(null);
		setEditingValue("");
		setEditingDeadline(undefined);
	};

	// Fonction pour gérer le toggle d'une tâche
	const handleToggleTodo = async (todo: Todo) => {
		const newCompleted = !todo.completed;
		toggleTodo(todo.id);

		// Synchroniser avec Google Tasks si connecté
		if (googleTasksProvider && googleTasksProvider.enabled) {
			try {
				// Marquer la tâche comme en cours de synchronisation
				syncingTodoIdsRef.current.add(todo.id);
				setSyncingTodoIds(new Set(syncingTodoIdsRef.current));

				// Attendre que le state soit mis à jour, puis récupérer la tâche mise à jour
				await new Promise((resolve) =>
					setTimeout(resolve, RETRY_DELAYS.INITIAL)
				);
				const updatedTodo = todos.find((t) => t.id === todo.id);
				if (updatedTodo) {
					// Créer une copie avec le statut complété mis à jour
					const todoToSync: Todo = {
						...updatedTodo,
						completed: newCompleted,
					};
					// Récupérer le nom de la liste actuelle pour synchroniser dans la bonne liste Google Tasks
					const currentList = lists.find((l) => l.id === currentListId);
					const listName = currentList?.name;
					await googleTasksProvider.pushTodos([todoToSync], listName);
					logger.debug(
						`✅ Tâche "${todoToSync.title}" ${
							newCompleted ? "complétée" : "réactivée"
						} dans Google Tasks`
					);
					// Retirer de la liste des tâches en cours de synchronisation
					syncingTodoIdsRef.current.delete(todo.id);
					setSyncingTodoIds(new Set(syncingTodoIdsRef.current));
					const successMsg = syncMessages.taskCompleted(
						todoToSync.title,
						newCompleted,
						listName
					);
					toast.success(successMsg.title, {
						description: successMsg.description,
					});
				}
			} catch (error) {
				// Retirer de la liste des tâches en cours de synchronisation même en cas d'erreur
				syncingTodoIdsRef.current.delete(todo.id);
				setSyncingTodoIds(new Set(syncingTodoIdsRef.current));
				logger.error(
					"Erreur lors de la synchronisation avec Google Tasks:",
					error
				);
				toast.error("Erreur lors de la synchronisation", {
					description:
						error instanceof Error ? error.message : "Erreur inconnue",
				});
			}
		}
	};

	// Fonction pour gérer le toggle de priorité
	// La priorité est uniquement locale, pas synchronisée avec Google Tasks
	// (l'API Google Tasks ne supporte pas le statut "suivi")
	const handleTogglePriority = (todo: Todo) => {
		togglePriority(todo.id);
	};

	// Fonction de synchronisation avec Google Tasks (définie AVANT le useEffect qui l'utilise)
	// Utilisation de useCallback pour stabiliser la référence de la fonction
	const handleSync = useCallback(async () => {
		if (!googleTasksProvider || !googleTasksProvider.enabled) {
			toast.error(
				"Google Tasks n'est pas connecté. Connectez-vous depuis le header."
			);
			return;
		}

		if (isSyncing) {
			// Éviter les appels multiples simultanés
			return;
		}

		setIsSyncing(true);
		try {
			// 1. D'abord, synchroniser les listes : créer les listes locales manquantes depuis Google Tasks
			let currentLocalLists = getCurrentLists();
			const localListNames = currentLocalLists.map((l) => l.name);
			const missingGoogleLists =
				await googleTasksProvider.getMissingLocalLists(localListNames);

			if (missingGoogleLists.length > 0) {
				logger.debug(
					`📋 ${missingGoogleLists.length} liste(s) Google Tasks trouvée(s) sans correspondance locale`
				);

				for (const googleList of missingGoogleLists) {
					// Déterminer le nom de la liste locale à créer
					// Pour @default, utiliser le titre de la liste Google Tasks (généralement "Mes Tâches")
					const listName =
						googleList.id === "@default"
							? googleList.title || "Mes Tâches"
							: googleList.title;

					// Vérifier à nouveau si la liste n'existe pas déjà (au cas où elle aurait été créée entre temps)
					currentLocalLists = getCurrentLists();
					const listAlreadyExists = currentLocalLists.some(
						(l) => l.name === listName
					);

					if (listAlreadyExists) {
						logger.debug(`ℹ️ Liste "${listName}" existe déjà, ignorée`);
						continue;
					}

					logger.debug(
						`➕ Création de la liste locale: "${listName}" (depuis Google Tasks: ${googleList.title})`
					);
					addList(listName);

					// Attendre que la liste soit créée et que le store soit mis à jour (utilise subscription)
					const newList = await waitForListAdded(listName, 2000);

					if (!newList) {
						logger.warn(
							`⚠️ Liste "${listName}" non trouvée après création (timeout)`
						);
						continue;
					}

					// Récupérer les tâches de cette liste Google Tasks
					// Pour @default, on doit utiliser getOrCreateDefaultTaskList, sinon utiliser le nom
					let pulledTodosFromList: Todo[];
					if (googleList.id === "@default") {
						// Pour @default, on utilise une méthode spéciale qui gère @default
						// On passe undefined pour utiliser la liste par défaut
						pulledTodosFromList = await googleTasksProvider.pullTodos();
					} else {
						// Pour les autres listes, utiliser le nom
						pulledTodosFromList = await googleTasksProvider.pullTodos(listName);
					}

					// Basculer vers la nouvelle liste pour y ajouter les tâches
					const previousListId = currentListId; // Sauvegarder la liste actuelle
					setCurrentList(newList.id);

					// Attendre que le changement de liste soit effectué (utilise subscription)
					const listChanged = await waitForCurrentListChanged(newList.id, 1000);

					if (!listChanged) {
						logger.warn(
							`⚠️ Impossible de basculer vers la liste "${listName}" (timeout)`
						);
						// Revenir à la liste précédente si le changement a échoué
						setCurrentList(previousListId);
						continue;
					}

					// Ajouter les tâches dans la nouvelle liste
					for (const pulledTodo of pulledTodosFromList) {
						addTodo(
							pulledTodo.title,
							pulledTodo.deadline,
							pulledTodo.id,
							pulledTodo.completed,
							pulledTodo.priority,
							pulledTodo.createdAt
						);
					}

					logger.debug(
						`✅ ${pulledTodosFromList.length} tâche(s) ajoutée(s) à la liste "${listName}"`
					);

					// Revenir à la liste précédente après avoir ajouté les tâches
					setCurrentList(previousListId);
					await waitForCurrentListChanged(previousListId, 1000);
				}
			}

			// 2. Ensuite, synchroniser les tâches de la liste actuelle
			// Pull: récupérer les tâches depuis Google Tasks pour la liste actuelle
			// Récupérer le nom de la liste actuelle pour synchroniser depuis la bonne liste Google Tasks
			const currentList = lists.find((l) => l.id === currentListId);
			const listName = currentList?.name;
			const pulledTodos = await googleTasksProvider.pullTodos(listName);

			logger.debug(
				`📥 ${pulledTodos.length} tâche(s) récupérée(s) depuis Google Tasks`
			);

			// Fusionner avec les tâches locales de la liste actuelle (éviter les doublons)
			// Utiliser une fonction callback pour obtenir les todos à jour
			const currentTodos = todos; // Utiliser la valeur courante de todos
			const existingTodoIds = new Set(currentTodos.map((t) => t.id));

			// Vérifier aussi les IDs en cours de synchronisation
			const processingIds = new Set([
				...existingTodoIds,
				...syncingTodoIdsRef.current,
			]);

			let addedCount = 0;
			let updatedCount = 0;

			// Filtrer les tâches déjà présentes ou en cours de traitement pour éviter les doublons
			const todosToAdd = pulledTodos.filter(
				(pulledTodo) => !processingIds.has(pulledTodo.id)
			);

			for (const pulledTodo of todosToAdd) {
				// Vérifier à nouveau avant d'ajouter (double vérification)
				if (!processingIds.has(pulledTodo.id)) {
					// Marquer comme en cours de traitement
					syncingTodoIdsRef.current.add(pulledTodo.id);
					setSyncingTodoIds(new Set(syncingTodoIdsRef.current));

					// Ajouter à la liste locale actuelle avec l'ID Google pour éviter les doublons
					addTodo(
						pulledTodo.title,
						pulledTodo.deadline,
						pulledTodo.id, // Utiliser l'ID Google directement
						pulledTodo.completed,
						pulledTodo.priority,
						pulledTodo.createdAt
					);

					addedCount++;
					logger.debug(
						`✅ Tâche ajoutée: "${pulledTodo.title}"${
							pulledTodo.deadline ? ` (deadline: ${pulledTodo.deadline})` : ""
						}`
					);
				}
			}

			// Mettre à jour les tâches existantes
			const todosToUpdate = pulledTodos.filter((pulledTodo) =>
				existingTodoIds.has(pulledTodo.id)
			);
			for (const pulledTodo of todosToUpdate) {
				const existingTodo = currentTodos.find((t) => t.id === pulledTodo.id);
				if (existingTodo) {
					let needsUpdate = false;
					if (existingTodo.title !== pulledTodo.title) {
						editTodo(pulledTodo.id, pulledTodo.title);
						needsUpdate = true;
					}
					if (existingTodo.deadline !== pulledTodo.deadline) {
						setDeadline(pulledTodo.id, pulledTodo.deadline);
						needsUpdate = true;
					}
					if (existingTodo.completed !== pulledTodo.completed) {
						toggleTodo(pulledTodo.id);
						needsUpdate = true;
					}
					if (needsUpdate) {
						updatedCount++;
						logger.debug(`🔄 Tâche mise à jour: "${pulledTodo.title}"`);
					}
				}
			}

			// Push: envoyer seulement les tâches locales qui n'existent pas encore dans Google Tasks
			// (celles qui n'ont pas d'ID Google, donc pas de préfixe "google-")
			// IMPORTANT: Attendre que les todos soient mis à jour après le pull
			await new Promise((resolve) => setTimeout(resolve, 200)); // Attendre un peu plus pour que les todos soient mis à jour

			// Récupérer les todos mis à jour depuis le store (pour avoir les IDs à jour)
			const updatedTodos = todos;

			// Ne push que les tâches locales qui n'ont pas encore été synchronisées avec Google Tasks
			// (pas de préfixe "google-" dans l'ID)
			// ET qui n'ont pas déjà été créées dans Google Tasks (vérifier via pulledTodos)
			const pulledTodoIds = new Set(pulledTodos.map((t) => t.id));
			const pulledTodoTitles = new Set(
				pulledTodos.map((t) => t.title.toLowerCase().trim())
			);

			const localOnlyTodos = updatedTodos.filter((todo) => {
				// Ne pas inclure si déjà synchronisé avec Google (ID commence par "google-")
				if (todo.id.startsWith("google-")) {
					return false;
				}

				// Ne pas inclure si cette tâche existe déjà dans Google Tasks (via pull)
				// Comparer par ID Google potentiel et par titre (pour éviter les doublons)
				const potentialGoogleId = `google-${todo.id}`;
				if (pulledTodoIds.has(potentialGoogleId)) {
					return false;
				}

				// Vérifier aussi par titre pour éviter les doublons si l'ID a changé
				// (mais seulement si la tâche a une deadline similaire pour éviter les faux positifs)
				const todoTitleLower = todo.title.toLowerCase().trim();
				if (pulledTodoTitles.has(todoTitleLower)) {
					// Vérifier si une tâche avec le même titre existe déjà dans pulledTodos
					const existingPulledTodo = pulledTodos.find(
						(p) => p.title.toLowerCase().trim() === todoTitleLower
					);
					if (existingPulledTodo) {
						// Si les deadlines correspondent (ou toutes les deux absentes), considérer comme doublon
						if (todo.deadline === existingPulledTodo.deadline) {
							logger.debug(
								`⚠️ Tâche "${todo.title}" existe déjà dans Google Tasks, ignorée`
							);
							return false;
						}
					}
				}

				return true;
			});

			if (localOnlyTodos.length > 0) {
				logger.debug(
					`📤 Push de ${localOnlyTodos.length} tâche(s) locale(s) vers Google Tasks`
				);
				// Récupérer le nom de la liste actuelle pour synchroniser dans la bonne liste Google Tasks
				const currentList = lists.find((l) => l.id === currentListId);
				const listName = currentList?.name;
				const idMap = await googleTasksProvider.pushTodos(
					localOnlyTodos,
					listName
				);
				// Mettre à jour les IDs locaux avec les IDs Google créés
				for (const [localId, googleId] of idMap.entries()) {
					updateTodoId(localId, googleId);
					logger.debug(`🔄 ID de tâche mis à jour: ${localId} → ${googleId}`);
				}
			} else {
				logger.debug(`✅ Aucune tâche locale à synchroniser`);
			}

			// Message de succès avec détails - seulement si des changements ont été effectués
			if (addedCount > 0 || updatedCount > 0) {
				const details: string[] = [];
				if (addedCount > 0) {
					details.push(`${addedCount} ajoutée(s)`);
				}
				if (updatedCount > 0) {
					details.push(`${updatedCount} mise(s) à jour`);
				}
				const successMsg = syncMessages.syncCompleted();
				toast.success(successMsg.title, {
					description:
						details.length > 0
							? `${successMsg.description} : ${details.join(", ")}`
							: successMsg.description,
				});
			}
			// Si aucun changement (ajout ou mise à jour), ne pas afficher de toast
		} catch (error) {
			logger.error("Erreur lors de la synchronisation:", error);
			const errorInfo = getSyncError(error);
			toast.error(errorInfo.title, {
				description: errorInfo.description,
			});
		} finally {
			// Nettoyer les IDs en cours de traitement après un court délai
			// Utiliser requestAnimationFrame ou setTimeout avec vérification de l'environnement
			if (typeof window !== "undefined") {
				setTimeout(() => {
					syncingTodoIdsRef.current.clear();
					setSyncingTodoIds(new Set());
				}, 1000);
			} else {
				// En environnement de test, nettoyer immédiatement
				syncingTodoIdsRef.current.clear();
				setSyncingTodoIds(new Set());
			}
			setIsSyncing(false);
		}
	}, [
		googleTasksProvider,
		isSyncing,
		todos,
		addTodo,
		editTodo,
		setDeadline,
		toggleTodo,
	]);

	// Initialiser le provider Google Tasks si Google est connecté
	const providerInitializedRef = useRef(false);
	useEffect(() => {
		const oauthManager = getOAuthManager();

		const checkConnection = () => {
			const connected = oauthManager.isConnected("google");

			if (connected && !providerInitializedRef.current) {
				// Créer le provider si connecté et qu'on n'en a pas encore
				const config: SyncConfig = {
					provider: "google-tasks",
					enabled: true,
					credentials: { token: "oauth" },
				};
				const provider = new GoogleTasksSyncProvider(config);
				setGoogleTasksProvider(provider);
				providerInitializedRef.current = true;
				logger.debug("✅ Google Tasks provider initialisé");
			} else if (!connected && providerInitializedRef.current) {
				// Supprimer le provider si déconnecté
				setGoogleTasksProvider(null);
				providerInitializedRef.current = false;
				logger.debug("❌ Google Tasks provider supprimé");
			}
		};

		// Vérifier immédiatement
		checkConnection();

		// Vérifier périodiquement la connexion (toutes les 2 secondes)
		const connectionInterval = setInterval(checkConnection, 2000);

		return () => clearInterval(connectionInterval);
	}, []);

	// Synchronisation périodique automatique (toutes les 5 minutes si connecté)
	const hasSyncedInitiallyTasksRef = useRef(false);
	const syncIntervalTasksRef = useRef<ReturnType<typeof setInterval> | null>(
		null
	);

	useEffect(() => {
		if (!googleTasksProvider || !googleTasksProvider.enabled) {
			hasSyncedInitiallyTasksRef.current = false;
			return;
		}

		// Synchroniser une seule fois après création du provider
		if (!hasSyncedInitiallyTasksRef.current) {
			hasSyncedInitiallyTasksRef.current = true;

			const initialSync = setTimeout(async () => {
				if (!isSyncing) {
					try {
						await handleSync();
					} catch (error) {
						logger.error("Erreur lors de la synchronisation initiale:", error);
					}
				}
			}, SYNC_INTERVALS.INITIAL_DELAY);

			// Puis synchroniser toutes les X minutes
			syncIntervalTasksRef.current = setInterval(async () => {
				if (googleTasksProvider && googleTasksProvider.enabled && !isSyncing) {
					try {
						logger.debug("🔄 Synchronisation automatique Google Tasks...");
						await handleSync();
					} catch (error) {
						logger.error(
							"Erreur lors de la synchronisation périodique:",
							error
						);
					}
				}
			}, SYNC_INTERVALS.GOOGLE_TASKS);

			return () => {
				clearTimeout(initialSync);
				if (syncIntervalTasksRef.current) {
					clearInterval(syncIntervalTasksRef.current);
					syncIntervalTasksRef.current = null;
				}
			};
		}

		return () => {
			if (syncIntervalTasksRef.current) {
				clearInterval(syncIntervalTasksRef.current);
				syncIntervalTasksRef.current = null;
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [googleTasksProvider]); // Seulement quand le provider change

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

	const confirmDelete = async () => {
		if (todoToDelete) {
			const todo = todos.find((t) => t.id === todoToDelete);

			// Synchroniser la suppression avec Google Tasks si connecté
			if (googleTasksProvider && googleTasksProvider.enabled && todo) {
				try {
					// Marquer la tâche comme en cours de synchronisation
					syncingTodoIdsRef.current.add(todoToDelete);
					setSyncingTodoIds(new Set(syncingTodoIdsRef.current));

					// Si la tâche a un ID Google, supprimer directement depuis la bonne liste Google Tasks
					if (todo.id.startsWith("google-")) {
						// Récupérer le nom de la liste actuelle pour supprimer de la bonne liste Google Tasks
						const currentList = lists.find((l) => l.id === currentListId);
						const listName = currentList?.name;
						await googleTasksProvider.deleteTask(todo.id, listName);
						logger.debug(`✅ Tâche "${todo.title}" supprimée de Google Tasks`);
					}
					// Retirer de la liste des tâches en cours de synchronisation
					syncingTodoIdsRef.current.delete(todoToDelete);
					setSyncingTodoIds(new Set(syncingTodoIdsRef.current));
				} catch (error) {
					// Retirer de la liste des tâches en cours de synchronisation même en cas d'erreur
					syncingTodoIdsRef.current.delete(todoToDelete);
					setSyncingTodoIds(new Set(syncingTodoIdsRef.current));
					// Si c'est une erreur d'authentification, informer l'utilisateur
					const errorMessage =
						error instanceof Error ? error.message : "Erreur inconnue";
					if (
						errorMessage.includes("Token invalide") ||
						errorMessage.includes("expiré")
					) {
						logger.error(
							"Erreur d'authentification lors de la suppression sur Google Tasks:",
							error
						);
						const warningMsg = syncWarnings.taskDeletedLocally(
							"La suppression sur Google Tasks a échoué (token expiré). Veuillez vous reconnecter."
						);
						toast.warning(warningMsg.title, {
							description: warningMsg.description,
						});
					} else {
						logger.error(
							"Erreur lors de la suppression sur Google Tasks:",
							error
						);
						const errorInfo = getSyncError(error);
						const warningMsg = syncWarnings.taskDeletedLocally(
							errorInfo.description
						);
						toast.warning(warningMsg.title, {
							description: warningMsg.description,
						});
					}
				}
			}

			// Toujours supprimer localement, même si Google Tasks échoue
			deleteTodo(todoToDelete);
			if (todo) {
				const currentList = lists.find((l) => l.id === currentListId);
				const listName = currentList?.name;
				const successMsg = syncMessages.taskDeleted(todo.title, listName);
				toast.success(successMsg.title, {
					description: successMsg.description,
				});
			} else {
				toast.success("Tâche supprimée");
			}
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
	const isCompact = size === "compact";
	const isMedium = size === "medium";
	const isFull = size === "full";

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

	const padding = isCompact ? "p-1.5" : isMedium ? "p-3" : "p-4";
	const gap = isCompact ? "gap-1" : isMedium ? "gap-2" : "gap-3";

	return (
		<TooltipProvider>
			<Card
				ref={cardRef}
				className={`w-full h-full max-w-none ${padding} flex flex-col ${gap} ${
					isCompact ? "overflow-hidden" : "overflow-auto"
				} min-h-0 relative transition-colors ${
					isDragging ? "border-2 border-primary bg-primary/5" : ""
				}`}
			>
				{/* COMPACT VERSION - Ultra compacte */}
				{isCompact ? (
					<>
						{/* Header : Liste + stats */}
						<div className='flex items-center justify-between text-sm'>
							<span className='font-medium truncate'>
								{currentList?.name || "Liste"}
							</span>
							<div className='flex gap-2 text-muted-foreground shrink-0 text-xs'>
								<span>{activeCount} actives</span>
								{priorityCount > 0 && <span>{priorityCount} ⭐</span>}
							</div>
						</div>

						{/* Progress bar fine */}
						{totalCount > 0 && (
							<Progress value={progressPercentage} className='h-1' />
						)}

						{/* Liste des tâches (max 4-5 visibles) */}
						<div className='flex-1 overflow-y-auto min-h-0'>
							<div className='flex flex-col gap-1'>
								{filtered.slice(0, 5).length === 0 ? (
									<motion.div
										key='empty'
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										className='text-center text-muted-foreground py-2 text-xs'
									>
										Aucune tâche
									</motion.div>
								) : (
									filtered.slice(0, 5).map((todo) => {
										const deadlineStatus = getDeadlineStatus(todo.deadline);
										return (
											<motion.div
												key={todo.id}
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
													onCheckedChange={() => toggleTodo(todo.id)}
													onMouseDown={(e: React.MouseEvent) => {
														e.stopPropagation();
													}}
													onDragStart={(e: React.DragEvent) => {
														e.preventDefault();
														e.stopPropagation();
													}}
													className='h-4 w-4 shrink-0'
													aria-label={
														todo.completed
															? "Marquer comme non terminé"
															: "Marquer comme terminé"
													}
												/>
												<div className='flex-1 min-w-0'>
													{editingId === todo.id ? (
														<div
															className='flex flex-col gap-1'
															data-editing-todo={todo.id}
														>
															<Input
																ref={editInputRef}
																value={editingValue}
																onChange={(
																	e: React.ChangeEvent<HTMLInputElement>
																) => setEditingValue(e.target.value)}
																onKeyDown={(
																	e: React.KeyboardEvent<HTMLInputElement>
																) => {
																	if (e.key === "Enter") {
																		saveEdit(todo.id);
																	} else if (e.key === "Escape") {
																		cancelEdit();
																	}
																}}
																onMouseDown={(e: React.MouseEvent) => {
																	e.stopPropagation();
																}}
																onDragStart={(e: React.DragEvent) => {
																	e.preventDefault();
																	e.stopPropagation();
																}}
																className='flex-1 h-6 text-xs'
															/>
															{/* Champ deadline dans l'édition compacte */}
															<div className='flex gap-1 items-center'>
																<Popover>
																	<PopoverTrigger asChild>
																		<Button
																			variant='outline'
																			size='sm'
																			className='flex-1 justify-start text-left font-normal h-6 text-[10px] px-2'
																			onMouseDown={(e: React.MouseEvent) => {
																				e.stopPropagation();
																			}}
																			onDragStart={(e: React.DragEvent) => {
																				e.preventDefault();
																				e.stopPropagation();
																			}}
																		>
																			<Calendar className='mr-1 h-2.5 w-2.5' />
																			{editingDeadline ? (
																				format(editingDeadline, "PPP", {
																					locale: fr,
																				})
																			) : (
																				<span className='text-muted-foreground text-[10px]'>
																					Date limite
																				</span>
																			)}
																		</Button>
																	</PopoverTrigger>
																	<PopoverContent
																		className='w-auto p-0'
																		align='start'
																		onMouseDown={(e: React.MouseEvent) => {
																			e.stopPropagation();
																		}}
																		onDragStart={(e: React.DragEvent) => {
																			e.preventDefault();
																			e.stopPropagation();
																		}}
																	>
																		<DatePicker
																			selected={editingDeadline}
																			onSelect={setEditingDeadline}
																			captionLayout='dropdown'
																		/>
																	</PopoverContent>
																</Popover>
																{editingDeadline && (
																	<Button
																		type='button'
																		variant='ghost'
																		size='sm'
																		className='h-6 px-1.5 text-[10px] shrink-0'
																		onClick={() =>
																			setEditingDeadline(undefined)
																		}
																		onMouseDown={(e: React.MouseEvent) => {
																			e.stopPropagation();
																		}}
																		onDragStart={(e: React.DragEvent) => {
																			e.preventDefault();
																			e.stopPropagation();
																		}}
																		aria-label='Supprimer la date limite'
																	>
																		×
																	</Button>
																)}
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
																onDoubleClick={(e) => {
																	e.stopPropagation();
																	startEdit(todo);
																}}
																onMouseDown={(e: React.MouseEvent) => {
																	e.stopPropagation();
																}}
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
															{/* Indicateur de synchronisation */}
															{googleTasksProvider?.enabled &&
																syncingTodoIds.has(todo.id) && (
																	<Tooltip>
																		<TooltipTrigger asChild>
																			<div className='flex items-center ml-1'>
																				<Spinner className='size-3 text-blue-500' />
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
												<div className='opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1'>
													{/* Bouton pour créer un événement depuis un todo avec deadline */}
													{todo.deadline && !todo.completed && (
														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	variant='ghost'
																	size='icon'
																	className='h-5 w-5'
																	onClick={(e) => {
																		e.stopPropagation();
																		// Fonction supprimée : plus de synchronisation Calendar/Todo
																	}}
																	onMouseDown={(e: React.MouseEvent) => {
																		e.stopPropagation();
																	}}
																	onDragStart={(e: React.DragEvent) => {
																		e.preventDefault();
																		e.stopPropagation();
																	}}
																	aria-label='Créer un événement calendrier'
																>
																	<Calendar className='h-3 w-3 text-blue-500' />
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																<p>Créer un événement dans le calendrier</p>
															</TooltipContent>
														</Tooltip>
													)}
													<Button
														variant='ghost'
														size='icon'
														className='h-5 w-5 shrink-0'
														onClick={(e) => {
															e.stopPropagation();
															handleDeleteClick(todo.id);
														}}
														onMouseDown={(e: React.MouseEvent) => {
															e.stopPropagation();
														}}
														onDragStart={(e: React.DragEvent) => {
															e.preventDefault();
															e.stopPropagation();
														}}
														aria-label='Supprimer'
													>
														×
													</Button>
												</div>
											</motion.div>
										);
									})
								)}
								{filtered.length > 5 && (
									<div className='text-center text-xs text-muted-foreground pt-1'>
										+{filtered.length - 5} autres...
									</div>
								)}
							</div>
						</div>

						{/* Input ajout compact */}
						<form onSubmit={handleAddTodo} className='flex gap-1.5 mt-1.5'>
							<Input
								ref={inputRef}
								placeholder='Nouvelle tâche...'
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
								className='flex-1 h-7 text-sm'
								aria-label='Nouvelle tâche'
							/>
							<Button
								type='submit'
								size='sm'
								className='h-7 px-2'
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								+
							</Button>
						</form>
					</>
				) : (
					<>
						{/* List selector - medium et full */}
						{isMedium ? (
							<div className='flex items-center justify-between'>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant='outline'
											size='sm'
											className='flex items-center gap-1.5'
											onMouseDown={(e: React.MouseEvent) => {
												e.stopPropagation();
											}}
											onDragStart={(e: React.DragEvent) => {
												e.preventDefault();
												e.stopPropagation();
											}}
										>
											<Folder className='h-3.5 w-3.5' />
											<span className='text-xs'>
												{currentList?.name || "Liste"}
											</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='start' className='w-48'>
										<DropdownMenuLabel>Listes</DropdownMenuLabel>
										<DropdownMenuSeparator />
										{lists.map((list) => (
											<DropdownMenuItem
												key={list.id}
												onClick={() => setCurrentList(list.id)}
												onMouseDown={(e: React.MouseEvent) => {
													e.stopPropagation();
												}}
												onDragStart={(e: React.DragEvent) => {
													e.preventDefault();
													e.stopPropagation();
												}}
											>
												{list.name}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
								<ButtonGroup aria-label='Actions essentielles'>
									{googleTasksProvider && googleTasksProvider.enabled && (
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant='ghost'
													size='icon'
													className='h-7 w-7'
													onClick={handleSync}
													disabled={isSyncing}
													onMouseDown={(e: React.MouseEvent) => {
														e.stopPropagation();
													}}
													onDragStart={(e: React.DragEvent) => {
														e.preventDefault();
														e.stopPropagation();
													}}
													aria-label='Synchroniser avec Google Tasks'
												>
													<RefreshCw
														className={cn(
															"h-3.5 w-3.5",
															isSyncing && "animate-spin"
														)}
													/>
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												<p>
													{isSyncing
														? "Synchronisation en cours..."
														: "Synchroniser avec Google Tasks"}
												</p>
											</TooltipContent>
										</Tooltip>
									)}
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant='ghost'
												size='icon'
												className='h-7 w-7'
												onClick={exportTodos}
												onMouseDown={(e: React.MouseEvent) => {
													e.stopPropagation();
												}}
												onDragStart={(e: React.DragEvent) => {
													e.preventDefault();
													e.stopPropagation();
												}}
												aria-label='Exporter'
											>
												<Download className='h-3.5 w-3.5' />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>Exporter</p>
										</TooltipContent>
									</Tooltip>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant='ghost'
												size='icon'
												className='h-7 w-7'
												onClick={undo}
												disabled={!canUndo}
												onMouseDown={(e: React.MouseEvent) => {
													e.stopPropagation();
												}}
												onDragStart={(e: React.DragEvent) => {
													e.preventDefault();
													e.stopPropagation();
												}}
												aria-label='Annuler'
											>
												<Undo2 className='h-3.5 w-3.5' />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>Annuler</p>
										</TooltipContent>
									</Tooltip>
									<input
										ref={fileInputRef}
										type='file'
										accept='.json'
										onChange={handleFileInputChange}
										className='hidden'
									/>
								</ButtonGroup>
							</div>
						) : (
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
											<Button
												size='sm'
												onClick={handleAddList}
												onMouseDown={(e: React.MouseEvent) => {
													e.stopPropagation();
												}}
												onDragStart={(e: React.DragEvent) => {
													e.preventDefault();
													e.stopPropagation();
												}}
											>
												Ajouter
											</Button>
											<Button
												size='sm'
												variant='ghost'
												onClick={() => {
													setShowNewList(false);
													setNewListName("");
												}}
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
										</div>
									) : (
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant='outline'
													className='flex items-center gap-2'
													onMouseDown={(e: React.MouseEvent) => {
														e.stopPropagation();
													}}
													onDragStart={(e: React.DragEvent) => {
														e.preventDefault();
														e.stopPropagation();
													}}
												>
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
																	onChange={(e) =>
																		setEditingListName(e.target.value)
																	}
																	onKeyDown={(e) => {
																		if (e.key === "Enter")
																			handleRenameList(list.id);
																		if (e.key === "Escape") {
																			setEditingListId(null);
																			setEditingListName("");
																		}
																	}}
																	onBlur={() => handleRenameList(list.id)}
																	onMouseDown={(e: React.MouseEvent) => {
																		e.stopPropagation();
																	}}
																	onDragStart={(e: React.DragEvent) => {
																		e.preventDefault();
																		e.stopPropagation();
																	}}
																	className='h-7 text-sm'
																	autoFocus
																/>
															</div>
														) : (
															<>
																<button
																	onClick={() => setCurrentList(list.id)}
																	onMouseDown={(e: React.MouseEvent) => {
																		e.stopPropagation();
																	}}
																	onDragStart={(e: React.DragEvent) => {
																		e.preventDefault();
																		e.stopPropagation();
																	}}
																	className={`flex-1 text-left text-sm ${
																		list.id === currentListId
																			? "font-semibold"
																			: ""
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
																		onMouseDown={(e: React.MouseEvent) => {
																			e.stopPropagation();
																		}}
																		onDragStart={(e: React.DragEvent) => {
																			e.preventDefault();
																			e.stopPropagation();
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
																			onMouseDown={(e: React.MouseEvent) => {
																				e.stopPropagation();
																			}}
																			onDragStart={(e: React.DragEvent) => {
																				e.preventDefault();
																				e.stopPropagation();
																			}}
																		>
																			<X className='h-3 w-3' />
																		</Button>
																	)}
																</div>
															</>
														)}
													</div>
												))}
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onClick={() => setShowNewList(true)}
													onMouseDown={(e: React.MouseEvent) => {
														e.stopPropagation();
													}}
													onDragStart={(e: React.DragEvent) => {
														e.preventDefault();
														e.stopPropagation();
													}}
												>
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
													onMouseDown={(e: React.MouseEvent) => {
														e.stopPropagation();
													}}
													onDragStart={(e: React.DragEvent) => {
														e.preventDefault();
														e.stopPropagation();
													}}
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
													onMouseDown={(e: React.MouseEvent) => {
														e.stopPropagation();
													}}
													onDragStart={(e: React.DragEvent) => {
														e.preventDefault();
														e.stopPropagation();
													}}
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
													onMouseDown={(e: React.MouseEvent) => {
														e.stopPropagation();
													}}
													onDragStart={(e: React.DragEvent) => {
														e.preventDefault();
														e.stopPropagation();
													}}
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
													onMouseDown={(e: React.MouseEvent) => {
														e.stopPropagation();
													}}
													onDragStart={(e: React.DragEvent) => {
														e.preventDefault();
														e.stopPropagation();
													}}
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
													onMouseDown={(e: React.MouseEvent) => {
														e.stopPropagation();
													}}
													onDragStart={(e: React.DragEvent) => {
														e.preventDefault();
														e.stopPropagation();
													}}
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
													disabled={isSyncing || !googleTasksProvider}
													onMouseDown={(e: React.MouseEvent) => {
														e.stopPropagation();
													}}
													onDragStart={(e: React.DragEvent) => {
														e.preventDefault();
														e.stopPropagation();
													}}
													aria-label='Synchroniser avec Google Tasks'
												>
													<RefreshCw
														className={`h-4 w-4 ${
															isSyncing ? "animate-spin" : ""
														}`}
													/>
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												<p>
													{isSyncing
														? "Synchronisation en cours..."
														: googleTasksProvider
														? "Synchroniser avec Google Tasks"
														: "Connectez Google depuis le header pour synchroniser"}
												</p>
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
						)}
					</>
				)}

				{/* Drag & drop overlay - affiché seulement si pas compact */}
				{!isCompact && isDragging && (
					<div className='absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-50'>
						<div className='text-center'>
							<Upload className='h-8 w-8 mx-auto mb-2 text-primary' />
							<p className='text-sm font-medium'>Déposez le fichier JSON ici</p>
						</div>
					</div>
				)}

				{/* MEDIUM VERSION */}
				{isMedium && (
					<>
						{/* Stats compactes */}
						{totalCount > 0 && (
							<div className='space-y-2'>
								<div className='flex items-center justify-between text-xs'>
									<span className='text-muted-foreground'>Progression</span>
									<span className='font-medium'>{progressPercentage}%</span>
								</div>
								<Progress value={progressPercentage} className='h-1.5' />
								<div className='flex gap-3 text-xs text-muted-foreground'>
									<span>{activeCount} actives</span>
									<span>{completedCount} terminées</span>
									{priorityCount > 0 && <span>{priorityCount} ⭐</span>}
									{overdueCount > 0 && (
										<span className='text-red-600 font-medium'>
											{overdueCount} en retard
										</span>
									)}
								</div>
							</div>
						)}

						{/* Recherche (icône) */}
						<TodoSearchBar
							searchQuery={searchQuery}
							setSearchQuery={setSearchQuery}
							size='medium'
						/>

						{/* Input ajout */}
						<TodoAddForm
							onSubmit={(title, deadline) => {
								// Appeler directement addTodo avec les valeurs
								if (title.trim()) {
									// Convertir deadline string en Date si nécessaire
									if (deadline) {
										const deadlineDate = new Date(deadline);
										setNewTodoDeadline(deadlineDate);
										setShowNewDeadline(true);
									}
									// Appeler addTodo directement
									addTodo(title, deadline);
								}
							}}
							size='medium'
						/>

						{/* Filtres compacts */}
						<TodoFilters filter={filter} setFilter={setFilter} size='medium' />

						{/* Liste des tâches */}
						{filtered.length === 0 ? (
							<motion.div
								key='empty'
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className='text-center text-muted-foreground py-4 text-xs'
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
						) : shouldVirtualize(filtered.length) ? (
							<VirtualizedList
								items={filtered}
								renderItem={(todo) => (
									<TodoItem
										key={todo.id}
										todo={todo}
										editingId={editingId}
										editingValue={editingValue}
										editingDeadline={editingDeadline}
										deadlinePickerOpen={deadlinePickerOpen}
										onToggle={handleToggleTodo}
										onDelete={handleDeleteClick}
										onStartEdit={startEdit}
										onEditValueChange={setEditingValue}
										onEditDeadlineChange={setEditingDeadline}
										onSaveEdit={saveEdit}
										onCancelEdit={cancelEdit}
										onToggleDeadlinePicker={setDeadlinePickerOpen}
										onTogglePriority={handleTogglePriority}
										isSyncing={syncingTodoIds.has(todo.id)}
										editInputRef={editInputRef}
									/>
								)}
								containerHeight='100%'
								className='flex-1'
								widgetSize='medium'
							/>
						) : (
							<div className='flex-1 overflow-y-auto min-h-0'>
								<div className='flex flex-col gap-1.5'>
									{filtered.map((todo) => (
										<TodoItem
											key={todo.id}
											todo={todo}
											editingId={editingId}
											editingValue={editingValue}
											editingDeadline={editingDeadline}
											deadlinePickerOpen={deadlinePickerOpen}
											onToggle={handleToggleTodo}
											onDelete={handleDeleteClick}
											onStartEdit={startEdit}
											onEditValueChange={setEditingValue}
											onEditDeadlineChange={setEditingDeadline}
											onSaveEdit={saveEdit}
											onCancelEdit={cancelEdit}
											onToggleDeadlinePicker={setDeadlinePickerOpen}
											onTogglePriority={handleTogglePriority}
											isSyncing={syncingTodoIds.has(todo.id)}
											editInputRef={editInputRef}
										/>
									))}
								</div>
							</div>
						)}
					</>
				)}

				{/* FULL VERSION */}
				{isFull && (
					<>
						{/* Stats */}
						<TodoStats
							totalCount={totalCount}
							activeCount={activeCount}
							completedCount={completedCount}
							priorityCount={priorityCount}
							overdueCount={overdueCount}
							progressPercentage={progressPercentage}
							size='full'
							chartConfig={chartConfig}
							statusChartData={statusChartData}
							priorityChartData={priorityChartData}
						/>

						{/* Recherche complète */}
						<TodoSearchBar
							searchQuery={searchQuery}
							setSearchQuery={setSearchQuery}
							size='full'
						/>

						{/* Input ajout avec deadline */}
						<form onSubmit={handleAddTodo} className='flex flex-col gap-2'>
							<div className='flex gap-2'>
								<Input
									ref={inputRef}
									placeholder='Ajouter une tâche...'
									onMouseDown={(e: React.MouseEvent) => {
										e.stopPropagation();
									}}
									onDragStart={(e: React.DragEvent) => {
										e.preventDefault();
										e.stopPropagation();
									}}
									className='flex-1'
									aria-label='Nouvelle tâche'
								/>
								<Button
									type='submit'
									onMouseDown={(e: React.MouseEvent) => {
										e.stopPropagation();
									}}
									onDragStart={(e: React.DragEvent) => {
										e.preventDefault();
										e.stopPropagation();
									}}
								>
									Ajouter
								</Button>
							</div>
							{showNewDeadline ? (
								<div className='flex gap-2 items-center'>
									<Popover
										open={newTodoDeadlinePickerOpen}
										onOpenChange={setNewTodoDeadlinePickerOpen}
									>
										<PopoverTrigger asChild>
											<Button
												variant='outline'
												className='flex-1 justify-start text-left font-normal'
												onMouseDown={(e: React.MouseEvent) => {
													e.stopPropagation();
												}}
												onDragStart={(e: React.DragEvent) => {
													e.preventDefault();
													e.stopPropagation();
												}}
											>
												<Calendar className='mr-2 h-4 w-4' />
												{newTodoDeadline ? (
													format(newTodoDeadline, "PPP", { locale: fr })
												) : (
													<span className='text-muted-foreground'>
														Sélectionner une date
													</span>
												)}
											</Button>
										</PopoverTrigger>
										<PopoverContent
											className='w-auto p-0'
											align='start'
											onMouseDown={(e: React.MouseEvent) => {
												e.stopPropagation();
											}}
											onDragStart={(e: React.DragEvent) => {
												e.preventDefault();
												e.stopPropagation();
											}}
										>
											<DatePicker
												selected={newTodoDeadline}
												onSelect={(date) => {
													setNewTodoDeadline(date);
													// Fermer le Popover après la sélection
													if (date) {
														setNewTodoDeadlinePickerOpen(false);
													}
												}}
												captionLayout='dropdown'
											/>
										</PopoverContent>
									</Popover>
									<Button
										type='button'
										variant='ghost'
										size='sm'
										onClick={() => {
											setShowNewDeadline(false);
											setNewTodoDeadline(undefined);
										}}
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
								</div>
							) : (
								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={() => setShowNewDeadline(true)}
									className='w-fit'
									onMouseDown={(e: React.MouseEvent) => {
										e.stopPropagation();
									}}
									onDragStart={(e: React.DragEvent) => {
										e.preventDefault();
										e.stopPropagation();
									}}
								>
									<Calendar className='h-4 w-4 mr-2' />
									Ajouter une date limite
								</Button>
							)}
						</form>

						{/* Filtres complets */}
						<TodoFilters filter={filter} setFilter={setFilter} size='full' />

						{/* Liste complète */}
						{filtered.length === 0 ? (
							<motion.div
								key='empty'
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className='text-center text-muted-foreground py-8 text-sm'
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
						) : shouldVirtualize(filtered.length) ? (
							<VirtualizedList
								items={filtered}
								renderItem={(todo) => (
									<TodoItem
										key={todo.id}
										todo={todo}
										editingId={editingId}
										editingValue={editingValue}
										editingDeadline={editingDeadline}
										deadlinePickerOpen={deadlinePickerOpen}
										onToggle={handleToggleTodo}
										onDelete={handleDeleteClick}
										onStartEdit={startEdit}
										onEditValueChange={setEditingValue}
										onEditDeadlineChange={setEditingDeadline}
										onSaveEdit={saveEdit}
										onCancelEdit={cancelEdit}
										onToggleDeadlinePicker={setDeadlinePickerOpen}
										onTogglePriority={handleTogglePriority}
										isSyncing={syncingTodoIds.has(todo.id)}
										editInputRef={editInputRef}
									/>
								)}
								containerHeight='400px'
								className='min-h-[200px]'
								widgetSize='full'
							/>
						) : (
							<div className='flex flex-col gap-2 min-h-[200px] max-h-[400px] overflow-y-auto'>
								{filtered.map((todo) => (
									<TodoItem
										key={todo.id}
										todo={todo}
										editingId={editingId}
										editingValue={editingValue}
										editingDeadline={editingDeadline}
										deadlinePickerOpen={deadlinePickerOpen}
										onToggle={handleToggleTodo}
										onDelete={handleDeleteClick}
										onStartEdit={startEdit}
										onEditValueChange={setEditingValue}
										onEditDeadlineChange={setEditingDeadline}
										onSaveEdit={saveEdit}
										onCancelEdit={cancelEdit}
										onToggleDeadlinePicker={setDeadlinePickerOpen}
										onTogglePriority={handleTogglePriority}
										isSyncing={syncingTodoIds.has(todo.id)}
										editInputRef={editInputRef}
									/>
								))}
							</div>
						)}
					</>
				)}

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
								variant='destructive'
								onClick={confirmDelete}
								onMouseDown={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
								onDragStart={(e: React.DragEvent) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								Supprimer
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</Card>
		</TooltipProvider>
	);
}

export const TodoWidget = memo(TodoWidgetComponent);

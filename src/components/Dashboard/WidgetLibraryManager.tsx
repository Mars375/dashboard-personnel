import { useState, useEffect, memo } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ExternalLink, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { widgetLibrary } from "@/lib/widgetLibrary";
import type { ExternalWidgetDefinition, WidgetLibraryDefinition } from "@/lib/widgetLibrary/types";
import { validateWidget } from "@/lib/widgetLibrary/widgetValidator";

interface WidgetLibraryManagerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function WidgetLibraryManagerComponent({ open, onOpenChange }: WidgetLibraryManagerProps) {
	const [widgets, setWidgets] = useState<WidgetLibraryDefinition[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	// Dialog pour ajouter un widget
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [newWidget, setNewWidget] = useState<Partial<ExternalWidgetDefinition>>({
		id: "",
		name: "",
		description: "",
		moduleUrl: "",
		defaultSize: { w: 4, h: 4 },
		minSize: { w: 2, h: 2 },
	});

	// Dialog pour charger une bibliothèque
	const [isLibraryDialogOpen, setIsLibraryDialogOpen] = useState(false);
	const [libraryUrl, setLibraryUrl] = useState("");

	// Charger les widgets et bibliothèques
	useEffect(() => {
		if (open) {
			loadData();
		}
	}, [open]);

	const loadData = () => {
		const externalWidgets = widgetLibrary.getExternalWidgets();
		setWidgets(externalWidgets.map((w) => ({ ...w })));
		// TODO: Charger les bibliothèques depuis le storage
	};

	const handleAddWidget = async () => {
		setError(null);
		setSuccess(null);

		// Valider
		const validation = validateWidget(newWidget as ExternalWidgetDefinition);
		if (!validation.valid) {
			const errors = validation.errors.map((e) => `${e.field}: ${e.message}`).join("\n");
			setError(`Erreurs de validation:\n${errors}`);
			return;
		}

		setLoading(true);
		try {
			await widgetLibrary.addCustomWidget(newWidget as ExternalWidgetDefinition);
			setSuccess("Widget ajouté avec succès!");
			setNewWidget({
				id: "",
				name: "",
				description: "",
				moduleUrl: "",
				defaultSize: { w: 4, h: 4 },
				minSize: { w: 2, h: 2 },
			});
			setIsAddDialogOpen(false);
			loadData();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de l'ajout du widget");
		} finally {
			setLoading(false);
		}
	};

	const handleRemoveWidget = async (widgetId: string) => {
		if (!confirm(`Supprimer le widget "${widgetId}"?`)) return;

		setError(null);
		setSuccess(null);
		try {
			widgetLibrary.removeCustomWidget(widgetId);
			setSuccess("Widget supprimé avec succès!");
			loadData();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
		}
	};

	const handleLoadLibrary = async () => {
		if (!libraryUrl.trim()) {
			setError("Veuillez entrer une URL");
			return;
		}

		setError(null);
		setSuccess(null);
		setLoading(true);
		try {
			await widgetLibrary.loadLibraryFromUrl(libraryUrl);
			setSuccess("Bibliothèque chargée avec succès!");
			setLibraryUrl("");
			setIsLibraryDialogOpen(false);
			loadData();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors du chargement de la bibliothèque");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Gestionnaire de Bibliothèque de Widgets</DialogTitle>
						<DialogDescription>
							Gérez vos widgets personnalisés et bibliothèques externes
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						{error && (
							<div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
								<div className="flex items-center gap-2">
									<AlertCircle className="h-4 w-4" />
									<span>{error}</span>
								</div>
							</div>
						)}

						{success && (
							<div className="rounded-md border border-green-500 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
								<div className="flex items-center gap-2">
									<CheckCircle2 className="h-4 w-4" />
									<span>{success}</span>
								</div>
							</div>
						)}

						<div className="flex gap-2">
							<Button onClick={() => setIsAddDialogOpen(true)}>
								<Plus className="h-4 w-4 mr-2" />
								Ajouter un widget
							</Button>
							<Button variant="outline" onClick={() => setIsLibraryDialogOpen(true)}>
								<ExternalLink className="h-4 w-4 mr-2" />
								Charger une bibliothèque
							</Button>
						</div>

						<div>
							<h3 className="text-sm font-semibold mb-2">Widgets personnalisés ({widgets.length})</h3>
							{widgets.length === 0 ? (
								<p className="text-sm text-muted-foreground">Aucun widget personnalisé</p>
							) : (
								<div className="border rounded-md">
									<div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/50">
										<div className="font-semibold text-sm">ID</div>
										<div className="font-semibold text-sm">Nom</div>
										<div className="font-semibold text-sm">Description</div>
										<div className="font-semibold text-sm">Statut</div>
										<div className="font-semibold text-sm">Actions</div>
									</div>
									<div className="divide-y">
										{widgets.map((widget) => (
											<div key={widget.id} className="grid grid-cols-5 gap-4 p-4 items-center">
												<div className="font-mono text-xs">{widget.id}</div>
												<div>{widget.name}</div>
												<div className="max-w-xs truncate">{widget.description}</div>
												<div>
													{widget.status === "loading" && (
														<Badge variant="secondary">
															<Loader2 className="h-3 w-3 mr-1 animate-spin" />
															Chargement
														</Badge>
													)}
													{widget.status === "loaded" && (
														<Badge variant="default" className="bg-green-600">
															<CheckCircle2 className="h-3 w-3 mr-1" />
															Chargé
														</Badge>
													)}
													{widget.status === "error" && (
														<Badge variant="destructive">
															<AlertCircle className="h-3 w-3 mr-1" />
															Erreur
														</Badge>
													)}
												</div>
												<div>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => handleRemoveWidget(widget.id)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Fermer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog pour ajouter un widget */}
			<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Ajouter un widget personnalisé</DialogTitle>
						<DialogDescription>
							Entrez les informations du widget à ajouter
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<Label htmlFor="widget-id">ID *</Label>
							<Input
								id="widget-id"
								value={newWidget.id}
								onChange={(e) => setNewWidget({ ...newWidget, id: e.target.value })}
								placeholder="mon-widget"
							/>
						</div>

						<div>
							<Label htmlFor="widget-name">Nom *</Label>
							<Input
								id="widget-name"
								value={newWidget.name}
								onChange={(e) => setNewWidget({ ...newWidget, name: e.target.value })}
								placeholder="Mon Widget"
							/>
						</div>

						<div>
							<Label htmlFor="widget-description">Description *</Label>
							<Textarea
								id="widget-description"
								value={newWidget.description}
								onChange={(e) => setNewWidget({ ...newWidget, description: e.target.value })}
								placeholder="Description du widget"
							/>
						</div>

						<div>
							<Label htmlFor="widget-module-url">URL du module *</Label>
							<Input
								id="widget-module-url"
								value={newWidget.moduleUrl}
								onChange={(e) => setNewWidget({ ...newWidget, moduleUrl: e.target.value })}
								placeholder="https://example.com/widget.js"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="widget-default-w">Largeur par défaut</Label>
								<Input
									id="widget-default-w"
									type="number"
									value={newWidget.defaultSize?.w}
									onChange={(e) =>
										setNewWidget({
											...newWidget,
											defaultSize: { ...newWidget.defaultSize!, w: parseInt(e.target.value) || 4 },
										})
									}
								/>
							</div>
							<div>
								<Label htmlFor="widget-default-h">Hauteur par défaut</Label>
								<Input
									id="widget-default-h"
									type="number"
									value={newWidget.defaultSize?.h}
									onChange={(e) =>
										setNewWidget({
											...newWidget,
											defaultSize: { ...newWidget.defaultSize!, h: parseInt(e.target.value) || 4 },
										})
									}
								/>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
							Annuler
						</Button>
						<Button onClick={handleAddWidget} disabled={loading}>
							{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
							Ajouter
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog pour charger une bibliothèque */}
			<Dialog open={isLibraryDialogOpen} onOpenChange={setIsLibraryDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Charger une bibliothèque de widgets</DialogTitle>
						<DialogDescription>
							Entrez l'URL d'une bibliothèque de widgets au format JSON
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<Label htmlFor="library-url">URL de la bibliothèque</Label>
							<Input
								id="library-url"
								value={libraryUrl}
								onChange={(e) => setLibraryUrl(e.target.value)}
								placeholder="https://example.com/widget-library.json"
							/>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setIsLibraryDialogOpen(false)}>
							Annuler
						</Button>
						<Button onClick={handleLoadLibrary} disabled={loading}>
							{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
							Charger
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

export const WidgetLibraryManager = memo(WidgetLibraryManagerComponent);


import type { Todo } from "@/store/todoStorage";

export interface SyncProvider {
	name: string;
	enabled: boolean;
	sync: () => Promise<SyncResult>;
	pushTodos: (todos: Todo[], listId?: string) => Promise<Map<string, string> | void>;
	pullTodos: (listId: string) => Promise<Todo[]>;
}

export interface SyncResult {
	success: boolean;
	message: string;
	todosPushed?: number;
	todosPulled?: number;
	error?: string;
}

export interface SyncConfig {
	provider: "notion" | "google-tasks";
	enabled: boolean;
	credentials?: {
		apiKey?: string;
		token?: string;
		databaseId?: string;
	};
	syncInterval?: number; // minutes
	autoSync?: boolean;
}

const STORAGE_KEY = "todos:sync-config" as const;

export function loadSyncConfig(): SyncConfig[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return [];
		return JSON.parse(stored) as SyncConfig[];
	} catch {
		return [];
	}
}

export function saveSyncConfig(configs: SyncConfig[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
	} catch {
		// Ignore errors
	}
}


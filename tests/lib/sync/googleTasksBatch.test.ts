/**
 * Tests pour les batch operations Google Tasks
 * Vérifie que les opérations sont correctement groupées et exécutées en parallèle
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
	groupTasksByOperation,
	executeCreateBatch,
	executeUpdateBatch,
	type TaskOperationGroup,
	type TaskOperationResult,
} from "@/lib/sync/googleTasksBatch";
import type { Todo } from "@/store/todoStorage";
import type { GoogleTask } from "@/lib/sync/googleTasksValidation";

describe("googleTasksBatch", () => {
	const mockConvertToGoogleTask = (todo: Todo): GoogleTask => ({
		id: todo.id?.startsWith("google-") ? todo.id.replace("google-", "") : undefined,
		title: todo.title,
		status: todo.completed ? "completed" : "needsAction",
		due: todo.deadline,
	});

	describe("groupTasksByOperation", () => {
		it("should group tasks by operation type", () => {
			const todos: Todo[] = [
				{
					id: "local-1",
					title: "Nouvelle tâche",
					completed: false,
					priority: false,
					createdAt: Date.now(),
				},
				{
					id: "google-task-123",
					title: "Tâche existante",
					completed: false,
					priority: false,
					createdAt: Date.now(),
				},
				{
					id: "local-2",
					title: "Autre nouvelle tâche",
					completed: true,
					priority: false,
					createdAt: Date.now(),
				},
			];

			const { creates, updates } = groupTasksByOperation(
				todos,
				mockConvertToGoogleTask
			);

			expect(creates.length).toBe(2);
			expect(updates.length).toBe(1);

			expect(creates[0].todo.id).toBe("local-1");
			expect(creates[1].todo.id).toBe("local-2");
			expect(updates[0].todo.id).toBe("google-task-123");
			expect(updates[0].googleTaskId).toBe("task-123");
		});

		it("should skip tasks without title for creation", () => {
			const todos: Todo[] = [
				{
					id: "local-1",
					title: "",
					completed: false,
					priority: false,
					createdAt: Date.now(),
				},
				{
					id: "local-2",
					title: "Tâche valide",
					completed: false,
					priority: false,
					createdAt: Date.now(),
				},
			];

			const { creates, updates } = groupTasksByOperation(
				todos,
				mockConvertToGoogleTask
			);

			expect(creates.length).toBe(1);
			expect(creates[0].todo.id).toBe("local-2");
		});

		it("should handle empty array", () => {
			const { creates, updates } = groupTasksByOperation([], mockConvertToGoogleTask);

			expect(creates.length).toBe(0);
			expect(updates.length).toBe(0);
		});
	});

	describe("executeCreateBatch", () => {
		it("should execute creates in parallel batches", async () => {
			const creates: TaskOperationGroup[] = [
				{
					todo: {
						id: "local-1",
						title: "Tâche 1",
						completed: false,
						priority: false,
						createdAt: Date.now(),
					},
					operation: "create",
					googleTask: { title: "Tâche 1" },
					taskToSend: { title: "Tâche 1" },
				},
				{
					todo: {
						id: "local-2",
						title: "Tâche 2",
						completed: false,
						priority: false,
						createdAt: Date.now(),
					},
					operation: "create",
					googleTask: { title: "Tâche 2" },
					taskToSend: { title: "Tâche 2" },
				},
			];

			const mockExecuteCreate = vi.fn(
				async (task: TaskOperationGroup): Promise<TaskOperationResult> => {
					return {
						todoId: task.todo.id,
						success: true,
						googleId: `google-${task.todo.id}-created`,
					};
				}
			);

			const results = await executeCreateBatch(
				creates,
				"task-list-id",
				"access-token",
				mockExecuteCreate
			);

			expect(results.length).toBe(2);
			expect(mockExecuteCreate).toHaveBeenCalledTimes(2);
			expect(results[0].success).toBe(true);
			expect(results[1].success).toBe(true);
		});

		it("should handle errors gracefully", async () => {
			const creates: TaskOperationGroup[] = [
				{
					todo: {
						id: "local-1",
						title: "Tâche 1",
						completed: false,
						priority: false,
						createdAt: Date.now(),
					},
					operation: "create",
					googleTask: { title: "Tâche 1" },
					taskToSend: { title: "Tâche 1" },
				},
			];

			const mockExecuteCreate = vi.fn(
				async (): Promise<TaskOperationResult> => {
					throw new Error("Network error");
				}
			);

			const results = await executeCreateBatch(
				creates,
				"task-list-id",
				"access-token",
				mockExecuteCreate
			);

			expect(results.length).toBe(1);
			expect(results[0].success).toBe(false);
			expect(results[0].error).toBeDefined();
		});
	});

	describe("executeUpdateBatch", () => {
		it("should execute updates in parallel batches", async () => {
			const updates: TaskOperationGroup[] = [
				{
					todo: {
						id: "google-task-1",
						title: "Tâche 1",
						completed: false,
						priority: false,
						createdAt: Date.now(),
					},
					operation: "update",
					googleTask: { id: "task-1", title: "Tâche 1" },
					taskToSend: { title: "Tâche 1 modifiée" },
					googleTaskId: "task-1",
				},
			];

			const mockExecuteUpdate = vi.fn(
				async (task: TaskOperationGroup): Promise<TaskOperationResult> => {
					return {
						todoId: task.todo.id,
						success: true,
						googleId: task.todo.id,
					};
				}
			);

			const results = await executeUpdateBatch(
				updates,
				"task-list-id",
				"access-token",
				mockExecuteUpdate
			);

			expect(results.length).toBe(1);
			expect(mockExecuteUpdate).toHaveBeenCalledTimes(1);
			expect(results[0].success).toBe(true);
		});

		it("should handle large batches", async () => {
			const updates: TaskOperationGroup[] = Array.from({ length: 25 }, (_, i) => ({
				todo: {
					id: `google-task-${i}`,
					title: `Tâche ${i}`,
					completed: false,
					priority: false,
					createdAt: Date.now(),
				},
				operation: "update" as const,
				googleTask: { id: `task-${i}`, title: `Tâche ${i}` },
				taskToSend: { title: `Tâche ${i} modifiée` },
				googleTaskId: `task-${i}`,
			}));

			const mockExecuteUpdate = vi.fn(
				async (task: TaskOperationGroup): Promise<TaskOperationResult> => {
					return {
						todoId: task.todo.id,
						success: true,
						googleId: task.todo.id,
					};
				}
			);

			const results = await executeUpdateBatch(
				updates,
				"task-list-id",
				"access-token",
				mockExecuteUpdate
			);

			// Devrait être divisé en batches de 10
			expect(results.length).toBe(25);
			expect(mockExecuteUpdate).toHaveBeenCalledTimes(25);
		});
	});
});


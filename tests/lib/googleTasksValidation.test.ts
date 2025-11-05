/**
 * Tests pour la validation Google Tasks (Phase 3)
 */

import { describe, it, expect } from "vitest";
import {
	validateGoogleTask,
	validateGoogleTaskList,
	validateGoogleTasksResponse,
	validateGoogleTasksListResponse,
	safeValidateGoogleTask,
	safeValidateGoogleTaskList,
} from "@/lib/sync/googleTasksValidation";
import { SyncError, SyncErrorCode } from "@/lib/errors";

describe("googleTasksValidation (Phase 3)", () => {
	describe("validateGoogleTask", () => {
		it("should validate valid Google task", () => {
			const task = {
				id: "task-123",
				title: "Ma tâche",
				status: "needsAction" as const,
				due: "2024-12-31T00:00:00.000Z",
			};

			const result = validateGoogleTask(task);

			expect(result.id).toBe("task-123");
			expect(result.title).toBe("Ma tâche");
		});

		it("should throw SyncError for invalid task", () => {
			const invalidTask = {
				status: "invalid-status", // Invalid status
			};

			expect(() => validateGoogleTask(invalidTask)).toThrow();
		});

		it("should accept optional fields", () => {
			const task = {
				title: "Ma tâche",
			};

			const result = validateGoogleTask(task);

			expect(result.title).toBe("Ma tâche");
		});
	});

	describe("validateGoogleTaskList", () => {
		it("should validate valid Google task list", () => {
			const list = {
				id: "list-123",
				title: "Ma liste",
			};

			const result = validateGoogleTaskList(list);

			expect(result.id).toBe("list-123");
			expect(result.title).toBe("Ma liste");
		});

		it("should throw SyncError for invalid list", () => {
			const invalidList = {
				// Missing required id and title
			};

			expect(() => validateGoogleTaskList(invalidList)).toThrow();
		});
	});

	describe("validateGoogleTasksResponse", () => {
		it("should validate valid response", () => {
			const response = {
				items: [
					{ id: "task-1", title: "Tâche 1" },
					{ id: "task-2", title: "Tâche 2" },
				],
			};

			const result = validateGoogleTasksResponse(response);

			expect(result.items).toHaveLength(2);
		});

		it("should accept optional nextPageToken", () => {
			const response = {
				items: [],
				nextPageToken: "token-123",
			};

			const result = validateGoogleTasksResponse(response);

			expect(result.nextPageToken).toBe("token-123");
		});

		it("should throw SyncError for invalid response", () => {
			const invalidResponse = {
				items: "not-an-array",
			};

			expect(() => validateGoogleTasksResponse(invalidResponse)).toThrow();
		});
	});

	describe("validateGoogleTasksListResponse", () => {
		it("should validate valid list response", () => {
			const response = {
				items: [
					{ id: "list-1", title: "Liste 1" },
					{ id: "list-2", title: "Liste 2" },
				],
			};

			const result = validateGoogleTasksListResponse(response);

			expect(result.items).toHaveLength(2);
		});

		it("should throw SyncError for invalid response", () => {
			const invalidResponse = {
				items: null,
			};

			expect(() => validateGoogleTasksListResponse(invalidResponse)).toThrow();
		});
	});

	describe("safeValidateGoogleTask", () => {
		it("should return validated task for valid data", () => {
			const task = {
				id: "task-123",
				title: "Ma tâche",
			};

			const result = safeValidateGoogleTask(task);

			expect(result).not.toBeNull();
			expect(result?.id).toBe("task-123");
		});

		it("should return null for invalid data", () => {
			const invalidTask = {
				status: "invalid",
			};

			const result = safeValidateGoogleTask(invalidTask);

			expect(result).toBeNull();
		});
	});

	describe("safeValidateGoogleTaskList", () => {
		it("should return validated list for valid data", () => {
			const list = {
				id: "list-123",
				title: "Ma liste",
			};

			const result = safeValidateGoogleTaskList(list);

			expect(result).not.toBeNull();
			expect(result?.id).toBe("list-123");
		});

		it("should return null for invalid data", () => {
			const invalidList = {};

			const result = safeValidateGoogleTaskList(invalidList);

			expect(result).toBeNull();
		});
	});
});


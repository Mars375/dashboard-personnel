/**
 * Tests pour le système d'erreurs (Phase 3)
 */

import { describe, it, expect } from "vitest";
import { SyncError, SyncErrorCode } from "@/lib/errors";

describe("SyncError (Phase 3)", () => {
	describe("SyncError constructor", () => {
		it("should create SyncError with all properties", () => {
			const error = new SyncError(
				"Test error",
				SyncErrorCode.NETWORK_ERROR,
				true,
				new Error("Original")
			);

			expect(error.message).toBe("Test error");
			expect(error.code).toBe(SyncErrorCode.NETWORK_ERROR);
			expect(error.retryable).toBe(true);
			expect(error.originalError).toBeInstanceOf(Error);
			expect(error.name).toBe("SyncError");
		});

		it("should create SyncError with default retryable", () => {
			const error = new SyncError(
				"Test error",
				SyncErrorCode.AUTH_REQUIRED
			);

			expect(error.retryable).toBe(false);
		});
	});

	describe("SyncError.fromError", () => {
		it("should return same SyncError if already SyncError", () => {
			const original = new SyncError(
				"Test",
				SyncErrorCode.NETWORK_ERROR,
				true
			);
			const converted = SyncError.fromError(original);

			expect(converted).toBe(original);
		});

		it("should convert authentication errors", () => {
			const error = SyncError.fromError(new Error("Token invalide"));

			expect(error.code).toBe(SyncErrorCode.AUTH_REQUIRED);
			expect(error.retryable).toBe(false);
		});

		it("should convert expired token errors", () => {
			const error = SyncError.fromError(new Error("Token expiré"));

			expect(error.code).toBe(SyncErrorCode.AUTH_EXPIRED);
		});

		it("should convert network errors", () => {
			const error = SyncError.fromError(new Error("Network error"));

			expect(error.code).toBe(SyncErrorCode.NETWORK_ERROR);
			expect(error.retryable).toBe(true);
		});

		it("should convert timeout errors", () => {
			const error = SyncError.fromError(new Error("Timeout"));

			expect(error.code).toBe(SyncErrorCode.NETWORK_TIMEOUT);
			expect(error.retryable).toBe(true);
		});

		it("should convert rate limit errors", () => {
			const error = SyncError.fromError(new Error("Rate limit exceeded"));

			expect(error.code).toBe(SyncErrorCode.RATE_LIMIT);
			expect(error.retryable).toBe(true);
		});

		it("should convert validation errors", () => {
			// Note: "invalid" est détecté comme auth avant validation
			// Utilisons "validation" ou "400" pour tester la validation
			const error = SyncError.fromError(new Error("Validation error"));

			expect(error.code).toBe(SyncErrorCode.VALIDATION_ERROR);
			expect(error.retryable).toBe(false);
		});

		it("should convert permission errors", () => {
			const error = SyncError.fromError(new Error("Permission denied"));

			expect(error.code).toBe(SyncErrorCode.PERMISSION_DENIED);
			expect(error.retryable).toBe(false);
		});

		it("should convert not found errors", () => {
			const error = SyncError.fromError(new Error("Not found"));

			expect(error.code).toBe(SyncErrorCode.NOT_FOUND);
			expect(error.retryable).toBe(false);
		});

		it("should convert server errors", () => {
			const error = SyncError.fromError(new Error("Internal server error"));

			expect(error.code).toBe(SyncErrorCode.SERVER_ERROR);
			expect(error.retryable).toBe(true);
		});

		it("should handle unknown errors", () => {
			const error = SyncError.fromError(new Error("Unknown"));

			expect(error.code).toBe(SyncErrorCode.UNKNOWN_ERROR);
			expect(error.retryable).toBe(true);
		});

		it("should handle non-Error objects", () => {
			const error = SyncError.fromError("String error");

			expect(error.code).toBe(SyncErrorCode.UNKNOWN_ERROR);
			expect(error.retryable).toBe(true);
		});
	});

	describe("SyncError.isRetryable", () => {
		it("should return true for retryable errors", () => {
			const error = new SyncError(
				"Test",
				SyncErrorCode.NETWORK_ERROR,
				true
			);

			expect(SyncError.isRetryable(error)).toBe(true);
		});

		it("should return false for non-retryable errors", () => {
			const error = new SyncError(
				"Test",
				SyncErrorCode.AUTH_REQUIRED,
				false
			);

			expect(SyncError.isRetryable(error)).toBe(false);
		});

		it("should convert and check non-SyncError", () => {
			const error = new Error("Network error");

			expect(SyncError.isRetryable(error)).toBe(true);
		});
	});

	describe("SyncError.isAuthError", () => {
		it("should return true for auth errors", () => {
			const error = new SyncError(
				"Test",
				SyncErrorCode.AUTH_REQUIRED,
				false
			);

			expect(SyncError.isAuthError(error)).toBe(true);
		});

		it("should return false for non-auth errors", () => {
			const error = new SyncError(
				"Test",
				SyncErrorCode.NETWORK_ERROR,
				true
			);

			expect(SyncError.isAuthError(error)).toBe(false);
		});
	});

	describe("SyncError.isNetworkError", () => {
		it("should return true for network errors", () => {
			const error = new SyncError(
				"Test",
				SyncErrorCode.NETWORK_ERROR,
				true
			);

			expect(SyncError.isNetworkError(error)).toBe(true);
		});

		it("should return false for non-network errors", () => {
			const error = new SyncError(
				"Test",
				SyncErrorCode.AUTH_REQUIRED,
				false
			);

			expect(SyncError.isNetworkError(error)).toBe(false);
		});
	});
});


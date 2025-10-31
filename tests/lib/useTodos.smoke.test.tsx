import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTodos } from "@/hooks/useTodos";

function Probe() {
	const { todos, addTodo, toggleTodo, deleteTodo, activeCount } = useTodos();
	return (
		<div>
			<div data-testid="count">{todos.length}</div>
			<div data-testid="active">{activeCount}</div>
			<button onClick={() => addTodo("Test task")}>Add</button>
			{todos.length > 0 && (
				<>
					<button onClick={() => toggleTodo(todos[0].id)}>Toggle</button>
					<button onClick={() => deleteTodo(todos[0].id)}>Delete</button>
				</>
			)}
		</div>
	);
}

describe("useTodos (smoke)", () => {
	beforeEach(() => {
		// Mock localStorage
		const store: Record<string, string> = {};
		vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
			store[key] = value;
		});
		vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
			return store[key] ?? null;
		});
	});

	it("renders without crashing and can add todo", async () => {
		render(<Probe />);
		expect(screen.getByTestId("count").textContent).toBe("0");
		
		const addButton = screen.getByText("Add");
		addButton.click();
		
		await waitFor(() => {
			expect(screen.getByTestId("count").textContent).toBe("1");
		});
	});
});


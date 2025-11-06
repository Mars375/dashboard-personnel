import { describe, it, expect, beforeEach } from "vitest";
import { useDashboardStore } from "@/store/dashboardStore";

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
	};
})();

Object.defineProperty(window, "localStorage", {
	value: localStorageMock,
});

describe("dashboardStore", () => {
	beforeEach(() => {
		localStorageMock.clear();
		// Reset store to initial state
		useDashboardStore.setState({
			widgets: [],
			isPickerOpen: false,
		});
	});

	it("should have initial state", () => {
		const state = useDashboardStore.getState();
		expect(state.widgets).toEqual([]);
		expect(state.isPickerOpen).toBe(false);
	});

	it("should add a widget", () => {
		const { addWidget } = useDashboardStore.getState();
		addWidget("weather");

		const state = useDashboardStore.getState();
		expect(state.widgets).toHaveLength(1);
		expect(state.widgets[0].type).toBe("weather");
		expect(state.widgets[0].id).toMatch(/^weather-\d+$/);
	});

	it("should add multiple widgets with unique ids", () => {
		const { addWidget } = useDashboardStore.getState();
		addWidget("weather");
		addWidget("weather");
		addWidget("todo");

		const state = useDashboardStore.getState();
		expect(state.widgets).toHaveLength(3);
		const ids = state.widgets.map((w) => w.id);
		expect(new Set(ids).size).toBe(3); // All unique
	});

	it("should remove a widget", () => {
		const { addWidget, removeWidget } = useDashboardStore.getState();
		addWidget("weather");
		const widgetId = useDashboardStore.getState().widgets[0].id;

		removeWidget(widgetId);
		const state = useDashboardStore.getState();
		expect(state.widgets).toHaveLength(0);
	});

	it("should update layout", () => {
		const { addWidget, updateLayout } = useDashboardStore.getState();
		addWidget("weather");
		const widget = useDashboardStore.getState().widgets[0];

		updateLayout([
			{
				...widget,
				x: 10,
				y: 10,
				w: 6,
				h: 6,
			},
		]);

		const state = useDashboardStore.getState();
		expect(state.widgets[0].x).toBe(10);
		expect(state.widgets[0].y).toBe(10);
		expect(state.widgets[0].w).toBe(6);
		expect(state.widgets[0].h).toBe(6);
	});

	it("should open picker", () => {
		const { openPicker } = useDashboardStore.getState();
		openPicker();

		const state = useDashboardStore.getState();
		expect(state.isPickerOpen).toBe(true);
	});

	it("should close picker", () => {
		const { openPicker, closePicker } = useDashboardStore.getState();
		openPicker();
		closePicker();

		const state = useDashboardStore.getState();
		expect(state.isPickerOpen).toBe(false);
	});

	it("should set default size for weather widget", () => {
		const { addWidget } = useDashboardStore.getState();
		addWidget("weather");

		const widget = useDashboardStore.getState().widgets[0];
		expect(widget.w).toBe(2);
		expect(widget.h).toBe(3);
		expect(widget.minW).toBe(2);
		expect(widget.minH).toBe(3);
	});

	it("should set default size for todo widget", () => {
		const { addWidget } = useDashboardStore.getState();
		addWidget("todo");

		const widget = useDashboardStore.getState().widgets[0];
		expect(widget.w).toBe(4);
		expect(widget.h).toBe(6);
		expect(widget.minW).toBe(2);
		expect(widget.minH).toBe(4);
	});

	it("should find available position for new widget", () => {
		const { addWidget } = useDashboardStore.getState();
		addWidget("weather");
		addWidget("weather");

		const widgets = useDashboardStore.getState().widgets;
		// Widgets should be positioned (x and y are set)
		expect(widgets[0].x).toBeDefined();
		expect(widgets[0].y).toBeDefined();
		expect(widgets[1].x).toBeDefined();
		expect(widgets[1].y).toBeDefined();
		// They might have same position if they don't overlap (different sizes)
		// or different positions if they do overlap
	});
});


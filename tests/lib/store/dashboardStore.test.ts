import { describe, it, expect, beforeEach } from "vitest";
import { useDashboardStore } from "@/store/dashboardStore";
import type { WidgetLayout } from "@/store/dashboardStore";

describe("dashboardStore", () => {
	beforeEach(() => {
		// Reset store to default state
		useDashboardStore.setState({
			widgets: [
				{ id: "weather-1", type: "weather", x: 0, y: 0, w: 4, h: 3 },
				{ id: "todo-1", type: "todo", x: 4, y: 0, w: 4, h: 6 },
				{ id: "calendar-1", type: "calendar", x: 8, y: 0, w: 4, h: 6 },
			],
			isPickerOpen: false,
		});
	});

	describe("addWidget", () => {
		it("should add a new widget with default position", () => {
			const { addWidget, widgets } = useDashboardStore.getState();
			
			addWidget("weather");
			
			const newState = useDashboardStore.getState();
			expect(newState.widgets.length).toBe(4);
			expect(newState.widgets[3].type).toBe("weather");
		});

		it("should add a widget with custom position", () => {
			const { addWidget } = useDashboardStore.getState();
			
			addWidget("todo", { x: 10, y: 10 });
			
			const newState = useDashboardStore.getState();
			const newWidget = newState.widgets.find((w) => w.x === 10 && w.y === 10);
			expect(newWidget).toBeDefined();
			expect(newWidget?.type).toBe("todo");
		});

		it("should generate unique IDs", () => {
			const { addWidget } = useDashboardStore.getState();
			
			addWidget("weather");
			addWidget("weather");
			
			const newState = useDashboardStore.getState();
			const weatherWidgets = newState.widgets.filter((w) => w.type === "weather");
			const ids = weatherWidgets.map((w) => w.id);
			const uniqueIds = new Set(ids);
			
			expect(uniqueIds.size).toBe(weatherWidgets.length);
		});
	});

	describe("removeWidget", () => {
		it("should remove a widget by id", () => {
			const { removeWidget, widgets } = useDashboardStore.getState();
			const initialCount = widgets.length;
			const widgetToRemove = widgets[0];
			
			removeWidget(widgetToRemove.id);
			
			const newState = useDashboardStore.getState();
			expect(newState.widgets.length).toBe(initialCount - 1);
			expect(newState.widgets.find((w) => w.id === widgetToRemove.id)).toBeUndefined();
		});

		it("should not remove widget if id doesn't exist", () => {
			const { removeWidget, widgets } = useDashboardStore.getState();
			const initialCount = widgets.length;
			
			removeWidget("non-existent-id");
			
			const newState = useDashboardStore.getState();
			expect(newState.widgets.length).toBe(initialCount);
		});
	});

	describe("updateLayout", () => {
		it("should update widget layouts", () => {
			const { updateLayout } = useDashboardStore.getState();
			
			const newLayouts: WidgetLayout[] = [
				{ id: "weather-1", type: "weather", x: 5, y: 5, w: 6, h: 4 },
				{ id: "todo-1", type: "todo", x: 0, y: 0, w: 4, h: 6 },
			];
			
			updateLayout(newLayouts);
			
			const newState = useDashboardStore.getState();
			expect(newState.widgets).toEqual(newLayouts);
		});
	});

	describe("picker", () => {
		it("should open picker", () => {
			const { openPicker } = useDashboardStore.getState();
			
			openPicker();
			
			const newState = useDashboardStore.getState();
			expect(newState.isPickerOpen).toBe(true);
		});

		it("should close picker", () => {
			const { openPicker, closePicker } = useDashboardStore.getState();
			
			openPicker();
			closePicker();
			
			const newState = useDashboardStore.getState();
			expect(newState.isPickerOpen).toBe(false);
		});
	});
});


import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: [],
		restoreMocks: true,
		clearMocks: true,
		fakeTimers: {
			toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"],
		},
	},
	define: {
		"import.meta.env.VITE_OPENWEATHER_API_KEY": JSON.stringify("test"),
	},
	resolve: {
		alias: {
			"@": path.resolve(process.cwd(), "src"),
		},
	},
});

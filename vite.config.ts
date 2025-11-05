import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import visualizer from "vite-bundle-visualizer";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		// Bundle visualizer (seulement en mode build)
		...(process.env.ANALYZE === "true"
			? [
					visualizer({
						open: true,
						template: "treemap" as const,
					}) as any,
			  ]
			: []),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	build: {
		// Optimisations de build
		target: "esnext",
		minify: "esbuild",
		cssMinify: true,
		sourcemap: false, // Désactiver en production pour réduire la taille
		rollupOptions: {
			output: {
				// Optimisation des chunks
				manualChunks: {
					// Vendor chunks séparés pour meilleur caching
					"react-vendor": ["react", "react-dom"],
					"ui-vendor": [
						"@radix-ui/react-dialog",
						"@radix-ui/react-dropdown-menu",
						"@radix-ui/react-popover",
						"@radix-ui/react-select",
						"@radix-ui/react-tooltip",
					],
					"motion-vendor": ["framer-motion"],
					"charts-vendor": ["recharts"],
					"date-vendor": ["date-fns"],
					"icons-vendor": ["lucide-react"],
					"grid-vendor": ["react-grid-layout"],
				},
				// Optimisation des noms de fichiers
				chunkFileNames: "assets/js/[name]-[hash].js",
				entryFileNames: "assets/js/[name]-[hash].js",
				assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
			},
		},
		// Optimisations de performance
		chunkSizeWarningLimit: 1000, // Avertir si un chunk dépasse 1MB
	},
	// Optimisations de dev server
	server: {
		hmr: {
			overlay: true,
		},
	},
	// Optimisations de dépendances
	optimizeDeps: {
		include: [
			"react",
			"react-dom",
			"framer-motion",
			"recharts",
			"date-fns",
			"lucide-react",
			"react-grid-layout",
		],
	},
});

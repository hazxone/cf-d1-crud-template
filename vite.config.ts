import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		TanStackRouterVite({
			routesDirectory: './app/routes',
			generatedRouteTree: './app/routeTree.gen.ts',
		}),
		react(),
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		tailwindcss(),
		tsconfigPaths(),
	],
});

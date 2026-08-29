import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // Inlines every JS/CSS chunk straight into each HTML file, so the site
    // still works when a browser opens it directly as a local file (no
    // server, no separate asset requests that `file://` blocks) — and it
    // still works completely normally when actually hosted, too. Skipped
    // for the SSR build: that bundle runs in Node during the build only
    // and is never shipped, so it's not one Vite emits HTML for anyway.
    ...(isSsrBuild ? [] : [viteSingleFile()]),
  ],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    // vite-plugin-singlefile needs an unlimited inline threshold and no
    // separate chunks to actually fold everything into one file.
    assetsInlineLimit: isSsrBuild ? undefined : 100_000_000,
    cssCodeSplit: false,
  },
  server: {
    port: Number(process.env.PORT) || 3000,
  },
}));

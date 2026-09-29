import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Turns the entry tags Vite injects into dist/index.html into classic ones:
 *   <script type="module" crossorigin src="./assets/app.js">  →  <script defer src="./assets/app.js">
 *   <link rel="stylesheet" crossorigin href="./assets/style.css">  →  no crossorigin
 * Browsers refuse module scripts and CORS-mode requests on file://, so this
 * is what lets every prerendered page also work when opened straight from
 * disk. `defer` keeps the module-script timing (runs after the HTML is
 * parsed). scripts/prerender.mjs checks the result and fails loudly if a
 * future Vite version injects the tags differently.
 */
function classicEntryTags(): Plugin {
  const isOwnAsset = (tag: string) => /\b(?:src|href)="(?:\.\/|\/)?assets\//.test(tag);
  return {
    name: "tanushh:classic-entry-tags",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler: (html) =>
        html
          .replace(/<script\b[^>]*>/g, (tag) =>
            isOwnAsset(tag)
              ? tag
                  .replace(/\s+type="module"/, "")
                  .replace(/\s+crossorigin(?:="[^"]*")?/, "")
                  .replace(/^<script\b(?![^>]*\sdefer\b)/, "<script defer")
              : tag
          )
          .replace(/<link\b[^>]*>/g, (tag) =>
            isOwnAsset(tag) ? tag.replace(/\s+crossorigin(?:="[^"]*")?/, "") : tag
          ),
    },
  };
}

/**
 * `detailsToAdd` notes on content records are private notes to the owner
 * ("confirm the year", "which round?"…). They are never rendered, and this
 * keeps them out of the published JavaScript too: the property is removed
 * from src/content/** before bundling (dev, client and prerender builds).
 * The notes stay in the source files for the owner to read and edit.
 */
function stripPrivateNotes(): Plugin {
  const NOTE = /\bdetailsToAdd\s*:\s*(?:"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)\s*,?/g;
  return {
    name: "tanushh:strip-private-notes",
    enforce: "pre",
    transform(code, id) {
      if (!/[\\/]src[\\/]content[\\/].+\.ts$/.test(id) || !code.includes("detailsToAdd")) return null;
      return { code: code.replace(NOTE, ""), map: null };
    },
  };
}

/**
 * Dev server: answers every page request (/, /work/wizmo/, …) with dev.html,
 * the real Vite entry. After a build the project root also holds the
 * compiled site (index.html, work/…/index.html — see copy-dist-to-root.mjs);
 * without this, Vite would serve those stale built pages for deep links.
 */
function devEntry(): Plugin {
  const entry = path.join(dirname, "dev.html");
  return {
    name: "tanushh:dev-entry",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url ?? "/").split(/[?#]/)[0];
        // Any page URL (no file extension, or .html) — whatever the Accept
        // header says, so scripted checks get the same page a browser does.
        // Vite's own endpoints (/@vite/…, /@react-refresh, /src/…) pass through.
        const internal = /^\/(?:@|src\/|node_modules\/)/.test(pathname);
        const wantsPage =
          (req.method === "GET" || req.method === "HEAD") &&
          !internal &&
          (!/\.[a-z0-9]+$/i.test(pathname) || pathname.endsWith(".html"));
        if (!wantsPage) return next();
        try {
          const html = await server.transformIndexHtml(req.url ?? "/", fs.readFileSync(entry, "utf8"), req.originalUrl);
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(html);
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

export default defineConfig(({ isSsrBuild }) => ({
  // Relative asset URLs, so the built pages work from any folder depth and
  // from file:// (scripts/prerender.mjs rewrites them per page depth).
  base: "./",
  plugins: [stripPrivateNotes(), react(), tailwindcss(), classicEntryTags(), devEntry()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
  build: isSsrBuild
    ? {
        // `vite build --ssr src/entry-server.tsx --outDir dist-ssr`: a Node
        // bundle used only by scripts/prerender.mjs, then deleted. Default
        // ESM output; no public/ copy (the media would just be duplicated).
        copyPublicDir: false,
      }
    : {
        outDir: "dist",
        // One classic script + one stylesheet, at fixed names:
        //   assets/app.js    (IIFE — no import/export, no import.meta)
        //   assets/style.css
        // Classic scripts load on http AND on file://; module scripts don't.
        cssCodeSplit: false,
        modulePreload: false,
        rolldownOptions: {
          output: {
            format: "iife",
            codeSplitting: false, // dynamic imports are inlined into app.js
            entryFileNames: "assets/app.js",
            assetFileNames: "assets/[name][extname]",
          },
          onwarn(warning, warn) {
            // Vite's dynamic-import preload helper mentions import.meta; with
            // everything inlined into one file it never runs, so the "import.meta
            // is empty in iife output" notice about it is noise. The same
            // warning for the site's own code still shows (it would be a bug).
            if (warning.code === "EMPTY_IMPORT_META" && warning.id?.includes("vite/preload-helper")) return;
            warn(warning);
          },
        },
      },
  // Page HTML only comes from dev.html; never crawl the compiled pages that
  // `npm run build` mirrors onto the project root.
  optimizeDeps: {
    entries: ["src/main.tsx"],
  },
  server: {
    port: Number(process.env.PORT) || 3000,
  },
}));

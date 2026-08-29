// `npm run build` overwrites root index.html (and the route folders next to
// it) with the compiled site — see copy-dist-to-root.mjs. Before Vite can
// build (or run the dev server) again, index.html needs to be the actual
// Vite entry (the one referencing /src/main.tsx) again. dev.html is that
// entry, kept under version control; this just puts a fresh copy back at
// index.html. Runs automatically via npm's "predev"/"prebuild" hooks.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";
fs.copyFileSync(path.join(root, "dev.html"), path.join(root, "index.html"));

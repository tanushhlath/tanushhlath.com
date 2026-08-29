// Mirrors dist/ onto the project root, so the primary tanushhlath.com folder
// itself contains the finished, self-contained site (root index.html plus
// story/, work/, me/, beyond/, archive/, explore/, images/, favicons,
// sitemap.xml, robots.txt) — not just a dist/ subfolder. This overwrites
// root index.html with the compiled build (replacing the dev entry that
// restore-dev-index.mjs put there before the build ran). Run automatically
// as the last step of `npm run build`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const distDir = path.join(root, "dist");

fs.cpSync(distDir, root, { recursive: true });
console.log("  mirrored     dist/ -> project root (index.html is now the built site)");

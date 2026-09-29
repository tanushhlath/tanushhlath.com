import "@/index.css";
import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { AppRoutes } from "@/routes";
import { getInitialRoute, isFileMode } from "@/routing/fileMode";
import { prepareHistory } from "@/routing/scrollMemory";

/**
 * Browser entry.
 *
 * Over http(s) the app runs on a BrowserRouter. Opened from disk
 * (file://), there's no server to answer /work/wizmo/, so a MemoryRouter
 * starts at the route this prerendered file was built for
 * (window.__ROUTE__, see scripts/prerender.mjs) and links to other pages
 * become real relative …/index.html links (see routing/fileMode.ts).
 *
 * `useTransitions={false}`: route changes are committed synchronously
 * inside each view transition's update callback (routing/transitions.ts),
 * which React's startTransition would otherwise defer.
 */

const fileMode = isFileMode();

if (!fileMode) {
  // Hosts also serve /work/wizmo/index.html (same file as /work/wizmo/).
  // Drop the "index.html" before the router reads the URL, so it matches
  // the route instead of rendering the 404 page.
  const { pathname, search, hash } = window.location;
  if (/\/index\.html$/i.test(pathname)) {
    window.history.replaceState(window.history.state, "", pathname.replace(/index\.html$/i, "") + search + hash);
  }
  // The web-app manifest is only linked here, on http(s): browsers refuse to
  // load it from file:// and would log an error for pages opened from disk.
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "/site.webmanifest";
    document.head.appendChild(manifest);
  }
  // The prerendered <head> links icons relative to the page's folder (so
  // pages also work opened from disk). Pin them to absolute paths, or they
  // would re-resolve — and 404 — after the first in-app navigation changes
  // the URL.
  document
    .querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')
    .forEach((link) => {
      const href = link.getAttribute("href");
      if (href && !/^(?:[a-z]+:)?\/\//i.test(href) && !href.startsWith("/")) {
        link.setAttribute("href", new URL(href, window.location.href).pathname);
      }
    });
}

prepareHistory();

const app = (
  <StrictMode>
    {fileMode ? (
      <MemoryRouter initialEntries={[getInitialRoute()]} useTransitions={false}>
        <AppRoutes />
      </MemoryRouter>
    ) : (
      <BrowserRouter useTransitions={false}>
        <AppRoutes />
      </BrowserRouter>
    )}
  </StrictMode>
);

const container = document.getElementById("root");
if (!container) throw new Error('index.html must contain <div id="root"></div>.');

// Built pages arrive with this route already rendered into #root by the
// prerender step, so React hydrates it. `npm run dev` (empty #root):
// a normal client render.
if (container.firstElementChild) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}

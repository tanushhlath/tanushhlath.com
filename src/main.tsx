import { StrictMode } from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/routes";
import "@/index.css";

const container = document.getElementById("root")!;

const app = (
  <StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>
);

// Production build: scripts/prerender.mjs already filled #root with static
// HTML for this exact route, so we hydrate onto it. Plain `vite`/`vite dev`
// (or a route the prerender step doesn't know about): #root is empty, so
// just do a normal client render.
if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}

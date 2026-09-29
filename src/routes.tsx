import { Route, Routes } from "react-router-dom";
import App from "@/App";
import Archive from "@/pages/Archive";
import Beyond from "@/pages/Beyond";
import Explore from "@/pages/Explore";
import Home from "@/pages/Home";
import Me from "@/pages/Me";
import NotFound from "@/pages/NotFound";
import Story from "@/pages/Story";
import Work from "@/pages/Work";
import WorkDetail from "@/pages/WorkDetail";

/**
 * The full route tree, shared verbatim by the browser (main.tsx:
 * BrowserRouter, or MemoryRouter in file mode) and the prerender step
 * (entry-server.tsx: StaticRouter) — one definition, so they can never
 * drift. Paths match with or without the trailing slash; links always use
 * the canonical trailing-slash form from `paths`.
 *
 * Adding a page: add its <Route> here, its copy to src/content/pages.ts,
 * a helper to `paths` (src/routing/paths.ts) and its entry to
 * STATIC_PAGES in src/routing/seo.ts (which makes the build prerender it
 * and list it in the sitemap).
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<App />}>
        <Route path="/" element={<Home />} />
        <Route path="/story" element={<Story />} />
        <Route path="/work" element={<Work />} />
        <Route path="/work/:slug" element={<WorkDetail />} />
        <Route path="/me" element={<Me />} />
        <Route path="/beyond" element={<Beyond />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

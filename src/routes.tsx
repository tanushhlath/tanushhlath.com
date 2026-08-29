import { Routes, Route } from "react-router-dom";
import App from "@/App";
import Home from "@/pages/Home";
import Story from "@/pages/Story";
import Work from "@/pages/Work";
import WorkDetail from "@/pages/WorkDetail";
import Me from "@/pages/Me";
import Beyond from "@/pages/Beyond";
import Archive from "@/pages/Archive";
import Explore from "@/pages/Explore";
import NotFound from "@/pages/NotFound";

/**
 * The full route tree, shared verbatim between the browser (main.tsx,
 * wrapped in BrowserRouter) and the prerender step (entry-server.tsx,
 * wrapped in StaticRouter) — one definition, so the two can never drift.
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

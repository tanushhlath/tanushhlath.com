import { Outlet } from "react-router-dom";
import { SiteChrome } from "@/components/nav/SiteChrome";
import { Footer } from "@/components/nav/Footer";
import { Cursor } from "@/components/misc/Cursor";

/**
 * The persistent shell around every route — replaces Next's app/layout.tsx.
 * <html>/<body> now live in index.html (there's no framework managing the
 * document shell anymore), so this just renders what used to be inside
 * <body>: skip link, chrome, the routed page, footer, cursor.
 */
export default function App() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-azure focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <SiteChrome />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Cursor />
    </>
  );
}

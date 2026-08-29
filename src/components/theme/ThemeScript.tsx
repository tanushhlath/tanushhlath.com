import Script from "next/script";

/**
 * Sets `data-theme` on <html> before first paint — this is what prevents a
 * flash of the wrong theme. `beforeInteractive` makes Next.js inline this
 * into the initial HTML and run it ahead of hydration.
 */
export function ThemeScript() {
  return (
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document -- App Router's root layout is the documented place for this in Next 13+; the rule predates App Router.
    <Script id="theme-init" strategy="beforeInteractive">
      {`(function(){try{var s=localStorage.getItem("theme");var t=s==="light"||s==="dark"?s:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`}
    </Script>
  );
}

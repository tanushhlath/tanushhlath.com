"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Theme = "dark" | "light";

/**
 * Sun/moon theme toggle. Renders the "dark" icon on the server and during
 * the first client render (matching what ThemeScript defaults to when
 * nothing is stored) so hydration never mismatches, then syncs to the
 * real stored theme immediately after mount.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Syncing to the theme the pre-paint script (ThemeScript) already
    // applied to <html> — this can only be read client-side, so an effect
    // is the correct tool here despite the lint heuristic.
    const current = document.documentElement.getAttribute("data-theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (current === "light" || current === "dark") setTheme(current);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const apply = () => {
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* private browsing / storage disabled — theme just won't persist */
      }
      setTheme(next);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced && typeof document.startViewTransition === "function") {
      document.startViewTransition(apply);
    } else {
      document.documentElement.classList.add("theme-transitioning");
      apply();
      setTimeout(() => document.documentElement.classList.remove("theme-transitioning"), 450);
    }
  }

  const isLight = mounted && theme === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      data-cursor="view"
      data-cursor-label="Toggle"
      className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-ink-line bg-ink-raised/80 backdrop-blur-sm transition-colors duration-200 hover:border-azure-soft cursor-pointer"
    >
      <motion.svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        animate={{ rotate: isLight ? 90 : 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.circle
          cx="12"
          cy="12"
          r="5"
          fill="currentColor"
          className="text-paper"
          animate={{ scale: isLight ? 1 : 0.72 }}
          transition={{ duration: 0.35 }}
        />
        <motion.g
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="text-paper"
          animate={{ opacity: isLight ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <line x1="12" y1="1.5" x2="12" y2="3.5" />
          <line x1="12" y1="20.5" x2="12" y2="22.5" />
          <line x1="1.5" y1="12" x2="3.5" y2="12" />
          <line x1="20.5" y1="12" x2="22.5" y2="12" />
          <line x1="4.5" y1="4.5" x2="6" y2="6" />
          <line x1="18" y1="18" x2="19.5" y2="19.5" />
          <line x1="4.5" y1="19.5" x2="6" y2="18" />
          <line x1="18" y1="6" x2="19.5" y2="4.5" />
        </motion.g>
        <motion.path
          d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"
          fill="currentColor"
          className="text-paper"
          animate={{ opacity: isLight ? 0 : 1, scale: isLight ? 0.6 : 1 }}
          transition={{ duration: 0.3 }}
          style={{ transformOrigin: "12px 12px" }}
        />
      </motion.svg>
    </button>
  );
}

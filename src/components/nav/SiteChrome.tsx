"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { navGroups, primaryNav } from "@/lib/nav";
import { site } from "@/content/site";
import { EASE_ENTER, EASE_STANDARD } from "@/lib/motion";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const HOLD_MS = 1400;
const TAP_WINDOW_MS = 900;

/**
 * Global chrome: wordmark (also the one Easter egg — hold ~1.4s on desktop
 * or tap 3x on mobile), a theme toggle, a menu toggle expanding into a
 * grouped overlay with a Back control, and a quiet "02 / 05 · Story"
 * position indicator so a visitor always knows roughly where they are
 * among the five primary routes without a permanent sidebar.
 */
export function SiteChrome() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [secretOpen, setSecretOpen] = useState(false);

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClick = useRef(false);
  const tapTimes = useRef<number[]>([]);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setSecretOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!secretOpen) return;
    const t = setTimeout(() => setSecretOpen(false), 4600);
    return () => clearTimeout(t);
  }, [secretOpen]);

  const currentIndex = primaryNav.findIndex((n) =>
    n.href === "/" ? pathname === "/" : pathname?.startsWith(n.href)
  );
  const current = currentIndex >= 0 ? primaryNav[currentIndex] : null;

  function startHold() {
    holdTimer.current = setTimeout(() => {
      suppressClick.current = true;
      setSecretOpen(true);
    }, HOLD_MS);
  }
  function cancelHold() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  }
  function onWordmarkClick(e: React.MouseEvent) {
    if (suppressClick.current) {
      e.preventDefault();
      suppressClick.current = false;
      return;
    }
    const now = Date.now();
    tapTimes.current = [...tapTimes.current, now].filter((t) => now - t < TAP_WINDOW_MS);
    if (tapTimes.current.length >= 3) {
      e.preventDefault();
      tapTimes.current = [];
      setSecretOpen(true);
    }
  }

  function handleBack() {
    setOpen(false);
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 sm:px-8 py-5 pointer-events-none">
        <div className="pointer-events-auto relative">
          <Link
            href="/"
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            onClick={onWordmarkClick}
            data-cursor="view"
            data-cursor-label="Home"
            className="group/mark select-none font-display text-lg tracking-tight text-paper transition-colors duration-200 hover:text-azure-soft"
          >
            {site.shortName}
            <span className="ml-2 text-[10px] font-sans font-normal uppercase tracking-[0.2em] text-paper-faint opacity-0 transition-opacity duration-200 group-hover/mark:opacity-100">
              Home
            </span>
          </Link>

          {secretOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: EASE_ENTER }}
              className="absolute left-0 top-full mt-3 w-64 rounded-2xl border border-azure-soft/40 bg-ink-raised p-4 shadow-2xl"
              role="status"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-azure-soft">
                You found something
              </p>
              <p className="mt-2 text-sm text-paper-dim">{site.secretNote}</p>
              <p className="mt-2 text-sm text-paper-faint">:)</p>
            </motion.div>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-3">
          {current && !open && (
            <span className="hidden items-baseline gap-2 sm:flex">
              <span className="font-mono text-[11px] tabular-nums text-paper-faint">
                {String(currentIndex + 1).padStart(2, "0")} / {String(primaryNav.length).padStart(2, "0")}
              </span>
              <span className="text-xs uppercase tracking-[0.18em] text-paper-dim">
                {current.label}
              </span>
            </span>
          )}
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            data-cursor="view"
            data-cursor-label={open ? "Close" : "Menu"}
            className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-ink-line bg-ink-raised/80 backdrop-blur-sm transition-colors duration-200 hover:border-azure-soft cursor-pointer"
          >
            <span className="relative flex h-3.5 w-5 flex-col justify-between">
              <span
                className={`h-px w-full bg-paper transition-transform duration-300 ${
                  open ? "translate-y-[6.5px] rotate-45" : ""
                }`}
              />
              <span
                className={`h-px w-full bg-paper transition-opacity duration-200 ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`h-px w-full bg-paper transition-transform duration-300 ${
                  open ? "-translate-y-[6.5px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </header>

      {open && (
        <motion.div
          className="fixed inset-0 z-40 bg-ink"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: EASE_STANDARD }}
        >
          <nav
            className="h-full w-full overflow-y-auto px-6 sm:px-12 pt-28 pb-16"
            aria-label="Site sections"
          >
            <div className="mx-auto max-w-5xl">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_ENTER }}
                className="mb-4 flex flex-wrap items-center gap-4 border-b border-ink-line pb-6"
              >
                <Link
                  href="/"
                  data-cursor="view"
                  data-cursor-label="Go"
                  className={`font-display text-2xl transition-colors duration-200 ${
                    pathname === "/" ? "text-azure-soft" : "text-paper hover:text-azure-soft"
                  }`}
                >
                  Home
                </Link>
                <button
                  type="button"
                  onClick={handleBack}
                  data-cursor="view"
                  data-cursor-label="Back"
                  className="ml-auto flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-paper-faint transition-colors duration-200 hover:text-azure-soft cursor-pointer"
                >
                  <span aria-hidden>←</span> Back
                </button>
              </motion.div>

              <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
                {navGroups.map((group, gi) => {
                  const isDeeper = group.title === "Discover";
                  return (
                    <motion.div
                      key={group.title}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, ease: EASE_ENTER, delay: 0.06 + gi * 0.06 }}
                      className={isDeeper ? "lg:border-l lg:border-dashed lg:border-ink-line lg:pl-8" : ""}
                    >
                      <p className="mb-4 text-xs uppercase tracking-[0.2em] text-paper-dim">
                        {isDeeper ? "Go deeper" : "The five routes"}
                      </p>
                      <ul className="space-y-3">
                        {group.items.map((item, ii) => {
                          const active = pathname?.startsWith(item.href);
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                data-cursor="view"
                                data-cursor-label="Go"
                                className={`group flex items-baseline gap-3 font-display leading-tight transition-colors duration-200 ${
                                  isDeeper ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
                                } ${active ? "text-azure-soft" : "text-paper hover:text-azure-soft"}`}
                              >
                                {!isDeeper && (
                                  <span className="font-mono text-sm text-paper-faint">
                                    {String(ii + 1).padStart(2, "0")}
                                  </span>
                                )}
                                <span>
                                  {item.label}
                                  <span className="mt-1 block font-sans text-sm font-normal normal-case tracking-normal text-paper-faint group-hover:text-paper-dim">
                                    {item.hint}
                                  </span>
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-16 border-t border-ink-line pt-8 text-sm text-paper-faint">
                <p>{site.location}</p>
              </div>
            </div>
          </nav>
        </motion.div>
      )}
    </>
  );
}

import { useId, useRef, useSyncExternalStore } from "react";
import { prefersReducedMotion } from "@/animations";
import { cn } from "@/lib/cn";

type Theme = "dark" | "light";

/**
 * THEME TOGGLE
 *
 * Dark is the default for every visitor; light only when they pick it
 * here. The choice is remembered in localStorage "theme" and applied
 * before first paint by the inline script in dev.html, which never looks
 * at the operating system's preference.
 *
 * The switch itself: the new theme spreads out as a circle from this
 * button (View Transitions — html.vt-theme + --vt-x/--vt-y/--vt-r, see
 * styles/base.css). Without View Transitions, or under reduced motion,
 * colors crossfade instead (html.theme-transitioning). Either way the
 * browser UI color (<meta name="theme-color">) follows.
 *
 * The sun ↔ moon icon is driven by CSS off html[data-theme], so the
 * prerendered button already shows the right icon on first paint in both
 * themes; React only tracks the theme for the accessible label. Every
 * instance stays in sync — and with other open tabs.
 */

const STORAGE_KEY = "theme";
/** Keep in sync with .theme-transitioning in styles/base.css. */
const CROSSFADE_MS = 360;

let washToken = 0;
let crossfadeTimer = 0;

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

const serverTheme = (): Theme => "dark";

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  // The browser chrome matches the page color from styles/theme.css.
  const ink = getComputedStyle(root).getPropertyValue("--color-ink").trim();
  if (ink) {
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
      meta.content = ink;
    });
  }
}

function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private browsing / storage disabled: the theme just won't be remembered.
  }
}

function subscribeTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  // The theme was switched in another tab: follow it, without animation.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) applyTheme(event.newValue === "light" ? "light" : "dark");
  };
  window.addEventListener("storage", onStorage);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStorage);
  };
}

/** Switch theme with the circular wash from `origin`, or a crossfade. */
function switchTheme(next: Theme, origin: HTMLElement | null): void {
  const root = document.documentElement;
  const commit = () => {
    applyTheme(next);
    persistTheme(next);
  };

  const canWash =
    origin !== null &&
    typeof document.startViewTransition === "function" &&
    document.visibilityState === "visible" &&
    !prefersReducedMotion();

  if (canWash) {
    const rect = origin.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const token = ++washToken;
    const cleanup = () => {
      if (token !== washToken) return; // a newer switch owns the class now
      root.classList.remove("vt-theme");
      root.style.removeProperty("--vt-x");
      root.style.removeProperty("--vt-y");
      root.style.removeProperty("--vt-r");
    };

    root.style.setProperty("--vt-x", `${x}px`);
    root.style.setProperty("--vt-y", `${y}px`);
    root.style.setProperty("--vt-r", `${Math.ceil(radius)}px`);
    root.classList.add("vt-theme");
    try {
      document.startViewTransition(commit).finished.then(cleanup, cleanup);
    } catch {
      // startViewTransition can throw on an invalid document state.
      commit();
      cleanup();
    }
    return;
  }

  root.classList.add("theme-transitioning");
  commit();
  window.clearTimeout(crossfadeTimer);
  crossfadeTimer = window.setTimeout(() => root.classList.remove("theme-transitioning"), CROSSFADE_MS + 60);
}

export interface ThemeToggleProps {
  className?: string;
  /** Also show the current theme's name ("Dark" / "Light") next to the icon. */
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, serverTheme);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const maskId = `theme-moon-${useId().replace(/[^\w-]/g, "")}`;
  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${next} theme`;

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => switchTheme(readTheme() === "dark" ? "light" : "dark", buttonRef.current)}
      aria-label={label}
      title={label}
      data-cursor="view"
      data-cursor-label={next === "light" ? "Light" : "Dark"}
      className={cn(
        "theme-toggle relative inline-flex h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-full",
        "border border-ink-line bg-ink-raised/70 text-paper backdrop-blur-sm",
        "transition-[border-color,background-color,color,scale] duration-200 ease-[var(--ease-standard)]",
        "hover:border-azure-soft/60 hover:text-azure-soft active:scale-[0.94]",
        showLabel && "px-3.5",
        className
      )}
    >
      <svg
        className="theme-toggle__icon h-[18px] w-[18px] shrink-0"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <mask id={maskId}>
          <rect width="24" height="24" fill="white" />
          <circle className="theme-toggle__bite" cx="17.5" cy="7.5" r="6.5" fill="black" />
        </mask>
        <circle className="theme-toggle__body" cx="12" cy="12" r="5.5" fill="currentColor" mask={`url(#${maskId})`} />
        <g className="theme-toggle__rays" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="12" y1="1.5" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22.5" />
          <line x1="1.5" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22.5" y2="12" />
          <line x1="4.6" y1="4.6" x2="6.35" y2="6.35" />
          <line x1="17.65" y1="17.65" x2="19.4" y2="19.4" />
          <line x1="4.6" y1="19.4" x2="6.35" y2="17.65" />
          <line x1="17.65" y1="6.35" x2="19.4" y2="4.6" />
        </g>
      </svg>
      {showLabel && (
        <span
          className="theme-toggle__label text-[11px] font-semibold uppercase leading-none tracking-[0.16em]"
          aria-hidden="true"
        >
          <span data-theme-label="dark">Dark</span>
          <span data-theme-label="light">Light</span>
        </span>
      )}
    </button>
  );
}

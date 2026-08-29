"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * Small, elegant custom cursor. Desktop + fine-pointer only, and disabled
 * entirely under prefers-reduced-motion (this whole component is motion).
 *
 * Position is driven entirely outside React: a rAF loop lerps the render
 * position toward the real pointer target and writes a `translate3d`
 * transform straight to the DOM node. No React state, no re-render, no
 * layout property — this is what keeps it feeling attached to the mouse
 * instead of trailing behind it. React state is only touched when the
 * hovered *element* actually changes (rare), not on every pixel of motion.
 *
 * Interactive elements opt into richer states via a data attribute:
 *   data-cursor="view"   data-cursor-label="View" / "Open" / "Back" / "Drag"
 * Anything else that's clickable just grows the dot slightly.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    document.body.classList.add("has-custom-cursor");

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let renderX = targetX;
    let renderY = targetY;
    let lastEl: Element | null = null;
    let rafId = 0;

    function onMove(e: MouseEvent) {
      targetX = e.clientX;
      targetY = e.clientY;
      const el =
        (e.target as HTMLElement)?.closest?.("a, button, [data-cursor], [role=button]") ?? null;
      if (el !== lastEl) {
        lastEl = el;
        setIsPointer(Boolean(el));
        setHoverLabel(
          el?.getAttribute("data-cursor") ? el.getAttribute("data-cursor-label") : null
        );
      }
    }

    function tick() {
      // Fast lerp — tight enough to feel directly connected to the pointer,
      // just enough smoothing to stop sub-pixel jitter.
      renderX += (targetX - renderX) * 0.45;
      renderY += (targetY - renderY) * 0.45;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${renderX}px, ${renderY}px, 0) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      document.body.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <div
      ref={dotRef}
      aria-hidden
      className="cursor-dot pointer-events-none fixed left-0 top-0 z-[200] flex items-center justify-center will-change-transform"
    >
      <motion.div
        animate={{
          scale: hoverLabel ? 2.2 : isPointer ? 1.6 : 1,
          backgroundColor: isPointer ? "var(--color-azure)" : "var(--color-paper)",
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="h-2 w-2 rounded-full"
      />
      {hoverLabel && (
        <motion.span
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          className="absolute whitespace-nowrap rounded-full bg-azure px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white"
        >
          {hoverLabel}
        </motion.span>
      )}
    </div>
  );
}

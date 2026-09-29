import { AnimatePresence, motion } from "framer-motion";
import { DUR, EASE, useReducedMotionSafe } from "@/animations";
import { sectionLabelFor } from "./menuModel";

/**
 * "01 / 04 · Story" — a quiet "you are here" in the top bar (tablet and
 * up). Detail pages read "02 · Work · Competition". The label slides when
 * the page changes. Numbers match the menu's numbering.
 */
export function SectionIndicator({ pathname }: { pathname: string }) {
  const reduced = useReducedMotionSafe();
  const section = sectionLabelFor(pathname);
  const key = section ? `${section.count ?? ""}|${section.label}|${section.sub ?? ""}` : "none";
  const shift = reduced ? 0 : 10;

  return (
    <span className="chrome-indicator" aria-hidden="true">
      <AnimatePresence mode="popLayout" initial={false}>
        {section && (
          <motion.span
            key={key}
            className="chrome-indicator__label"
            initial={{ opacity: 0, y: shift }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -shift }}
            transition={{ duration: DUR.fast, ease: EASE.standard }}
          >
            {section.count && <span className="chrome-indicator__count">{section.count}</span>}
            <span className="chrome-indicator__name">{section.label}</span>
            {section.sub && <span className="chrome-indicator__sub">{section.sub}</span>}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

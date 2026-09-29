import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DUR, EASE, useReducedMotionSafe } from "@/animations";
import { cn } from "@/lib/cn";

export interface CopyEmailProps {
  email: string;
  className?: string;
  /** Visible text. Defaults to the address itself. */
  children?: ReactNode;
}

/**
 * The email address as a link that copies itself: a click puts the
 * address on the clipboard and says so in a small bubble (announced to
 * screen readers too). Where the clipboard isn't available — or with a
 * modified click — it behaves as a normal mailto: link.
 */
export function CopyEmail({ email, className, children }: CopyEmailProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const hintId = useId();
  const reduced = useReducedMotionSafe();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (!navigator.clipboard?.writeText) return; // plain mailto:
    event.preventDefault();
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <span className="copy-email">
      <a
        href={`mailto:${email}`}
        onClick={onClick}
        aria-describedby={hintId}
        data-cursor="view"
        data-cursor-label="Copy"
        className={cn("copy-email__link", className)}
      >
        {children ?? email}
      </a>
      <span id={hintId} className="sr-only">
        Copies the address
      </span>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Email address copied" : ""}
      </span>
      <AnimatePresence>
        {copied && (
          <motion.span
            key="copied"
            className="copy-email__bubble"
            aria-hidden="true"
            initial={{ opacity: 0, y: reduced ? 0 : 6, scale: reduced ? 1 : 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduced ? 0 : -4 }}
            transition={{ duration: DUR.fast, ease: EASE.snappy }}
          >
            Copied
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

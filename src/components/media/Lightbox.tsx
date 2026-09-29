import { useCallback, useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion, type PanInfo, type Variants } from "framer-motion";
import type { ResolvedImage } from "@/types/content";
import { useFocusTrap, useIsClient, useScrollLock } from "@/components/ui/dialog";
import { ProtectedImage } from "./ProtectedImage";
import { aspectOf, mediaUrl, pad2, protectMotionHandlers } from "./protection";
import { ChevronIcon, CloseIcon } from "./icons";

export interface LightboxProps {
  images: ResolvedImage[];
  /** Index of the open photo, or null when closed. */
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  /** Names the dialog — usually the record title. */
  title?: string;
}

/**
 * Full-screen photo viewer. A real modal: role="dialog" + aria-modal,
 * focus moves to Close and is trapped inside, the page behind is inert
 * and can't scroll, and focus returns to the photo that opened it.
 * Esc closes; ←/→ (and swipe) step through; Home/End jump to the ends.
 * Only the open photo and its two neighbours are ever requested, and
 * only once the viewer is opened. No download or save UI.
 *
 * Controlled: the parent owns `index` (null = closed).
 */
export function Lightbox(props: LightboxProps) {
  const isClient = useIsClient();
  if (!isClient) return null;
  const { index, images } = props;
  const open = index !== null && index >= 0 && index < images.length;
  return createPortal(
    <AnimatePresence>{open && <LightboxDialog key="lightbox" {...props} index={index} />}</AnimatePresence>,
    document.body
  );
}

const SWIPE_THRESHOLD = 70;

function LightboxDialog({
  images,
  index,
  onClose,
  onIndexChange,
  title,
}: Omit<LightboxProps, "index"> & { index: number }) {
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [direction, setDirection] = useState(0);
  const count = images.length;
  const image = images[index];

  useScrollLock(true);
  useFocusTrap(dialogRef, true, { initialFocus: closeRef, inertSelector: "#root" });

  const jump = useCallback(
    (target: number, dir: number) => {
      if (count < 2 || target === index) return;
      setDirection(dir);
      onIndexChange((target + count) % count);
    },
    [count, index, onIndexChange]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          jump(index - 1, -1);
          break;
        case "ArrowRight":
          jump(index + 1, 1);
          break;
        case "Home":
          jump(0, -1);
          break;
        case "End":
          jump(count - 1, 1);
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, count, jump, onClose]);

  // Warm the neighbours so stepping through feels instant.
  useEffect(() => {
    if (count < 2) return;
    for (const offset of [1, -1]) {
      const next = images[(index + offset + count) % count];
      const img = new Image();
      img.decoding = "async";
      img.src = mediaUrl(next.src);
    }
  }, [index, images, count]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const swipe = info.offset.x + info.velocity.x * 0.15;
    if (swipe < -SWIPE_THRESHOLD) jump(index + 1, 1);
    else if (swipe > SWIPE_THRESHOLD) jump(index - 1, -1);
  };

  const closeOnSelf = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const travel = reduced ? 0 : 64;
  const slide: Variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * travel, scale: reduced ? 1 : 0.985 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -travel, scale: reduced ? 1 : 0.985 }),
  };
  const ratio = aspectOf(image, 4 / 3, [0.25, 4]);
  // Grow small sources to fill the screen, but not past the point where they turn to mush.
  const sizeCap = image.width ? `, max(min(100cqw, 30rem), ${image.width * 2}px)` : "";

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.12 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      {...protectMotionHandlers}
    >
      <div className="lightbox__backdrop" aria-hidden="true" onClick={onClose} />

      <div className="lightbox__bar">
        <p id={titleId} className="lightbox__title">
          {title ?? "Photos"}
          <span className="sr-only"> — photo viewer</span>
        </p>
        <p className="lightbox__counter" aria-live="polite" aria-atomic="true">
          <span aria-hidden="true">
            {pad2(index + 1)}
            <span className="lightbox__counter-sep">/</span>
            {pad2(count)}
          </span>
          <span className="sr-only">
            Photo {index + 1} of {count}
            {image.caption ? `: ${image.caption}` : ""}
          </span>
        </p>
        <button
          ref={closeRef}
          type="button"
          className="lightbox__close"
          onClick={onClose}
          aria-label="Close photo viewer"
          data-cursor="close"
        >
          <span className="lightbox__close-label" aria-hidden="true">
            Close
          </span>
          <CloseIcon />
        </button>
      </div>

      <div className="lightbox__stage" onClick={closeOnSelf}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.figure
            key={index}
            className="lightbox__slide"
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduced ? 0.15 : 0.45, ease: [0.16, 1, 0.3, 1] }}
            // Swiping is movement the visitor drives, so it stays on under reduced motion.
            drag={count > 1 ? "x" : false}
            dragSnapToOrigin
            dragElastic={0.45}
            onDragEnd={onDragEnd}
            onClick={closeOnSelf}
          >
            <ProtectedImage
              image={image}
              fit="contain"
              priority
              className="lightbox__frame"
              style={{
                aspectRatio: String(ratio),
                width: `min(100cqw, calc(100cqh * ${ratio.toFixed(4)})${sizeCap})`,
              }}
            />
          </motion.figure>
        </AnimatePresence>

        {count > 1 && (
          <>
            <button
              type="button"
              className="lightbox__nav lightbox__nav--prev"
              onClick={() => jump(index - 1, -1)}
              aria-label="Previous photo"
            >
              <ChevronIcon dir="left" />
            </button>
            <button
              type="button"
              className="lightbox__nav lightbox__nav--next"
              onClick={() => jump(index + 1, 1)}
              aria-label="Next photo"
            >
              <ChevronIcon dir="right" />
            </button>
          </>
        )}
      </div>

      <div className="lightbox__foot">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={index}
            className="lightbox__caption"
            initial={{ opacity: 0, y: reduced ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            aria-hidden="true"
          >
            {image.caption ?? ""}
          </motion.p>
        </AnimatePresence>
        {count > 1 && (
          <div className="lightbox__progress" aria-hidden="true">
            <span
              className="lightbox__progress-fill"
              style={{ transform: `scaleX(${(index + 1) / count})` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

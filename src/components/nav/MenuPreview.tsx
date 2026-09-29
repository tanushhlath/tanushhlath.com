import { motion } from "framer-motion";
import { usePointerParallax } from "@/animations";
import { fitFor, ProtectedImage } from "@/components/media";
import type { MenuEntry, MenuKey, MenuPreview as Preview } from "./menuModel";

/**
 * The picture beside the menu list. Every item's preview is rendered once
 * when the menu opens (stacked, only one shown), so hovering between items
 * swaps instantly — a clip/scale crossfade driven by CSS (chrome.css,
 * `.menu-preview__card[data-shown]`). The frame drifts a few pixels with
 * the pointer and its caption at a different rate, for a little depth.
 * Decorative: the links next to it carry the meaning.
 *
 * The frame is a 4:5 portrait. A photo that a portrait crop would cut
 * into (a landscape certificate) is shown whole instead, over a blurred,
 * frame-filling copy of itself — the same rule every media frame on the
 * site uses (fitFor); a photo with a set focal point is always cropped.
 */

/** The preview frame's aspect ratio (width / height). */
const FRAME_RATIO = 4 / 5;

export function MenuPreviewPanel({ entries, shownKey }: { entries: MenuEntry[]; shownKey: MenuKey }) {
  const frame = usePointerParallax(-10);
  const caption = usePointerParallax(-18);
  const withPreview = entries.filter((e) => e.preview);

  return (
    <div className="menu-preview" aria-hidden="true">
      <motion.div className="menu-preview__frame" style={{ x: frame.x, y: frame.y, aspectRatio: FRAME_RATIO }}>
        {withPreview.map((entry) => {
          const preview = entry.preview!;
          const fit = preview.kind === "image" ? fitFor(preview.image, FRAME_RATIO) : undefined;
          return (
            <div
              key={entry.key}
              className="menu-preview__card"
              data-kind={preview.kind}
              data-fit={fit}
              data-shown={entry.key === shownKey ? "" : undefined}
            >
              <PreviewBody preview={preview} fit={fit} />
            </div>
          );
        })}
      </motion.div>
      <motion.div className="menu-preview__captions" style={{ x: caption.x, y: caption.y }}>
        {withPreview.map((entry) => {
          const text = captionFor(entry.preview!);
          if (!text) return null;
          return (
            <p key={entry.key} className="menu-preview__caption" data-shown={entry.key === shownKey ? "" : undefined}>
              {text.meta && <span className="menu-preview__meta">{text.meta}</span>}
              <span>{text.title}</span>
            </p>
          );
        })}
      </motion.div>
    </div>
  );
}

function captionFor(preview: Preview): { title: string; meta?: string } | null {
  return preview.kind === "image" ? { title: preview.caption, meta: preview.meta } : null;
}

/** "Tanushh Lath" → "TL" (Home's monogram). */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("");
}

function PreviewBody({ preview, fit = "cover" }: { preview: Preview; fit?: "cover" | "contain" }) {
  switch (preview.kind) {
    case "image":
      return (
        <>
          {fit === "contain" && (
            <ProtectedImage image={preview.image} fill fit="cover" alt="" className="menu-preview__backdrop" />
          )}
          <ProtectedImage image={preview.image} fill fit={fit} alt="" className="menu-preview__img" />
          <span className="menu-preview__veil" />
        </>
      );
    case "identity":
      return (
        <div className="menu-preview__type">
          <span className="menu-preview__mono">{initials(preview.name)}</span>
          <span className="menu-preview__kicker">{preview.kicker}</span>
          <span className="menu-preview__name">{preview.name}</span>
          <span className="menu-preview__line">{preview.line}</span>
        </div>
      );
    case "now":
      return (
        <div className="menu-preview__type">
          <span className="menu-preview__kicker menu-preview__kicker--live">
            <span className="menu-preview__pulse" />
            {preview.lead}
          </span>
          <span className="menu-preview__name">{preview.value}</span>
          {preview.meta && <span className="menu-preview__line">{preview.meta}</span>}
        </div>
      );
    case "count":
      return (
        <div className="menu-preview__type menu-preview__type--grid">
          <span className="menu-preview__big">{preview.value}</span>
          <span className="menu-preview__kicker">{preview.unit}</span>
          {preview.meta && <span className="menu-preview__line">{preview.meta}</span>}
        </div>
      );
    case "lenses":
      return (
        <div className="menu-preview__type menu-preview__type--lenses">
          <i className="menu-preview__path" />
          {preview.items.map((item, i) => (
            <span key={item} className="menu-preview__lens" style={{ ["--i" as string]: i }}>
              {item}
            </span>
          ))}
        </div>
      );
  }
}

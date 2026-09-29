import type { KeyboardEvent } from "react";

/**
 * Arrow-key focus movement for a row of buttons (filter bars, tab lists):
 * ←/→ (and ↑/↓) step between the row's buttons, Home/End jump to the
 * ends, wrapping around. Returns the newly focused button, or null when
 * the key isn't a navigation key — callers then let the event through.
 *
 * Only one button in the row is in the Tab order (the active one), so a
 * long row of filters costs keyboard users one Tab stop, not twelve.
 */
export function moveRovingFocus(
  event: KeyboardEvent<HTMLElement>,
  selector = "button:not([disabled])"
): HTMLButtonElement | null {
  const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
  if (!keys.includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return null;

  const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(selector));
  if (items.length === 0) return null;
  const current = items.indexOf(document.activeElement as HTMLButtonElement);

  let next: number;
  switch (event.key) {
    case "Home":
      next = 0;
      break;
    case "End":
      next = items.length - 1;
      break;
    case "ArrowLeft":
    case "ArrowUp":
      next = current <= 0 ? items.length - 1 : current - 1;
      break;
    default:
      next = current < 0 || current === items.length - 1 ? 0 : current + 1;
  }

  event.preventDefault();
  const target = items[next];
  target.focus();
  return target;
}

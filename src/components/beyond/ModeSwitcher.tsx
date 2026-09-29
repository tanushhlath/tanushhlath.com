import type { KeyboardEvent } from "react";
import { moveRovingFocus } from "@/components/ui/rovingFocus";
import { beyondModes, pages } from "@/lib/content";
import { BEYOND_MODES, type BeyondMode } from "@/routing/paths";
import { ModeEmblem } from "./glyphs";
import { pad2 } from "./modeState";

export interface ModeSwitcherProps {
  mode: BeyondMode;
  onChange: (mode: BeyondMode) => void;
}

/**
 * The three rooms of Beyond — Now, Next, Lab — as a real tab list. Each
 * room is a tile with its own drawn emblem (a pulse, a receding horizon,
 * a scribble on a grid); the chosen room widens while the others make
 * space (the container morphs, the content stays put) and its emblem
 * comes alive.
 *
 * Keyboard: one Tab stop; ←/→/Home/End move between rooms and open them.
 * Panels are labelled with tabPanelProps("beyond", mode).
 */
export function ModeSwitcher({ mode, onChange }: ModeSwitcherProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = moveRovingFocus(event, '[role="tab"]');
    const value = BEYOND_MODES.find((m) => m === target?.dataset.value);
    if (value && value !== mode) onChange(value);
  };

  return (
    <div
      role="tablist"
      aria-label={pages.beyond.title}
      aria-orientation="horizontal"
      className="by-rooms"
      data-mode={mode}
      onKeyDown={onKeyDown}
    >
      {BEYOND_MODES.map((value, index) => {
        const copy = beyondModes[value];
        const active = value === mode;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            id={`beyond-tab-${value}`}
            aria-controls={active ? `beyond-panel-${value}` : undefined}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            data-value={value}
            data-room={value}
            data-active={active ? "true" : "false"}
            className="by-room"
            data-cursor="view"
            data-cursor-label={copy.label}
            onClick={() => {
              if (!active) onChange(value);
            }}
          >
            <span className="by-room__surface" aria-hidden="true" />
            <span className="by-room__visual" aria-hidden="true">
              <ModeEmblem mode={value} />
            </span>
            <span className="by-room__text">
              <span className="by-room__index" aria-hidden="true">
                {pad2(index + 1)}
              </span>
              <span className="by-room__label font-display">{copy.label}</span>
              <span className="by-room__hint">
                <span className="sr-only">: </span>
                {copy.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

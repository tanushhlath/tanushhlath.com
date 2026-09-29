import { useEffect } from "react";
import { motionValue, springValue, useTransform, type MotionValue } from "framer-motion";
import { isBrowser, useFinePointer, useReducedMotionSafe } from "./env";
import { SPRING, motionSettings } from "./tokens";

/**
 * GLOBAL POINTER
 *
 * One pointermove listener for the whole site, applied once per animation
 * frame to two shared MotionValues: the pointer position across the window,
 * normalized to -1 (left / top edge) … 0 (centre) … 1 (right / bottom edge).
 * Nothing re-renders while the pointer moves — components bind the values
 * straight into `style`. The listener only exists while at least one
 * component uses it, and only for a mouse or trackpad: touch screens,
 * reduced motion and the `pointerEnabled` / `depthEnabled` switches all get
 * values that stay at 0.
 */

export interface PointerValues {
  /** -1 at the left edge of the window, 1 at the right. */
  x: MotionValue<number>;
  /** -1 at the top edge of the window, 1 at the bottom. */
  y: MotionValue<number>;
}

const raw: PointerValues = { x: motionValue(0), y: motionValue(0) };
/** Never set — handed to components whose pointer effects are switched off. */
const still: PointerValues = { x: motionValue(0), y: motionValue(0) };
/** Spring-smoothed followers of `raw`, created on first use (browser only). */
let smooth: PointerValues | null = null;

let users = 0;
let frameId = 0;
let clientX = 0;
let clientY = 0;
let width = 1;
let height = 1;

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

function apply() {
  frameId = 0;
  raw.x.set(clamp((clientX / width) * 2 - 1));
  raw.y.set(clamp((clientY / height) * 2 - 1));
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerType === "touch") return;
  clientX = event.clientX;
  clientY = event.clientY;
  if (!frameId) frameId = requestAnimationFrame(apply);
}

function measure() {
  width = window.innerWidth || 1;
  height = window.innerHeight || 1;
}

/** Drift back to the centre when the pointer leaves the window or the tab loses focus. */
function recentre() {
  if (frameId) cancelAnimationFrame(frameId);
  frameId = 0;
  raw.x.set(0);
  raw.y.set(0);
}

function onMouseOut(event: MouseEvent) {
  if (!event.relatedTarget) recentre();
}

function retain(): () => void {
  if (users++ === 0) {
    measure();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("blur", recentre);
    document.addEventListener("mouseout", onMouseOut);
  }
  return () => {
    if (--users > 0) return;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("resize", measure);
    window.removeEventListener("blur", recentre);
    document.removeEventListener("mouseout", onMouseOut);
    recentre();
  };
}

function getSmooth(): PointerValues {
  smooth ??= {
    x: springValue(raw.x, SPRING.pointer),
    y: springValue(raw.y, SPRING.pointer),
  };
  return smooth;
}

export interface PointerOptions {
  /**
   * true (default): lazily spring-smoothed (`SPRING.pointer`) — right for
   * ambient depth like the hero glow or portrait parallax. false: the raw
   * per-frame position.
   */
  smooth?: boolean;
  /** Keep the values at 0 for this component. */
  disabled?: boolean;
}

/** Whether pointer-driven depth runs for this visitor (false during prerender/hydration). */
export function usePointerEnabled(disabled = false): boolean {
  const fine = useFinePointer();
  const reduced = useReducedMotionSafe();
  return fine && !reduced && !disabled && motionSettings.pointerEnabled && motionSettings.depthEnabled;
}

/**
 * The pointer position across the window as shared MotionValues (-1 … 1).
 *
 *   const { x, y } = usePointer();
 *   const glowX = useTransform(x, (v) => v * 40);
 *   <motion.div style={{ x: glowX }} />
 */
export function usePointer({ smooth: smoothed = true, disabled = false }: PointerOptions = {}): PointerValues {
  const enabled = usePointerEnabled(disabled);
  useEffect(() => (enabled && isBrowser ? retain() : undefined), [enabled]);
  if (!enabled) return still;
  return smoothed ? getSmooth() : raw;
}

/**
 * Pointer parallax in px: the element slides up to `distance` px toward the
 * pointer (negative → away from it, which reads as further back).
 *
 *   const { x, y } = usePointerParallax(12);
 *   <motion.img style={{ x, y }} />
 */
export function usePointerParallax(distance: number, options?: PointerOptions): PointerValues {
  const pointer = usePointer(options);
  const x = useTransform(pointer.x, (v) => v * distance);
  const y = useTransform(pointer.y, (v) => v * distance);
  return { x, y };
}

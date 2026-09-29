import { transform, useTransform, type MotionValue } from "framer-motion";
import type { useSectionProgress } from "@/animations";

/** Framer scroll offsets accepted by `useSectionProgress`. */
export type ScrollOffsets = Exclude<Parameters<typeof useSectionProgress>[1], string | undefined>;

/**
 * `useTransform(value, input, output)` computed in JS on every frame.
 *
 * Framer Motion hands array-range transforms of scroll progress for
 * opacity / filter / clip-path to a native ViewTimeline when the offsets
 * look like one of its presets — and for elements taller than the screen
 * the native "exit"/"entry" ranges don't match Framer's own definition
 * (the hero's wrapper is 1.5 screens tall), so the fade would start late.
 * A function transformer keeps the mapping exactly as written.
 */
export function useRange(value: MotionValue<number>, input: number[], output: number[]): MotionValue<number> {
  const map = transform(input, output);
  return useTransform(value, (v) => map(v));
}

/** Two-digit index: 1 → "01". */
export const pad = (n: number) => String(n).padStart(2, "0");

/** "That's the surface. There's a lot more underneath." → ["That's the surface.", "There's a lot more underneath."] */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** "Tanushh Lath" → ["Tanushh", "Lath"]; a one-word name keeps an empty second line. */
export function splitName(name: string): [string, string] {
  const [first = name, ...rest] = name.trim().split(/\s+/);
  return [first, rest.join(" ")];
}

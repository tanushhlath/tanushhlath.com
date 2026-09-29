import { useCallback, useState } from "react";
import { useLocation } from "react-router-dom";
import { useHydrated } from "@/animations";

/**
 * A selection that a deep link can set: /me/#skill-writing opens the
 * Writing skill, /me/#interest-horse-riding selects Horse Riding.
 *
 *   const [openId, choose] = useHashChoice("skill-", (id) => Boolean(getSkill(id)), null);
 *
 * - Prerender + hydration render use `fallback` (the server can't see the
 *   fragment), so hydration always matches; the fragment applies right
 *   after mount.
 * - A visitor's own choice wins until the next navigation (each history
 *   entry has its own location.key): a new deep link to a matching
 *   fragment re-selects, any other navigation keeps the choice. Choosing
 *   never rewrites the URL, so two of these on one page don't fight over
 *   the fragment.
 * - The element with id `${prefix}${value}` is the scroll target;
 *   <ScrollManager> already scrolls deep links to it.
 */
export function useHashChoice<T extends string | null>(
  prefix: string,
  isValid: (id: string) => boolean,
  fallback: T
): readonly [T | string, (value: T | string) => void] {
  const { hash, key } = useLocation();
  const hydrated = useHydrated();
  const [picked, setPicked] = useState<{ value: T | string; key: string } | null>(null);

  const fromHash = hydrated ? readFragment(hash, prefix) : undefined;
  const validFromHash = fromHash !== undefined && isValid(fromHash) ? fromHash : undefined;

  let value: T | string;
  if (picked && picked.key === key) value = picked.value;
  else value = validFromHash ?? (picked ? picked.value : fallback);

  const choose = useCallback((next: T | string) => setPicked({ value: next, key }), [key]);
  return [value, choose] as const;
}

function readFragment(hash: string, prefix: string): string | undefined {
  const raw = hash.replace(/^#/, "");
  if (!raw.startsWith(prefix)) return undefined;
  try {
    return decodeURIComponent(raw.slice(prefix.length));
  } catch {
    return undefined;
  }
}

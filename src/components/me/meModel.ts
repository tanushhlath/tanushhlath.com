import { getProject, getEvent, getWorkEntry, navigation, site } from "@/lib/content";
import { pathOf, paths } from "@/routing/paths";
import type { ResolvedImage } from "@/types/content";

/**
 * ME — small derived values shared by the Me page components. Everything
 * here is computed from src/content/ (site.ts, interests.ts, navigation),
 * never typed in, so editing the content updates the page.
 */

/** "03" — Me's number in the menu (navigation.primary order). */
export function mePageIndex(): string | undefined {
  const i = navigation.primary.findIndex((item) => pathOf(item.href) === paths.me());
  return i >= 0 ? String(i + 1).padStart(2, "0") : undefined;
}

/** "Grade 11", read from the short bio ("I'm a Grade 11 student …"). */
export function schoolGrade(): string | undefined {
  return site.bioShort.match(/\bGrade\s+\d+\b/i)?.[0];
}

/**
 * The two halves of `site.location.short`
 * ("Born & brought up in Dubai, UAE" / "Schooling in Jaipur, India").
 */
export function locationLines(): string[] {
  return site.location.short
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
}

/** The portrait for large frames (full-size source), cropped to the face. */
export const PORTRAIT: ResolvedImage = {
  src: site.photo.src,
  alt: site.photo.alt,
  // The source is landscape with the face just left of centre, high up:
  // tall frames keep the head and shoulders.
  focus: "48% 26%",
};

/** The same portrait at the small size, for the round signature at the end. */
export const PORTRAIT_SMALL: ResolvedImage = {
  src: site.photo.small ?? site.photo.src,
  alt: "",
  focus: "48% 22%",
};

/** Menu description for an internal href ("/story/" → "How I got here"). */
export function navDescription(href: string): string | undefined {
  const path = pathOf(href);
  return [navigation.home, ...navigation.primary, ...navigation.secondary].find(
    (item) => pathOf(item.href) === path
  )?.description;
}

export interface WorkLinkItem {
  id: string;
  title: string;
  href: string;
  meta?: string;
  cover?: ResolvedImage;
}

/** A project or event as a compact link (title, canonical href, cover). */
export function workLink(id: string): WorkLinkItem | undefined {
  const entry = getWorkEntry(id);
  if (!entry) return undefined;
  const when = entry.dateLabel ?? (entry.year !== undefined ? String(entry.year) : undefined);
  return {
    id,
    title: entry.title,
    href: entry.href,
    meta: [entry.typeLabel, when].filter(Boolean).join(" · "),
    cover: entry.cover,
  };
}

/** Related projects then events of an interest, as links (dangling ids skipped). */
export function interestLinks(ids: { projects?: string[]; events?: string[] }): WorkLinkItem[] {
  const out: WorkLinkItem[] = [];
  for (const id of ids.projects ?? []) {
    if (getProject(id)) {
      const link = workLink(id);
      if (link) out.push(link);
    }
  }
  for (const id of ids.events ?? []) {
    if (getEvent(id)) {
      const link = workLink(id);
      if (link) out.push(link);
    }
  }
  return out;
}

/** Zero-padded 1-based index: 0 → "01". */
export const pad2 = (n: number) => String(n + 1).padStart(2, "0");

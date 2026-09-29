import type { AnchorHTMLAttributes, MouseEvent, ReactNode, Ref } from "react";
import { fileHref, useFileMode } from "./fileMode";
import { useNavigationController } from "./navigation";
import { isExternalHref, normalizeHref } from "./paths";

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  /**
   * Where the link goes: a `paths.*` value ("/work/wizmo/", "/me/#skills"),
   * a same-page anchor ("#skills") or an external URL / mailto: / tel:.
   */
  href: string;
  children?: ReactNode;
  /** Animate the route change with a view transition (default true; never under reduced motion). */
  viewTransition?: boolean;
  /** Replace the current history entry instead of adding one. */
  replace?: boolean;
  /** History state for the new entry. */
  state?: unknown;
  ref?: Ref<HTMLAnchorElement>;
}

/** http(s):// and protocol-relative URLs — the ones that open in a new tab. */
const WEB_URL = /^(https?:)?\/\//i;

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey;
}

/**
 * The site's one link component — always a real <a href>, so links work
 * without JavaScript, can be opened in a new tab, and are crawlable.
 *
 *   <Link href={paths.workItem("wizmo")}>Wizmo</Link>
 *   <Link href={paths.me("skills")}>Skills</Link>
 *   <Link href="#personal-details">Jump down</Link>
 *   <Link href={site.social[1].url}>LinkedIn ↗</Link>
 *
 * Internal clicks follow the rules in navigation.ts: another page opens
 * inside a view transition (the ScrollManager then scrolls to the #anchor
 * or the top), a link to the current page re-opens it, same-page anchors
 * smooth-scroll, Work/Beyond/Explore fragments switch UI state, and in
 * file mode other pages load as real …/index.html files.
 *
 * External http(s) links open in a new tab with rel="noopener noreferrer".
 * The visible ↗ is NOT added here — callers put it in the label (or use
 * <ExternalLink>), so the arrow always sits where the design wants it.
 *
 * `onClick` runs first; calling `event.preventDefault()` in it cancels
 * the navigation. Modified clicks (⌘/Ctrl/Shift/middle) and
 * `target="_blank"` are left to the browser.
 */
export default function Link({
  href,
  viewTransition,
  replace,
  state,
  onClick,
  target,
  rel,
  ref,
  ...rest
}: LinkProps) {
  const fileMode = useFileMode();
  const navigateTo = useNavigationController();

  if (isExternalHref(href)) {
    const web = WEB_URL.test(href);
    return (
      <a
        ref={ref}
        href={href}
        target={target ?? (web ? "_blank" : undefined)}
        rel={rel ?? (web ? "noopener noreferrer" : undefined)}
        onClick={onClick}
        {...rest}
      />
    );
  }

  const canonical = normalizeHref(href);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || !isPlainLeftClick(event)) return;
    if ((target && target !== "_self") || rest.download !== undefined) return;
    if (navigateTo(canonical, { replace, state, viewTransition }) === "app") event.preventDefault();
  };

  return (
    <a
      ref={ref}
      href={fileMode ? fileHref(canonical) : canonical}
      target={target}
      rel={rel}
      onClick={handleClick}
      {...rest}
    />
  );
}

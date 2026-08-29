export interface NavItem {
  href: string;
  label: string;
  short: string;
  hint: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * Five primary destinations — this is the whole site. Everything else
 * (Archive, Explore) is a secondary exploration tool, not a sixth
 * destination, and lives in its own group in the menu.
 */
export const primaryNav: NavItem[] = [
  { href: "/", label: "Home", short: "home", hint: "The entrance" },
  { href: "/story", label: "Story", short: "story", hint: "How I got here" },
  { href: "/work", label: "Work", short: "work", hint: "Built, did, recognized" },
  { href: "/me", label: "Me", short: "me", hint: "Who I am, beyond the work" },
  { href: "/beyond", label: "Beyond", short: "beyond", hint: "Now, next, and the lab" },
];

export const secondaryNav: NavItem[] = [
  { href: "/archive", label: "Archive", short: "archive", hint: "Everything, organized" },
  { href: "/explore", label: "Explore", short: "explore", hint: "Find connections a different way" },
];

/** Grouped navigation used by the full-menu overlay. */
export const navGroups: NavGroup[] = [
  { title: "Primary", items: primaryNav.filter((n) => n.href !== "/") },
  { title: "Discover", items: secondaryNav },
];

export const flatNav: NavItem[] = primaryNav;

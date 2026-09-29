import { useSyncExternalStore } from "react";
import { Parallax, Reveal } from "@/animations";
import { CopyEmail } from "@/components/ui/CopyEmail";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { getArchiveYears, getLatestNowUpdate, navigation, site } from "@/lib/content";
import Link from "@/routing/Link";

/**
 * FOOTER — the quiet last line of every page (REQUIREMENTS §140): name,
 * a one-line sign-off, email (click copies), LinkedIn ↗, Archive and
 * Explore, the copyright, and — very small, beside it — the Easter egg
 * hint. Everything comes from `site` / `navigation` in
 * src/content/site.ts. Not a second menu.
 *
 * A giant, barely-there wordmark sits behind it and drifts as the footer
 * scrolls in; the rows rise in (and back out when you scroll up again).
 */

const subscribeNever = () => () => {};
/**
 * The prerendered year is the year of the latest "Now" update (the same
 * value on the server and during hydration); right after hydration it
 * becomes the visitor's current year.
 */
const CONTENT_YEAR = Number((getLatestNowUpdate() ?? "").slice(0, 4)) || Math.max(...getArchiveYears());
const currentYear = () => new Date().getFullYear();
const contentYear = () => CONTENT_YEAR;

export function Footer() {
  const year = useSyncExternalStore(subscribeNever, currentYear, contentYear);
  const socials = site.social.filter((s) => !s.url.startsWith("mailto:"));

  return (
    <footer id="site-footer" className="site-footer">
      <div className="site-footer__mark" aria-hidden="true">
        <Parallax speed={-0.12} className="site-footer__mark-inner">
          {site.shortName}
        </Parallax>
      </div>

      <div className="site-footer__inner">
        <Reveal variant="rise" className="site-footer__top">
          <div className="site-footer__sign">
            <p className="site-footer__name">{site.name}</p>
            <p className="site-footer__line">{site.footerLine}</p>
          </div>

          <nav aria-label="Footer" className="site-footer__links">
            <ul className="site-footer__contact">
              <li>
                <CopyEmail email={site.email} className="site-footer__email" />
              </li>
              {socials.map((s) => (
                <li key={s.url}>
                  <ExternalLink href={s.url} className="site-footer__link">
                    {s.label}
                  </ExternalLink>
                </li>
              ))}
            </ul>
            <ul className="site-footer__pages">
              {navigation.secondary.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="site-footer__link" data-cursor="view" data-cursor-label="Go">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Reveal>

        <Reveal variant="fade" delay={0.1} className="site-footer__bottom">
          <p className="site-footer__copy">
            © <span>{year}</span> {site.name}
          </p>
          <p className="site-footer__egg">{site.easterEggHint}</p>
        </Reveal>
      </div>
    </footer>
  );
}

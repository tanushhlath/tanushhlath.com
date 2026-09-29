import { Reveal, TextReveal } from "@/animations";
import { ProtectedImage } from "@/components/media";
import { CopyEmail, ExternalLink } from "@/components/ui";
import Link from "@/routing/Link";
import { meCopy, site } from "@/lib/content";
import { PORTRAIT_SMALL, navDescription } from "./meModel";

/**
 * THE GENTLE ENDING — a small round portrait as a signature, the closing
 * question from meCopy.closing, two doors onward (Story, Beyond — each
 * with its menu description), and how to reach him. The two doors arrive
 * from opposite sides (split reveal) and lean in on hover.
 */
export function MeOnward() {
  const { heading, links } = meCopy.closing;
  const email = site.social.find((s) => s.url.startsWith("mailto:"));
  const profiles = site.social.filter((s) => !s.url.startsWith("mailto:"));

  return (
    <section id="me-onward" className="me-section me-onward" aria-labelledby="me-onward-title">
      <div className="me-container">
        <div className="me-onward__sign">
          <Reveal variant="scale" className="me-onward__avatar">
            <ProtectedImage image={PORTRAIT_SMALL} fill sizes="6rem" />
          </Reveal>
          <TextReveal
            as="h2"
            id="me-onward-title"
            text={heading}
            className="me-onward__title font-display"
          />
        </div>

        <nav className="me-onward__doors" aria-labelledby="me-onward-title">
          {links.map((link, i) => {
            const description = navDescription(link.href);
            return (
              <Reveal
                key={link.href}
                variant={i % 2 === 0 ? "split-left" : "split-right"}
                delay={0.08 * i}
                className="me-onward__door-wrap"
              >
                <Link href={link.href} className="me-onward__door" data-cursor="explore" data-cursor-label="Go">
                  {description && <span className="me-onward__desc">{description}</span>}
                  <span className="me-onward__label font-display">{link.label}</span>
                  <span className="me-onward__arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </nav>

        {(email || profiles.length > 0) && (
          <Reveal variant="fade" delay={0.15} className="me-onward__contact">
            {email && <CopyEmail email={site.email} className="me-onward__email" />}
            {profiles.map((profile) => (
              <ExternalLink key={profile.url} href={profile.url} className="me-onward__profile">
                {profile.label}
              </ExternalLink>
            ))}
          </Reveal>
        )}
      </div>
    </section>
  );
}

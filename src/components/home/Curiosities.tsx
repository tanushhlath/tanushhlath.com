import { Parallax, Stagger, StaggerItem } from "@/animations";
import { getHomeInterests, home } from "@/lib/content";
import { pad } from "./homeUtils";
import { HomeLink, SectionIntro } from "./parts";

/**
 * CURIOSITIES — a teaser for Me's "What I care about": the interests
 * chosen in home.ts (care.ids) by title only, each with its own onward
 * link to the proof from interests.ts (horse riding → the Inter-House
 * Horse Riding event, as the content requires). Why each one matters —
 * the note — is told once, on Me (the section's link).
 *
 * Three columns unroll from the edge that enters first (reversible clip
 * reveal); behind each, an oversized outlined numeral floats up at its own
 * speed, so the band has foreground, midground and background layers.
 */
export function Curiosities() {
  const copy = home.care;
  const interests = getHomeInterests();
  if (interests.length === 0) return null;

  return (
    <section id={copy.id ?? "curiosities"} className="home-section home-care" aria-labelledby="home-care-title">
      <div className="home-container">
        <SectionIntro
          kicker={copy.kicker}
          heading={copy.heading ?? copy.kicker}
          headingId="home-care-title"
          cta={copy.cta}
          ctaCursor="explore"
        />
        <Stagger as="ol" variant="clip" gap={0.1} className="home-care__list">
          {interests.map((interest, i) => (
            <StaggerItem as="li" key={interest.id} className="home-care__item">
              <Parallax speed={0.12 + i * 0.06} className="home-care__numeral" aria-hidden="true">
                {pad(i + 1)}
              </Parallax>
              <p className="home-care__category">{interest.category}</p>
              <h3 className="home-care__title">{interest.title}</h3>
              {interest.link && (
                <HomeLink href={interest.link.href} cursor="explore" className="home-care__link">
                  {interest.link.label}
                </HomeLink>
              )}
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

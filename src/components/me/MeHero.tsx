import { MaskReveal, Parallax, Reveal, Stagger, StaggerItem, TextReveal, Tilt, TiltLayer } from "@/animations";
import { ProtectedImage } from "@/components/media";
import { CopyEmail, ExternalLink, Kicker } from "@/components/ui";
import { meCopy, pages, site } from "@/lib/content";
import { PORTRAIT, locationLines, mePageIndex, schoolGrade } from "./meModel";

/**
 * ME HERO — portrait-led, like the opening spread of a magazine profile.
 *
 *   left   the portrait on a layered stage: a warm backing plate (furthest
 *          back), the photo (mask wipe + settling zoom), and a name plate
 *          floating in front. The three layers drift apart with scroll
 *          (parallax at different speeds) and separate toward the pointer
 *          (Tilt + TiltLayer, mouse/trackpad only).
 *   right  "Who I am" → the page heading → a profile ledger woven from
 *          site.ts: where I'm from (Dubai home, schooling in Jaipur),
 *          school + grade, and how to reach me.
 *
 * Phones stack heading → portrait → ledger (recomposed in me.css, not
 * shrunk). Every piece reveals reversibly.
 */
export function MeHero() {
  const copy = pages.me;
  const heading = copy.heading ?? copy.title;
  const emphasis = heading.split(" ").pop();
  const grade = schoolGrade();
  const place = locationLines();
  const email = site.social.find((s) => s.url.startsWith("mailto:"));
  const profiles = site.social.filter((s) => !s.url.startsWith("mailto:"));

  return (
    <header className="me-hero">
      <div className="me-container me-hero__grid">
        <div className="me-hero__heading">
          {copy.kicker && (
            <Reveal variant="fade">
              <Kicker index={mePageIndex()} tone="ember">
                {copy.kicker}
              </Kicker>
            </Reveal>
          )}
          <TextReveal
            as="h1"
            id="me-title"
            text={heading}
            emphasis={emphasis}
            delay={0.12}
            className="me-hero__title font-display"
            emphasisClassName="me-hero__emphasis"
          />
        </div>

        <div className="me-hero__portrait">
          <Parallax speed={-0.05} className="me-portrait">
            <Tilt max={4} scale={1} perspective={1400} glare className="me-portrait__stage">
              <Parallax speed={-0.1} className="me-portrait__plate-wrap" aria-hidden="true">
                <TiltLayer depth={-16} className="me-portrait__plate-layer">
                  <Reveal variant="scale" delay={0.05} className="me-portrait__plate" />
                </TiltLayer>
              </Parallax>

              <MaskReveal direction="vertical" delay={0.18} zoom={1.1} className="me-portrait__frame">
                <ProtectedImage
                  image={PORTRAIT}
                  fill
                  priority
                  sizes="(min-width: 48rem) 42vw, 86vw"
                  className="me-portrait__photo"
                />
                <span className="me-portrait__veil" aria-hidden="true" />
              </MaskReveal>

              <Parallax speed={0.08} className="me-portrait__plate-front">
                <TiltLayer depth={22}>
                  <Reveal variant="rise" distance={18} delay={0.6} className="me-portrait__nameplate">
                    <span className="me-portrait__name font-display">{site.name}</span>
                    <span className="me-portrait__home">{site.location.home}</span>
                  </Reveal>
                </TiltLayer>
              </Parallax>
            </Tilt>
          </Parallax>
        </div>

        <Stagger as="dl" gap={0.08} delay={0.35} className="me-ledger">
          <StaggerItem className="me-ledger__row">
            <dt className="me-ledger__label">{meCopy.locationLabel}</dt>
            <dd className="me-ledger__value">
              {place.map((line, i) => (
                <span key={line} className={i === 0 ? "me-ledger__main" : "me-ledger__sub"}>
                  {line}
                </span>
              ))}
            </dd>
          </StaggerItem>
          <StaggerItem className="me-ledger__row">
            <dt className="me-ledger__label">{meCopy.schoolLabel}</dt>
            <dd className="me-ledger__value">
              <span className="me-ledger__main">{site.school}</span>
              {grade && <span className="me-ledger__sub">{grade}</span>}
            </dd>
          </StaggerItem>
          {(email || profiles.length > 0) && (
            <StaggerItem className="me-ledger__row me-ledger__row--contact">
              <dt className="sr-only">{[email?.label, ...profiles.map((p) => p.label)].filter(Boolean).join(" / ")}</dt>
              <dd className="me-ledger__value me-ledger__contact">
                {email && <CopyEmail email={site.email} className="me-ledger__email" />}
                {profiles.map((profile) => (
                  <ExternalLink key={profile.url} href={profile.url} className="me-ledger__profile">
                    {profile.label}
                  </ExternalLink>
                ))}
              </dd>
            </StaggerItem>
          )}
        </Stagger>
      </div>
    </header>
  );
}

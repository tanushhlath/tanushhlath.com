import type { CSSProperties } from "react";
import { MaskReveal, Parallax, Reveal, Tilt, TiltLayer } from "@/animations";
import { MediaCover } from "@/components/media";
import { ProjectArt } from "@/components/work/ProjectArt";
import Link from "@/routing/Link";
import { cn } from "@/lib/cn";
import { getHomeFeatured, home, type WorkEntry } from "@/lib/content";
import { workTransitionName } from "@/routing/transitions";
import { SectionIntro } from "./parts";

/**
 * WORK PREVIEWS — a tease, not a dump: the records chosen in home.ts
 * (featuredWork.ids), image-led.
 *
 * Two columns moving at different speeds (the right one floats up faster
 * — depth by parallax). Each frame takes the shape of its own picture
 * (within limits), so the grid never reads as a table. The cover opens
 * out of a wipe (image expansion, reversible), leans toward the pointer
 * in 3D with the recognition badge floating in front of it, and carries
 * the shared-element name so it morphs into the detail page's hero on
 * click. A project without photos yet shows its designed category artwork
 * (the same one the Work page uses), whose planes separate in depth
 * inside the tilt.
 */

/** Frame shape from the cover's own proportions, kept between 4:5 and 16:10. */
function frameAspect(entry: WorkEntry): string {
  const { width, height } = entry.cover ?? {};
  if (!width || !height) return "4/3";
  const ratio = Math.min(1.6, Math.max(0.8, width / height));
  return `${Math.round(ratio * 100)}/100`;
}

export function FeaturedWork() {
  const copy = home.featuredWork;
  const entries = getHomeFeatured();
  if (entries.length === 0) return null;

  const left = entries.filter((_, i) => i % 2 === 0);
  const right = entries.filter((_, i) => i % 2 === 1);

  return (
    <section id={copy.id ?? "work"} className="home-section home-work" aria-labelledby="home-work-title">
      <div className="home-container">
        <SectionIntro
          kicker={copy.kicker}
          heading={copy.heading ?? copy.kicker}
          headingId="home-work-title"
          cta={copy.cta}
          size="lg"
        />
        <div className={cn("home-work__grid", right.length === 0 && "home-work__grid--single")}>
          <div className="home-work__col">
            {left.map((entry, i) => (
              <WorkCard key={entry.id} entry={entry} index={i * 2} />
            ))}
          </div>
          {right.length > 0 && (
            <Parallax speed={0.16} className="home-work__col home-work__col--offset">
              {right.map((entry, i) => (
                <WorkCard key={entry.id} entry={entry} index={i * 2 + 1} />
              ))}
            </Parallax>
          )}
        </div>
      </div>
    </section>
  );
}

function WorkCard({ entry, index }: { entry: WorkEntry; index: number }) {
  const aspect = frameAspect(entry);
  const when = entry.dateLabel ?? (entry.year !== undefined ? String(entry.year) : undefined);
  const meta = [entry.typeLabel, entry.categoryLabel, when].filter(Boolean).join(" · ");
  const vtName = workTransitionName(entry.id);

  return (
    <article className="home-work__item">
      <Link href={entry.href} className="home-work-card group" data-cursor="view" data-cursor-label="View">
        <Tilt max={5} glare className="home-work-card__tilt">
          <MaskReveal
            direction={index % 2 === 0 ? "vertical" : "horizontal"}
            className="home-work-card__media"
            style={{ aspectRatio: aspect }}
          >
            {entry.cover ? (
              <MediaCover
                image={entry.cover}
                title={entry.title}
                label={entry.categoryLabel}
                aspect={aspect}
                vtName={vtName}
                sizes="(min-width: 1024px) 36rem, (min-width: 768px) 46vw, 92vw"
              />
            ) : (
              <span className="home-work-card__art" style={{ viewTransitionName: vtName } as CSSProperties}>
                <ProjectArt category={entry.category} title={entry.title} label={entry.statusLabel} variant="card" />
              </span>
            )}
          </MaskReveal>
          {entry.recognition && (
            <TiltLayer depth={20} className="home-work-card__badge">
              <span className="home-work-card__badge-mark" aria-hidden="true" />
              {entry.recognition.result}
            </TiltLayer>
          )}
        </Tilt>
        <Reveal variant="rise" distance={20} delay={0.12} className="home-work-card__body">
          <p className="home-work-card__meta">{meta}</p>
          <h3 className="home-work-card__title">
            <TitleWithArrow title={entry.title} />
          </h3>
          <p className="home-work-card__summary">{entry.summary}</p>
        </Reveal>
      </Link>
    </article>
  );
}

/** The arrow rides on the title's last word, so it never wraps onto a line of its own. */
function TitleWithArrow({ title }: { title: string }) {
  const cut = title.lastIndexOf(" ");
  const head = cut > 0 ? title.slice(0, cut + 1) : "";
  const last = cut > 0 ? title.slice(cut + 1) : title;
  return (
    <>
      {head}
      <span className="home-work-card__last">
        {last}
        <span className="home-work-card__arrow" aria-hidden="true">
          →
        </span>
      </span>
    </>
  );
}

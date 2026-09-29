import { Reveal, Stagger, StaggerItem, Tilt, TiltLayer } from "@/animations";
import { Kicker, Tag } from "@/components/ui";
import { ProjectVisual } from "@/components/work";
import Link from "@/routing/Link";
import { storyCopy } from "@/lib/content";
import { workTransitionName } from "@/routing/transitions";
import type { StoryModel } from "./storyModel";

/**
 * Where the story hands over. The timeline's spine runs out into a
 * dashed line (still being written), then two ways on:
 *  - the project the story most recently led to, as a tilting card;
 *  - Work, Me and Beyond as large numbered doorways (menu numbering and
 *    descriptions from the site navigation), which shift and brighten on
 *    hover/focus while the others step back. The descriptions stay
 *    readable at rest (no hover needed, so touch screens get them too).
 */
export function StoryOnward({ model }: { model: StoryModel }) {
  const { ledTo, onward } = model;
  if (!ledTo && onward.length === 0) return null;

  return (
    <nav id="story-onward" className="story-onward" aria-labelledby="story-onward-label">
      <div className="story-onward__inner">
        <Reveal variant="fade" className="story-onward__head">
          <Kicker id="story-onward-label" tone="quiet">
            {storyCopy.onward}
          </Kicker>
        </Reveal>

        <div className="story-onward__grid">
          {ledTo && (
            <Reveal variant="split-left" className="story-onward__led">
              <Tilt max={5} className="story-led">
                <Link href={ledTo.href} className="story-led__link group" data-cursor="view" data-cursor-label="Open">
                  <span className="story-led__cover" style={{ viewTransitionName: workTransitionName(ledTo.id) }}>
                    <ProjectVisual entry={ledTo} sizes="(min-width: 64rem) 30rem, 90vw" />
                  </span>
                  <TiltLayer as="span" depth={18} className="story-led__body">
                    <span className="story-led__lead">{storyCopy.continueLead}</span>
                    <span className="story-led__title font-display">{ledTo.title}</span>
                    <span className="story-led__summary">{ledTo.summary}</span>
                    <span className="story-led__meta">
                      <Tag>{ledTo.typeLabel}</Tag>
                      {ledTo.statusLabel && <Tag tone="accent" dot>{ledTo.statusLabel}</Tag>}
                      <span className="story-led__arrow" aria-hidden="true">
                        →
                      </span>
                    </span>
                  </TiltLayer>
                </Link>
              </Tilt>
            </Reveal>
          )}

          <Stagger as="ul" className="story-doors" gap={0.09} variant="split-right">
            {onward.map((item) => (
              <StaggerItem as="li" key={item.href} className="story-doors__item">
                <Link href={item.href} className="story-door" data-cursor="view" data-cursor-label={item.label}>
                  <span className="story-door__sweep" aria-hidden="true" />
                  <span className="story-door__index">{item.index}</span>
                  <span className="story-door__label font-display">{item.label}</span>
                  <span className="story-door__description">{item.description}</span>
                  <span className="story-door__arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </nav>
  );
}

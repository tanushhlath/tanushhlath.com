import { Reveal, Stagger, StaggerItem } from "@/animations";
import { MediaCover } from "@/components/media";
import { SectionHeader } from "@/components/ui";
import { ProjectArt } from "@/components/work";
import { detailCopy, meCopy } from "@/lib/content";
import Link from "@/routing/Link";
import { paths } from "@/routing/paths";
import { type ConnectionCard, type DetailConnections as Connections } from "./model";
import type { ReturnTrail } from "./returnTrail";

export interface DetailConnectionsProps {
  connections: Connections;
  /** History state for links to other records (this record becomes their "Back to"). */
  linkState: ReturnTrail["branchState"];
}

/**
 * "Connected" (anchor #connections): everything this record links to and
 * everything that links to it — skills (each opens its proof on /me/),
 * the projects and events it grew out of or led to, and the Story
 * moments it belongs to. Every link is built from ids.
 */
export function DetailConnections({ connections, linkState }: DetailConnectionsProps) {
  const { skills, groups, count } = connections;
  if (count === 0) return null;
  const { related } = detailCopy;

  return (
    <section id="connections" className="dt-conn" aria-labelledby="connections-title">
      <div className="dt-shell">
        <SectionHeader title={related.heading} headingId="connections-title" />

        {skills.length > 0 && (
          <div className="dt-conn__row dt-conn__row--skills">
            <Reveal variant="fade" className="dt-conn__lead">
              <p>{related.skills}</p>
            </Reveal>
            <Stagger as="ul" className="dt-skills" gap={0.05}>
              {skills.map((skill) => (
                <StaggerItem as="li" key={skill.id}>
                  <Link
                    href={paths.me(`skill-${skill.id}`)}
                    className="dt-skill"
                    data-cursor="view"
                    data-cursor-label={meCopy.skills.open}
                  >
                    <span className="dt-skill__name">{skill.name}</span>
                    <span className="dt-skill__arrow" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.id} className="dt-conn__row" data-group={group.id}>
            <Reveal variant="fade" className="dt-conn__lead">
              <p>{group.lead}</p>
            </Reveal>
            <Stagger as="ul" className="dt-conn__grid" gap={0.07}>
              {group.cards.map((card) => (
                <StaggerItem as="li" key={card.key}>
                  <Card card={card} linkState={linkState} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        ))}
      </div>
    </section>
  );
}

function Card({ card, linkState }: { card: ConnectionCard; linkState: DetailConnectionsProps["linkState"] }) {
  if (card.kind === "story" && card.moment) {
    return (
      <Link href={card.href} className="dt-card dt-card--story group" data-cursor="read" data-cursor-label="Story">
        <span className="dt-card__year font-display" aria-hidden="true">
          {card.moment.year}
        </span>
        <span className="dt-card__body">
          <span className="dt-card__meta">{card.meta}</span>
          <span className="dt-card__title font-display">{card.title}</span>
          <span className="dt-card__summary">{card.moment.summary}</span>
        </span>
        <span className="dt-card__arrow" aria-hidden="true">
          →
        </span>
      </Link>
    );
  }

  const entry = card.entry;
  return (
    <Link href={card.href} state={linkState} className="dt-card group" data-cursor="view" data-cursor-label="Open">
      <span className="dt-card__cover">
        {entry && entry.kind === "project" && !entry.cover ? (
          <ProjectArt category={entry.category} title={entry.title} variant="thumb" />
        ) : (
          // No category label on the monogram: at thumbnail size it could only
          // be clipped ("LEADERSHI…"), and the card's own text says what it is.
          <MediaCover image={entry?.cover} title={card.title} sizes="144px" />
        )}
      </span>
      <span className="dt-card__body">
        <span className="dt-card__meta">{card.meta}</span>
        <span className="dt-card__title font-display">{card.title}</span>
        {entry?.recognition && <span className="dt-card__result">{entry.recognition.result}</span>}
      </span>
      <span className="dt-card__arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

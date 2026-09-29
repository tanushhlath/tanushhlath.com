import { Reveal, Stagger, StaggerItem } from "@/animations";
import { formatMonthYear, getLatestNowUpdate, getNowItems, home, nowLabels } from "@/lib/content";
import { HomeLink } from "./parts";

/**
 * RIGHT NOW — a live snapshot (the first few items of now.ts), so the
 * homepage never feels frozen. A big label with a live dot and the month
 * of the latest update sits on the left (sticky on wide screens); the
 * items stand up out of the page in perspective, one after another, as
 * they arrive (reversible "tilt" reveal). Leads to Beyond → Now.
 */
export function CurrentStatus() {
  const copy = home.current;
  const items = getNowItems(copy.count);
  const updated = getLatestNowUpdate();
  if (items.length === 0) return null;

  return (
    <section id={copy.id ?? "right-now"} className="home-section home-now" aria-labelledby="home-now-title">
      <div className="home-container home-now__grid">
        <div className="home-now__aside">
          <Reveal variant="drift">
            <h2 id="home-now-title" className="home-now__title">
              <span className="home-now__live" aria-hidden="true" />
              {copy.kicker}
            </h2>
          </Reveal>
          {updated && (
            <Reveal variant="fade" delay={0.15} className="home-now__stamp">
              <time dateTime={updated}>{formatMonthYear(updated)}</time>
            </Reveal>
          )}
          {copy.cta && (
            <Reveal variant="fade" delay={0.25} className="home-now__cta">
              <HomeLink href={copy.cta.href} cursor="explore">
                {copy.cta.label}
              </HomeLink>
            </Reveal>
          )}
        </div>

        <Stagger as="ol" variant="tilt" gap={0.1} className="home-now__list">
          {items.map((item) => (
            <StaggerItem as="li" key={item.id} className="home-now__item" data-now={item.label}>
              <p className="home-now__lead">{nowLabels[item.label].lead}</p>
              <p className="home-now__value">{item.value}</p>
              {item.note && <p className="home-now__note">{item.note}</p>}
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

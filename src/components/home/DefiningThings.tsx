import { useRef } from "react";
import { motion, useTransform, type MotionStyle } from "framer-motion";
import { Stagger, StaggerItem, useDepthEnabled, useSectionProgress } from "@/animations";
import Link from "@/routing/Link";
import { home } from "@/lib/content";
import { pad } from "./homeUtils";
import { KickerHeading } from "./parts";

/**
 * FIVE DEFINING THINGS — "I build. / I lead. / I compete. / I make things. /
 * I stay curious." Each line is a real link into the part of the site that
 * proves it (hrefs from home.ts → Work lenses / Me), never an ambiguous
 * "looks clickable" label. Home owns these lines (§138).
 *
 * Big editorial type that arrives from alternating sides (split reveal)
 * and drifts gently sideways, alternate lines in opposite directions,
 * while the band scrolls past (the words only — the numbers and arrows
 * hold their columns). The drift is one scroll-linked number for the
 * whole list (--drift, 1 → −1, 0 with the list centred on screen), so the
 * lines always share one phase and line up exactly at the centre; how far
 * they travel is set per breakpoint in home.css (none on phones, where
 * the words fill the width).
 *
 * Every line ends in an arrow disc, so it reads as a link at rest.
 * Hover / keyboard focus: the line steps forward and turns electric blue,
 * an underline sweeps across, the hint slides out of the arrow and the
 * other lines quieten. Touch screens show the hints all the time (there
 * is no hover to discover them).
 */
export function DefiningThings() {
  const things = home.definingThings;
  const bandRef = useRef<HTMLDivElement>(null);
  const progress = useSectionProgress(bandRef, "through");
  const drift = useTransform(progress, (p) => (0.5 - p) * 2);
  const live = useDepthEnabled();
  const bandStyle = (live ? { "--drift": drift } : undefined) as MotionStyle | undefined;

  return (
    <section id="defining" className="home-section home-defining" aria-labelledby="home-defining-title">
      <div className="home-container">
        <KickerHeading id="home-defining-title">{home.definingThingsLabel}</KickerHeading>
        <motion.div ref={bandRef} className="home-defining__band" style={bandStyle}>
          <Stagger as="ul" className="home-defining__list" gap={0.08}>
            {things.map((thing, i) => (
              <StaggerItem
                as="li"
                key={`${i}-${thing.text}`}
                variant={i % 2 === 0 ? "split-left" : "split-right"}
                className="home-defining__item"
              >
                <Link href={thing.href} className="home-thing" data-cursor="explore" data-cursor-label="Open">
                  <span className="home-thing__index" aria-hidden="true">
                    {pad(i + 1)}
                  </span>
                  {/* only the words drift — the index and the arrow column stay aligned */}
                  <span className="home-thing__drift">
                    <span className="home-thing__text">{thing.text}</span>
                  </span>{" "}
                  <span className="home-thing__hint">
                    <span className="home-thing__hint-text">{thing.hint}</span>
                    <span className="home-thing__arrow" aria-hidden="true">
                      <span className="home-thing__glyph">→</span>
                    </span>
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </motion.div>
      </div>
    </section>
  );
}

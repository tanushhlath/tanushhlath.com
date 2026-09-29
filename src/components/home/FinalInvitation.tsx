import { useRef } from "react";
import { motion } from "framer-motion";
import { Parallax, Stagger, StaggerItem, TextReveal, useDepthEnabled, useSectionProgress } from "@/animations";
import Link from "@/routing/Link";
import { home, navigation } from "@/lib/content";
import { pathOf } from "@/routing/paths";
import { pad, splitSentences, type ScrollOffsets } from "./homeUtils";

/**
 * FINALE — "That's the surface. There's a lot more underneath."
 *
 * The line is taken literally: the first sentence sits above a hairline
 * (the surface) and the second below it. As the section scrolls in, the
 * surface draws out from the centre and the two sentences part — the
 * upper one rising, the lower one sinking — so the page ends on depth.
 * Then four ways further in, each a tile with the destination's one-line
 * description from the menu copy.
 */

/** The surface line draws from 0 → full width as the heading approaches the centre. */
const LINE_RANGE: ScrollOffsets = ["start 0.9", "center 0.5"];

const MENU_ITEMS = [navigation.home, ...navigation.primary, ...navigation.secondary];

/** The menu description of the page a link lands on ("/beyond/#next" → Beyond's). */
function describe(href: string): string | undefined {
  const path = pathOf(href);
  return MENU_ITEMS.find((item) => pathOf(item.href) === path)?.description;
}

export function FinalInvitation() {
  const copy = home.finale;
  const [surface, ...rest] = splitSentences(copy.heading);
  const under = rest.join(" ");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const progress = useSectionProgress(headingRef, LINE_RANGE);
  const live = useDepthEnabled();

  return (
    <section id="more" className="home-section home-finale" aria-labelledby="home-finale-title">
      <div className="home-container">
        {/* One copy of the text: the aria-label names the heading; the two
            animated sentences are its only text, hidden from assistive tech. */}
        <h2 ref={headingRef} id="home-finale-title" className="home-finale__heading" aria-label={copy.heading}>
          <span aria-hidden="true" className="home-finale__lines">
            <Parallax as="span" speed={0.12} className="home-finale__surface">
              <TextReveal as="span" text={surface ?? copy.heading} srText={false} />
            </Parallax>
            {under && (
              <>
                {" "}
                <span className="home-finale__line">
                  <motion.span className="home-finale__line-fill" style={live ? { scaleX: progress } : undefined} />
                </span>
                <Parallax as="span" speed={-0.12} className="home-finale__under">
                  <TextReveal as="span" text={under} delay={0.25} srText={false} />
                </Parallax>
              </>
            )}
          </span>
        </h2>

        <Stagger as="ul" variant="scale" gap={0.07} className="home-finale__links">
          {copy.links.map((link, i) => {
            const description = describe(link.href);
            return (
              <StaggerItem as="li" key={link.href}>
                <Link href={link.href} className="home-finale__tile" data-cursor="explore" data-cursor-label="Go">
                  <span className="home-finale__index" aria-hidden="true">
                    {pad(i + 1)}
                  </span>
                  <span className="home-finale__label">{link.label}</span>
                  {description && (
                    <>
                      {" "}
                      <span className="home-finale__desc">{description}</span>
                    </>
                  )}
                  <span className="home-finale__arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

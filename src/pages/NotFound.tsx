import { motion } from "framer-motion";
import { Reveal, Stagger, StaggerItem, TextReveal, usePointerParallax } from "@/animations";
import { ArrowLink, Magnetic } from "@/components/ui";
import Link from "@/routing/Link";
import { navigation, notFoundCopy, pages } from "@/lib/content";

/** Accessible name for the list of destinations (an interface label, not page copy). */
const ROUTES_LABEL = "Pages";

/**
 * 404 — used for unknown URLs (the router's catch-all) and by WorkDetail
 * for unknown /work/<slug>/ records. Quiet, on-brand, and never a dead
 * end: the two ways back from src/content/pages.ts (`notFoundCopy`), then
 * every destination from the menu (src/content/site.ts `navigation`).
 * Styles: src/styles/explore.css ("404" section).
 */
export default function NotFoundPage() {
  const copy = pages.notFound;
  const [primary, ...others] = notFoundCopy.links;
  const destinations = [...navigation.primary, ...navigation.secondary];

  return (
    <div className="nf-page">
      <section className="nf-hero" aria-labelledby="nf-title">
        <Reveal variant="blur" className="nf-hero__numeral-wrap">
          <Numeral text={copy.kicker ?? "404"} />
        </Reveal>

        <div className="nf-hero__text">
          <TextReveal as="h1" id="nf-title" text={copy.heading ?? copy.title} delay={0.08} className="nf-hero__title font-display" />
          {copy.intro && (
            <Reveal delay={0.2} className="nf-hero__intro">
              <p>{copy.intro}</p>
            </Reveal>
          )}
          <Reveal delay={0.3} className="nf-hero__actions">
            {primary && (
              <Magnetic>
                <ArrowLink href={primary.href} variant="solid" cursorLabel={primary.label}>
                  {primary.label}
                </ArrowLink>
              </Magnetic>
            )}
            {others.map((link) => (
              <ArrowLink key={link.href} href={link.href} variant="pill" cursorLabel={link.label}>
                {link.label}
              </ArrowLink>
            ))}
          </Reveal>
        </div>
      </section>

      <nav className="nf-routes" aria-label={ROUTES_LABEL}>
        <Stagger as="ol" className="nf-routes__list" gap={0.06} variant="rise">
          {destinations.map((item, i) => (
            <StaggerItem as="li" key={item.href} className="nf-routes__item">
              <Link
                href={item.href}
                className="nf-route"
                data-cursor="view"
                data-cursor-label={item.label}
              >
                <span className="nf-route__index">{String(i + 1).padStart(2, "0")}</span>
                <span className="nf-route__label font-display">{item.label}</span>
                <span className="nf-route__desc">{item.description}</span>
                <span className="nf-route__arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </nav>
    </div>
  );
}

/** The big number, in three layers that part slightly toward the pointer (still on touch / reduced motion). */
function Numeral({ text }: { text: string }) {
  const back = usePointerParallax(-12);
  const mid = usePointerParallax(8);
  const front = usePointerParallax(20);
  return (
    <div className="nf-numeral" aria-hidden="true">
      <motion.span className="nf-numeral__layer nf-numeral__layer--back" style={{ x: back.x, y: back.y }}>
        {text}
      </motion.span>
      <motion.span className="nf-numeral__layer nf-numeral__layer--mid" style={{ x: mid.x, y: mid.y }}>
        {text}
      </motion.span>
      <motion.span className="nf-numeral__layer nf-numeral__layer--front" style={{ x: front.x, y: front.y }}>
        {text}
      </motion.span>
    </div>
  );
}

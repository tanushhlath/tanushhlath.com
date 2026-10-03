/**
 * UI PRIMITIVES — the shared building blocks every page composes with.
 * Import from "@/components/ui" (direct file imports keep working).
 * Styles: src/styles/ui.css (component layer, so Tailwind classes passed
 * through `className` win). Only the variants below exist — each one is
 * used somewhere on the site; add a new one here and in ui.css together.
 *
 * LABELS
 *   <Kicker index="02" tone="lavender">Work</Kicker>             small uppercase place-name with a rule
 *       tone: azure (default) | lavender | ember | quiet;  as: p | span | div
 *   <Tag>2024</Tag>  <Tag tone="accent" dot>Building</Tag>       tone: default | accent | ember | quiet
 *
 * HEADINGS
 *   <PageHero kicker="How I got here" index="01" title="…" intro="…" variant="display" emphasis="got" />
 *       variant: editorial (default) | display | centered | compact;
 *       children render under the intro (tabs, CTAs). The title is the page's <h1> (masked reveal).
 *   <SectionHeader id="skills" kicker="Skills" title="Proof, not percentages" intro="…" aside={<ArrowLink …/>} />
 *       as: h2 (default) | h3; size: md | lg. `id` is the anchor target.
 *
 * LINKS  (internal hrefs always come from `paths.*` in "@/routing/paths")
 *   <ArrowLink href={paths.work("built")}>See what I've built</ArrowLink>
 *       variant: text (default) | pill | solid (the ONE primary action in a view);
 *       direction: right (default) | down; external hrefs automatically become ExternalLink.
 *   <ExternalLink href="https://…">LinkedIn</ExternalLink>       new tab, rel="noopener noreferrer", visible ↗
 *   <CopyEmail email={site.email} />                             click copies (announced), else mailto:
 *
 * CONTROLS
 *   <SegmentedTabs label="Work lenses" idPrefix="work" options={[{ value, label, hint?, count?, index? }]}
 *                  active={lens} onChange={setLens} />
 *       real tab list (one Tab stop, arrow keys switch). Label each panel with
 *       <section {...tabPanelProps("work", lens)}>. variant: editorial (default).
 *   <FilterBar label="Filter by category" options={[{ value: "all", label: "All", count }, ...getEventFilters()]}
 *              active={filter} onChange={setFilter} size="sm" />
 *       single-choice toggle chips on one sideways-scrolling line, with a gliding pill, counts,
 *       and `short` labels on phones. size: md (default) | sm.
 *   <Magnetic><ArrowLink variant="solid" …/></Magnetic>          pointer pull for a primary CTA (mouse only)
 *   moveRovingFocus(event, selector)  ("./rovingFocus")          arrow-key focus for a custom row of buttons
 *
 * DIALOGS (hooks, "@/components/ui/dialog")
 *   useFocusTrap(ref, open, { initialFocus, inertSelector: "#root" }), useScrollLock(open), useIsClient()
 */

export { Kicker, type KickerProps } from "./Kicker";
export { Tag, type TagProps, type TagTone } from "./Tag";
export { PageHero, type PageHeroProps, type PageHeroVariant } from "./PageHero";
export { SectionHeader, type SectionHeaderProps } from "./SectionHeader";
export { ArrowLink, type ArrowLinkProps, type ArrowDirection } from "./ArrowLink";
export { ExternalLink, type ExternalLinkProps } from "./ExternalLink";
export { CopyEmail, type CopyEmailProps } from "./CopyEmail";
export { SegmentedTabs, type SegmentedTabsProps, type TabOption } from "./SegmentedTabs";
export { tabPanelProps } from "./tabPanelProps";
export { FilterBar, type FilterBarProps, type FilterBarOption } from "./FilterBar";
export { Magnetic, type MagneticProps } from "./Magnetic";
export { useFocusTrap, useScrollLock, useIsClient, getFocusable, type FocusTrapOptions } from "./dialog";

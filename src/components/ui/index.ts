/**
 * UI PRIMITIVES — the shared building blocks every page composes with.
 * Import from "@/components/ui" (direct file imports keep working).
 * Styles: src/styles/ui.css (component layer, so Tailwind classes passed
 * through `className` win).
 *
 * LABELS
 *   <Kicker index="02" tone="lavender">Work</Kicker>             small uppercase place-name with a rule
 *       tone: azure (default) | lavender | ember | quiet;  as: p | span | div
 *   <Tag>2024</Tag>  <Tag tone="accent" dot>Building</Tag>       tone: default | accent | lavender | ember | quiet | solid
 *   <TierTag tier={record.importance} />                         "Featured" / "Significant" / "Archive" (labels from taxonomy)
 *
 * HEADINGS
 *   <PageHero kicker="How I got here" index="01" title="…" intro="…" variant="display" emphasis="got" />
 *       variant: editorial (default) | display | split (aside = right column) | centered | compact;
 *       children render under the intro (tabs, CTAs). The title is the page's <h1> (masked reveal).
 *   <SectionHeader id="skills" kicker="Skills" title="Proof, not percentages" intro="…" aside={<ArrowLink …/>} />
 *       as: h2 (default) | h3; size: md | lg; align: start | center. `id` is the anchor target.
 *
 * LINKS  (internal hrefs always come from `paths.*` in "@/routing/paths")
 *   <ArrowLink href={paths.work("built")}>See what I've built</ArrowLink>
 *       variant: text (default) | pill | solid (the ONE primary action in a view);
 *       direction: right | down | left | up; external hrefs automatically become ExternalLink.
 *   <ExternalLink href="https://…">LinkedIn</ExternalLink>       new tab, rel="noopener noreferrer", visible ↗
 *   <CopyEmail email={site.email} />                             click copies (announced), else mailto:
 *   <ContinueThread threads={[{ lead: "This led to…", title, href: paths.workItem(id), meta, cover }]} />
 *       onward links at the end of a page; renders nothing for [].
 *
 * CONTROLS
 *   <SegmentedTabs label="Work lenses" idPrefix="work" options={[{ value, label, hint?, count?, index? }]}
 *                  active={lens} onChange={setLens} variant="editorial" />
 *       real tab list (one Tab stop, arrow keys switch). Label each panel with
 *       <section {...tabPanelProps("work", lens)}>. variant: pill (default) | editorial.
 *   <FilterBar label="Filter by category" options={[{ value: "all", label: "All", count }, ...getEventFilters()]}
 *              active={filter} onChange={setFilter} layout="scroll" />
 *       single-choice toggle chips with a gliding pill, counts, and `short` labels on phones.
 *   <Magnetic><ArrowLink variant="solid" …/></Magnetic>          pointer pull for a primary CTA (mouse only)
 *
 * DIALOGS (hooks, "@/components/ui/dialog")
 *   useFocusTrap(ref, open, { initialFocus, inertSelector: "#root" }), useScrollLock(open), useIsClient()
 */

export { Kicker, type KickerProps } from "./Kicker";
export { Tag, TierTag, type TagProps, type TagTone, type TierTagProps } from "./Tag";
export { PageHero, type PageHeroProps, type PageHeroVariant } from "./PageHero";
export { SectionHeader, type SectionHeaderProps } from "./SectionHeader";
export { ArrowLink, type ArrowLinkProps, type ArrowDirection } from "./ArrowLink";
export { ExternalLink, type ExternalLinkProps } from "./ExternalLink";
export { CopyEmail, type CopyEmailProps } from "./CopyEmail";
export { ContinueThread, type ContinueThreadProps, type Thread } from "./ContinueThread";
export { SegmentedTabs, type SegmentedTabsProps, type TabOption } from "./SegmentedTabs";
export { tabPanelProps } from "./tabPanelProps";
export { FilterBar, type FilterBarProps, type FilterBarOption } from "./FilterBar";
export { Magnetic, type MagneticProps } from "./Magnetic";
export { useFocusTrap, useScrollLock, useIsClient, getFocusable, type FocusTrapOptions } from "./dialog";

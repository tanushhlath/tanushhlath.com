import { MaskReveal, Stagger, StaggerItem } from "@/animations";
import { PageHero } from "@/components/ui";
import Link from "@/routing/Link";
import { pages, storyCopy } from "@/lib/content";
import { paths } from "@/routing/paths";
import type { StoryChapterView } from "./storyModel";

interface StoryHeroProps {
  chapters: StoryChapterView[];
  pageIndex?: string;
}

/**
 * The opening: kicker → masked "How I got here" → intro, then the whole
 * story laid out as a row of date markers — the table of contents. Each
 * marker jumps to its chapter, where (further down) the same kind of
 * marker opens up into the full chapter.
 *
 * Phones get the markers as a compact two-column index instead of a
 * squeezed ruler.
 */
export function StoryHero({ chapters, pageIndex }: StoryHeroProps) {
  const copy = pages.story;
  const first = chapters[0]?.startYear;
  const last = chapters[chapters.length - 1]?.moments.at(-1)?.moment.year;

  return (
    <PageHero
      id="story-intro"
      variant="display"
      kicker={copy.kicker}
      index={pageIndex}
      title={copy.heading ?? copy.title}
      intro={copy.intro}
      emphasis="got"
      className="story-hero"
    >
      <nav className="story-ruler" aria-label={storyCopy.chapterNavLabel}>
        {first !== undefined && last !== undefined && (
          <p className="story-ruler__span" aria-hidden="true">
            <span>{first}</span>
            <span className="story-ruler__span-line" />
            <span>{last}</span>
          </p>
        )}
        <div className="story-ruler__track">
          <MaskReveal direction="horizontal" className="story-ruler__line" duration={1.1} zoom={1}>
            <span className="story-ruler__line-fill" />
          </MaskReveal>
          <Stagger as="ol" className="story-ruler__list" gap={0.07}>
            {chapters.map(({ chapter, label, tone }) => (
              <StaggerItem as="li" key={chapter.id} className="story-ruler__item" data-tone={tone}>
                <Link
                  href={paths.story(chapter.id)}
                  className="story-ruler__link"
                  data-cursor="view"
                  data-cursor-label={chapter.yearLabel}
                >
                  <span className="story-ruler__dot" aria-hidden="true" />
                  <span className="story-ruler__num">{label}</span>
                  <span className="story-ruler__era font-display">{chapter.era}</span>
                  <span className="story-ruler__years">{chapter.yearLabel}</span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </nav>
    </PageHero>
  );
}

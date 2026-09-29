import { MaskReveal, Parallax, Reveal, TextReveal } from "@/animations";
import type { StoryMomentView } from "./storyModel";

/**
 * A quote moment: the line a moment left behind, set large in the serif
 * across the full width, with its own reveal — the rule draws in, the
 * words rise out of their masks one by one, and a giant quotation mark
 * drifts behind at a slower rate. Reverses when scrolled back past.
 */
export function StoryQuote({ view }: { view: StoryMomentView }) {
  const { moment, index } = view;
  if (!moment.quote) return null;

  return (
    <figure className="story-quote" data-story-index={index} data-turning={moment.isTurningPoint || undefined}>
      <Parallax speed={0.28} className="story-quote__mark font-display" aria-hidden="true">
        “
      </Parallax>
      <MaskReveal direction="horizontal" zoom={1} className="story-quote__rule" aria-hidden="true">
        <span />
      </MaskReveal>
      <blockquote className="story-quote__body">
        <TextReveal as="p" text={moment.quote} className="story-quote__text font-display" amount={0.2} />
      </blockquote>
      <Reveal as="figcaption" variant="fade" delay={0.35} className="story-quote__caption">
        <span className="story-quote__dash" aria-hidden="true" />
        {moment.title}, {moment.dateLabel ?? moment.year}
      </Reveal>
    </figure>
  );
}

import { Reveal, Stagger, StaggerItem } from "@/animations";
import { site } from "@/lib/content";

/**
 * WHO I AM — the biography (site.bioLong: who he is, not the Story
 * timeline), set as a spread. The first paragraph is a serif standfirst
 * that wipes in; the rest follow as body text. Wide screens: standfirst
 * in the left column (under the portrait), body in the right (under the
 * heading and ledger); smaller screens: one reading column.
 *
 * Home owns the five "I build. / I lead. …" lines; Me doesn't repeat them.
 */
export function MeBio() {
  const [lede, ...rest] = site.bioLong;
  if (!lede) return null;

  return (
    <div className="me-container me-bio">
      <Reveal as="p" variant="mask" className="me-bio__lede font-display">
        {lede}
      </Reveal>
      {rest.length > 0 && (
        <Stagger gap={0.1} className="me-bio__body">
          {rest.map((paragraph) => (
            <StaggerItem as="p" key={paragraph.slice(0, 32)}>
              {paragraph}
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}

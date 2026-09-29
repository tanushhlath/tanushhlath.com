import { InterestsGrid } from "@/components/care/InterestsGrid";
import { MeBio } from "@/components/me/MeBio";
import { MeHero } from "@/components/me/MeHero";
import { MeOnward } from "@/components/me/MeOnward";
import { PersonalCollage } from "@/components/me/PersonalCollage";
import { SkillsView } from "@/components/skills/SkillsView";
import { SectionHeader } from "@/components/ui";
import { interests, meCopy, personalDetails, skills } from "@/lib/content";

/**
 * ME — who is this person? (Story answers "how did he get here?")
 * A portrait-led personal editorial:
 *
 *   #who-i-am          portrait stage + profile ledger, then the biography
 *                      as a spread (standfirst | body)
 *   #care-about        an index of what he cares about + a reading panel
 *                      (rows: #interest-<id>, which also selects it)
 *   #personal-details  a hole-free mosaic of small answers, each card kind
 *                      with its own interaction (cards: #fact-<id>; a deep
 *                      link highlights the card it lands on)
 *   #skills            "Proof, not percentages" — disclosures that open
 *                      onto the evidence (rows: #skill-<id>)
 *   #me-onward         a signature, Story / Beyond, and contact
 *
 * Copy: src/content/site.ts, pages.ts (pages.me, meCopy), interests.ts,
 * personal.ts, skills.ts. Styles: src/styles/me.css. <title>/meta come
 * from App's <Meta/>; the atmosphere turns warm on /me/ by itself.
 */
export default function Me() {
  const care = meCopy.careAbout;
  const personal = meCopy.personal;
  const skillCopy = meCopy.skills;

  return (
    <div className="me-page">
      <section id={meCopy.intro.id} className="me-intro" aria-labelledby="me-title">
        <MeHero />
        <MeBio />
      </section>

      <section id={care.id} className="me-section me-care" aria-labelledby="me-care-title">
        <div className="me-container">
          <SectionHeader
            title={care.kicker}
            headingId="me-care-title"
            emphasis={lastWord(care.kicker, 2)}
            intro={care.intro}
            size="lg"
            className="me-section__header"
          />
          <InterestsGrid interests={interests} />
        </div>
      </section>

      <section id={personal.id} className="me-section me-personal" aria-labelledby="me-personal-title">
        <div className="me-container">
          <SectionHeader
            title={personal.kicker}
            headingId="me-personal-title"
            emphasis={lastWord(personal.kicker)}
            size="lg"
            className="me-section__header"
          />
          <PersonalCollage details={personalDetails} />
        </div>
      </section>

      <section id={skillCopy.id} className="me-section me-skills-section" aria-labelledby="me-skills-title">
        <div className="me-container">
          <SectionHeader
            kicker={skillCopy.kicker}
            title={skillCopy.heading}
            headingId="me-skills-title"
            emphasis={firstWord(skillCopy.heading)}
            intro={skillCopy.intro}
            size="lg"
            className="me-section__header"
          />
          <SkillsView skills={skills} />
        </div>
      </section>

      <MeOnward />
    </div>
  );
}

/** The heading's first word, e.g. "Proof" — set in italic. */
function firstWord(text: string): string | undefined {
  return text.split(/\s+/)[0] || undefined;
}

/** The heading's `nth`-from-last word, e.g. "me" / "care". */
function lastWord(text: string, nth = 1): string | undefined {
  const words = text.split(/\s+/);
  return words[words.length - nth] || undefined;
}

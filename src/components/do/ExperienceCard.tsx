import Link from "next/link";
import { Experience } from "@/types/content";
import { Tag, TierTag } from "@/components/ui/Tag";

export const categoryLabel: Record<string, string> = {
  leadership: "Leadership",
  competition: "Competition",
  entrepreneurship: "Entrepreneurship",
  speaking: "Speaking",
  theatre: "Theatre",
  volunteering: "Volunteering",
  community: "Community",
  media: "Media",
  school: "School",
  workshop: "Workshop",
  conference: "Conference",
  sport: "Sport",
  other: "Other",
};

export function FeaturedExperienceCard({ experience }: { experience: Experience }) {
  return (
    <Link
      href={`/work/${experience.slug}`}
      data-cursor="view"
      data-cursor-label="View"
      className="group block rounded-3xl border border-ink-line bg-ink-raised p-6 sm:p-8 transition-colors duration-200 hover:border-azure-soft/50"
    >
      <div className="flex flex-wrap items-center gap-2">
        <TierTag tier={experience.tier} />
        <Tag>{categoryLabel[experience.category]}</Tag>
        <Tag>{experience.dateLabel ?? experience.year}</Tag>
      </div>
      <h3 className="mt-5 font-display text-2xl sm:text-3xl text-paper group-hover:text-azure-soft transition-colors duration-200">
        {experience.title}
      </h3>
      {experience.organization && (
        <p className="mt-1 text-sm text-paper-faint">{experience.organization}</p>
      )}
      <p className="mt-3 max-w-xl text-paper-dim">{experience.summary}</p>
      <span className="mt-5 block h-px w-0 bg-azure-soft transition-[width] duration-300 ease-out group-hover:w-16" />
    </Link>
  );
}

export function ExperienceRow({ experience }: { experience: Experience }) {
  return (
    <Link
      href={`/work/${experience.slug}`}
      data-cursor="view"
      data-cursor-label="View"
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-ink-line py-5 transition-colors duration-150 hover:bg-ink-raised/40"
    >
      <span className="w-14 shrink-0 text-sm text-paper-faint">{experience.year}</span>
      <span>
        <span className="block text-paper group-hover:text-azure-soft transition-colors duration-150">
          {experience.title}
        </span>
        {experience.organization && (
          <span className="block text-sm text-paper-faint">{experience.organization}</span>
        )}
      </span>
      <span className="hidden sm:inline text-xs uppercase tracking-wide text-paper-faint">
        {categoryLabel[experience.category]}
      </span>
    </Link>
  );
}

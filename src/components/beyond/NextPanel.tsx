import { Reveal } from "@/components/motion/Reveal";
import { futureGoals } from "@/lib/content";
import { Horizon } from "@/types/content";

const horizons: {
  key: Horizon;
  label: string;
  blurb: string;
  border: string;
  titleClass: string;
  gap: string;
}[] = [
  {
    key: "now",
    label: "Now",
    blurb: "Actively in motion",
    border: "border-azure",
    titleClass: "font-display text-xl sm:text-2xl text-paper",
    gap: "space-y-6",
  },
  {
    key: "next",
    label: "Next",
    blurb: "Right after this",
    border: "border-azure-soft/60",
    titleClass: "font-display text-xl sm:text-2xl text-paper",
    gap: "space-y-6",
  },
  {
    key: "later",
    label: "Later",
    blurb: "On the roadmap",
    border: "border-ink-line-strong",
    titleClass: "font-display text-xl sm:text-2xl text-paper-dim",
    gap: "space-y-7",
  },
  {
    key: "someday",
    label: "Someday",
    blurb: "Unscheduled, but real",
    border: "border-lavender/50",
    titleClass: "font-display italic text-2xl sm:text-3xl text-lavender",
    gap: "space-y-10",
  },
];

/** NEXT — more open / expansive. Widens and lightens toward "Someday". */
export function NextPanel() {
  return (
    <div className="space-y-20">
      {horizons.map((h) => {
        const goals = futureGoals.filter((g) => g.horizon === h.key);
        if (goals.length === 0) return null;
        return (
          <section key={h.key}>
            <Reveal className="flex items-baseline gap-4">
              <h2 className="font-display text-3xl sm:text-4xl text-paper">{h.label}</h2>
              <span className="text-sm text-paper-faint">{h.blurb}</span>
            </Reveal>
            <div className={`mt-6 border-l pl-6 ${h.border} ${h.gap}`}>
              {goals.map((g, i) => (
                <Reveal key={g.id} delay={i * 0.05}>
                  <p className={h.titleClass}>{g.title}</p>
                  <p className="mt-1 text-paper-dim">{g.description}</p>
                </Reveal>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

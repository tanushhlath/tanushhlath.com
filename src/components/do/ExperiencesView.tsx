import { useMemo, useState } from "react";
import { Experience } from "@/types/content";
import { FeaturedExperienceCard, ExperienceRow, categoryLabel } from "@/components/do/ExperienceCard";
import { FilterBar } from "@/components/ui/FilterBar";

export function ExperiencesView({ experiences }: { experiences: Experience[] }) {
  const [filter, setFilter] = useState("all");

  const categories = useMemo(() => {
    const set = new Set(experiences.map((e) => e.category));
    return Array.from(set);
  }, [experiences]);

  const featured = experiences.filter((e) => e.tier === "featured");
  const rest = experiences.filter((e) => e.tier !== "featured");
  const filteredRest = filter === "all" ? rest : rest.filter((e) => e.category === filter);

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2">
        {featured.map((e) => (
          <FeaturedExperienceCard key={e.id} experience={e} />
        ))}
      </div>

      <div className="mt-20">
        <FilterBar
          active={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            ...categories.map((c) => ({ value: c, label: categoryLabel[c] })),
          ]}
        />
        <div className="mt-6">
          {filteredRest.map((e) => (
            <ExperienceRow key={e.id} experience={e} />
          ))}
        </div>
        {filteredRest.length === 0 && (
          <p className="mt-8 text-paper-faint">Nothing here yet.</p>
        )}
      </div>
    </div>
  );
}

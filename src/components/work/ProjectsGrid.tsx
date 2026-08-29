import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Project } from "@/types/content";
import { FeaturedProjectCard, ProjectCard } from "@/components/work/ProjectCard";
import { FilterBar } from "@/components/ui/FilterBar";

export function ProjectsGrid({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState("all");

  const categories = useMemo(() => {
    const set = new Set(projects.map((p) => p.category));
    return Array.from(set);
  }, [projects]);

  const featured = projects.filter((p) => p.tier === "featured");
  const rest = projects.filter((p) => p.tier !== "featured");

  const filteredRest =
    filter === "all" ? rest : rest.filter((p) => p.category === filter);

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2">
        {featured.map((project) => (
          <FeaturedProjectCard key={project.id} project={project} />
        ))}
      </div>

      <div className="mt-20">
        <FilterBar
          active={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            ...categories.map((c) => ({ value: c, label: c })),
          ]}
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRest.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>

        {filteredRest.length === 0 && (
          <p className="mt-8 text-paper-faint">Nothing in this category yet.</p>
        )}
      </div>
    </div>
  );
}

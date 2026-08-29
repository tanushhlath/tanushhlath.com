"use client";

import { motion } from "framer-motion";
import { site } from "@/content/site";
import { staggerContainer, viewportOnce } from "@/lib/motion";

export function DefiningThings() {
  return (
    <section className="px-5 sm:px-8 pb-24 sm:pb-32">
      <motion.ul
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer(0.06)}
        className="mx-auto flex max-w-4xl flex-col"
      >
        {site.definingThings.map((thing, i) => (
          <motion.li
            key={thing}
            variants={{
              hidden: { opacity: 0, x: -16 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
            }}
            className="group flex items-baseline gap-4 border-b border-ink-line py-4 sm:py-5 first:border-t"
          >
            <span className="font-mono text-xs text-paper-faint tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-display text-[clamp(1.5rem,5vw,3rem)] leading-tight text-paper transition-colors duration-200 group-hover:text-azure-soft">
              {thing}
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

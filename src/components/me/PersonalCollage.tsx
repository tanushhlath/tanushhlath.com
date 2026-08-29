import { useState } from "react";
import { motion } from "framer-motion";
import { PersonalDetail } from "@/types/content";
import { cn } from "@/lib/cn";

const sizeCycle = ["", "sm:row-span-2", "", "", "sm:row-span-2", ""];
const rotateCycle = [-1, 0.5, -0.5, 1, 0, -1];

function Card({ detail, index }: { detail: PersonalDetail; index: number }) {
  const revealOnClick = index % 3 === 2;
  const [revealed, setRevealed] = useState(!revealOnClick);

  return (
    <motion.div
      whileHover={{ y: -3, rotate: 0 }}
      style={{ rotate: `${rotateCycle[index % rotateCycle.length]}deg` }}
      className={cn(
        "flex flex-col justify-between rounded-2xl border border-ink-line bg-ink-raised/50 p-6 transition-colors duration-200 hover:border-azure-soft/40",
        sizeCycle[index % sizeCycle.length]
      )}
    >
      <div>
        <p className="text-xs uppercase tracking-[0.15em] text-paper-faint">{detail.category}</p>
        <p className="mt-3 text-paper-dim">{detail.prompt}</p>
      </div>
      {revealed ? (
        <motion.p
          initial={revealOnClick ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 font-display text-xl text-paper"
        >
          {detail.answer}
        </motion.p>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          data-cursor="view"
          data-cursor-label="Reveal"
          className="mt-4 self-start rounded-full border border-dashed border-ink-line-strong px-4 py-1.5 text-sm text-paper-faint transition-colors hover:border-azure-soft hover:text-azure-soft cursor-pointer"
        >
          Reveal
        </button>
      )}
    </motion.div>
  );
}

export function PersonalCollage({ details }: { details: PersonalDetail[] }) {
  return (
    <div className="grid auto-rows-[minmax(0,auto)] gap-4 sm:grid-cols-3">
      {details.map((d, i) => (
        <Card key={d.id} detail={d} index={i} />
      ))}
    </div>
  );
}

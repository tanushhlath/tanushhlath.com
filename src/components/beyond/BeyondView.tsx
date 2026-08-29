"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { NowPanel } from "@/components/beyond/NowPanel";
import { NextPanel } from "@/components/beyond/NextPanel";
import { LabView } from "@/components/lab/LabView";
import { LabIdea } from "@/types/content";

type Mode = "now" | "next" | "lab";

const modes: { value: Mode; label: string; hint: string }[] = [
  { value: "now", label: "Now", hint: "what's happening" },
  { value: "next", label: "Next", hint: "where I'm headed" },
  { value: "lab", label: "Lab", hint: "unfinished thinking" },
];

export function BeyondView({ labIdeas }: { labIdeas: LabIdea[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = searchParams.get("tab");
  const [mode, setMode] = useState<Mode>(initial === "next" || initial === "lab" ? initial : "now");

  function selectMode(value: string) {
    setMode(value as Mode);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="relative">
      {mode === "lab" && (
        <div className="bg-grid-faint pointer-events-none absolute inset-x-0 -top-10 h-[60vh]" aria-hidden />
      )}
      <div className="relative">
        <SegmentedTabs options={modes} active={mode} onChange={selectMode} />

        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-12"
        >
          {mode === "now" && <NowPanel />}
          {mode === "next" && <NextPanel />}
          {mode === "lab" && <LabView ideas={labIdeas} />}
        </motion.div>
      </div>
    </div>
  );
}

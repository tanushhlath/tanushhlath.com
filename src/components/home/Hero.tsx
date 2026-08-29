"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { site } from "@/content/site";
import { EASE_CINEMATIC, EASE_ENTER } from "@/lib/motion";
import { Magnetic } from "@/components/ui/Magnetic";

const NAME_WORDS = site.name.split(" ");

/**
 * Cinematic opening: near-empty viewport → small label → name reveals word
 * by word → statement → one invitation. A cursor-reactive glow tracks the
 * pointer (desktop, motion-safe only). As the visitor scrolls, the whole
 * composition recedes — scale/fade/rise — via a sticky panel so the next
 * section visually emerges through it, without hijacking scroll speed.
 */
export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const mvX = useMotionValue(50);
  const mvY = useMotionValue(35);
  const glow = useMotionTemplate`radial-gradient(38rem circle at ${mvX}% ${mvY}%, var(--color-azure-dim), transparent 60%)`;

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine || reduced) return;
    function onMove(e: MouseEvent) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mvX.set(((e.clientX - rect.left) / rect.width) * 100);
      mvY.set(((e.clientY - rect.top) / rect.height) * 100);
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <div ref={containerRef} className="relative h-[140vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-between overflow-hidden px-5 sm:px-8 pt-32 pb-10">
        <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: glow }} />

        <motion.div
          style={reduced ? undefined : { opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_ENTER }}
            className="mb-6 flex items-center gap-3"
          >
            {site.photo && (
              <motion.span
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.6, ease: EASE_ENTER, delay: 0.9 }}
                className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-full border border-ink-line-strong"
              >
                <Image
                  src={site.photo.src}
                  alt={site.photo.alt}
                  fill
                  sizes="36px"
                  className="object-cover"
                  priority
                />
              </motion.span>
            )}
            <p className="text-xs uppercase tracking-[0.25em] text-paper-dim">
              A person, not a résumé
            </p>
          </motion.div>

          <h1 className="font-display text-balance text-[clamp(3rem,10vw,8rem)] leading-[0.95] tracking-tight text-paper">
            {NAME_WORDS.map((word, wi) => (
              <span key={wi} className="mr-[0.25em] inline-block overflow-hidden align-bottom last:mr-0">
                <motion.span
                  className="inline-block"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{
                    duration: 0.8,
                    ease: EASE_CINEMATIC,
                    delay: 0.15 + wi * 0.09,
                  }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_ENTER, delay: 0.55 }}
            className="mt-6 max-w-xl text-balance text-xl sm:text-2xl text-paper-dim"
          >
            {site.tagline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_ENTER, delay: 0.75 }}
            className="mt-12"
          >
            <Magnetic>
              <a
                href="#snapshot"
                data-cursor="view"
                data-cursor-label="Enter"
                className="group inline-flex items-center gap-3 rounded-full bg-azure px-7 py-3.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-azure-soft"
              >
                Enter
                <motion.span
                  aria-hidden
                  animate={{ y: [0, 4, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  ↓
                </motion.span>
              </a>
            </Magnetic>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="relative mx-auto flex w-full max-w-6xl items-center justify-between text-xs uppercase tracking-[0.2em] text-paper-faint"
        >
          <span>{site.location}</span>
          <span>Scroll to explore</span>
        </motion.div>
      </div>
    </div>
  );
}

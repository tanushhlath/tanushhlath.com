import { motion } from "framer-motion";
import { ReactNode } from "react";
import { DUR, EASE_ENTER, viewportOnce } from "@/lib/motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li";
  id?: string;
}

/** Standard scroll-triggered "Enter" animation used across the site. */
export function Reveal({ children, className, delay = 0, as = "div", id }: RevealProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      id={id}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: DUR.base, ease: EASE_ENTER, delay }}
    >
      {children}
    </MotionTag>
  );
}

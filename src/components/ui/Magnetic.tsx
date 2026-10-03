import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { SPRING, usePointerEnabled } from "@/animations";

export interface MagneticProps {
  children: ReactNode;
  /** Fraction of the pointer's offset from centre the child follows. Default 0.3. */
  strength?: number;
  /** Largest pull in px, whatever the element's size. Default 14. */
  max?: number;
  className?: string;
  /** Render still. */
  disabled?: boolean;
}

/**
 * Wraps a single interactive child (a button or link) and pulls it a few
 * pixels toward the pointer while hovered — reserved for the handful of
 * primary calls to action, never applied blanket-wide.
 *
 * Pointer moves are read once per animation frame and fed to springs
 * (no React state per event). Mouse/trackpad only: on touch screens and
 * under reduced motion it renders the child still.
 */
export function Magnetic({
  children,
  strength = 0.3,
  max = 14,
  className,
  disabled = false,
}: MagneticProps) {
  const enabled = usePointerEnabled(disabled);
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });

  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const x = useSpring(tx, SPRING.magnetic);
  const y = useSpring(ty, SPRING.magnetic);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // Turning off (reduced motion switched on mid-visit) settles back to centre.
  useEffect(() => {
    if (!enabled) {
      tx.set(0);
      ty.set(0);
    }
  }, [enabled, tx, ty]);

  const update = () => {
    frame.current = 0;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clamp = (v: number) => Math.max(-max, Math.min(max, v));
    tx.set(clamp((pointer.current.x - (rect.left + rect.width / 2)) * strength));
    ty.set(clamp((pointer.current.y - (rect.top + rect.height / 2)) * strength));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!enabled || event.pointerType === "touch") return;
    pointer.current = { x: event.clientX, y: event.clientY };
    if (!frame.current) frame.current = requestAnimationFrame(update);
  };

  const onPointerLeave = () => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    tx.set(0);
    ty.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={enabled ? { x, y } : undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </motion.div>
  );
}

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionStyle, type MotionValue } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePointerEnabled } from "./pointer";
import { MOTION_TAGS, type MotionPassThrough, type MotionTagName } from "./tags";
import { SPRING, motionSettings } from "./tokens";

/**
 * POINTER TILT
 *
 * A card that leans toward the pointer in perspective: the side under the
 * pointer presses away, springs settle it back when the pointer leaves.
 * Mouse and trackpad only — touch screens, reduced motion and
 * `motionSettings.depthEnabled = false` get a perfectly still element (and
 * so does the prerendered HTML). Rotation never exceeds
 * `motionSettings.tiltMax` degrees.
 *
 * The card's position is measured once when the pointer enters and tracked
 * with page coordinates, so moving or scrolling while hovering never forces
 * a layout read. At rest the element carries no transform at all.
 */

interface TiltState {
  /** Sprung pointer position across the card, -1 … 1 (0 at rest). */
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** Sprung hover amount, 0 … 1. */
  hover: MotionValue<number>;
}

const TiltContext = createContext<TiltState | null>(null);

interface Frame {
  /** Card centre in page coordinates. */
  cx: number;
  cy: number;
  /** Half the untransformed size. */
  rx: number;
  ry: number;
}

const clamp = (value: number) => Math.max(-1, Math.min(1, value));
const isTouch = (event: ReactPointerEvent) => event.pointerType === "touch";

export interface TiltProps extends MotionPassThrough {
  children?: ReactNode;
  /** Largest rotation in degrees, at the card's edges. Default and ceiling: `motionSettings.tiltMax`. */
  max?: number;
  /** Scale while hovered. Default `motionSettings.tiltScale`; 1 for none. */
  scale?: number;
  /** Perspective distance in px (smaller = more dramatic). Default `motionSettings.tiltPerspective`. */
  perspective?: number;
  /** A soft light that follows the pointer across the surface. */
  glare?: boolean;
  as?: MotionTagName;
  id?: string;
  className?: string;
  style?: MotionStyle;
  /** Render still. */
  disabled?: boolean;
}

/**
 *   <Tilt className="rounded-2xl">
 *     <TiltLayer depth={-12}><img … /></TiltLayer>   background: drifts away from the pointer
 *     <TiltLayer depth={18}><h3>…</h3></TiltLayer>   foreground: drifts toward it
 *   </Tilt>
 */
export function Tilt({
  children,
  max,
  scale,
  perspective,
  glare = false,
  as = "div",
  disabled = false,
  className,
  style,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
  ...rest
}: TiltProps) {
  const enabled = usePointerEnabled(disabled);
  const limit = Math.min(Math.abs(max ?? motionSettings.tiltMax), motionSettings.tiltMax);
  const hoverScale = scale ?? motionSettings.tiltScale;
  const distance = perspective ?? motionSettings.tiltPerspective;

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const hovered = useMotionValue(0);
  const x = useSpring(px, SPRING.tilt);
  const y = useSpring(py, SPRING.tilt);
  const hover = useSpring(hovered, SPRING.tilt);

  const rotateY = useTransform(x, (v) => v * limit);
  const rotateX = useTransform(y, (v) => -v * limit);
  const scaleValue = useTransform(hover, (h) => 1 + (hoverScale - 1) * h);
  // Perspective only while moving: at rest the transform collapses to `none`
  // (no stacking-context or containing-block side effects, crisp text).
  const transformPerspective = useTransform([x, y, hover], ([a, b, c]) => (a || b || c ? distance : 0));
  const state = useMemo<TiltState>(() => ({ x, y, hover }), [x, y, hover]);

  const frame = useRef<Frame | null>(null);
  const reset = () => {
    frame.current = null;
    px.set(0);
    py.set(0);
    hovered.set(0);
  };

  // Switched off mid-hover (reduced motion turned on, pointer type changed): settle.
  useEffect(() => {
    if (enabled) return;
    frame.current = null;
    px.set(0);
    py.set(0);
    hovered.set(0);
  }, [enabled, px, py, hovered]);

  const measure = (event: ReactPointerEvent<HTMLElement>) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    // Centre from the (possibly still settling) box; size from layout, which ignores transforms.
    frame.current = {
      cx: rect.left + rect.width / 2 + (event.pageX - event.clientX),
      cy: rect.top + rect.height / 2 + (event.pageY - event.clientY),
      rx: (el.offsetWidth || rect.width || 1) / 2,
      ry: (el.offsetHeight || rect.height || 1) / 2,
    };
  };

  const track = (event: ReactPointerEvent<HTMLElement>) => {
    const f = frame.current;
    if (!f) return;
    px.set(clamp((event.pageX - f.cx) / f.rx));
    py.set(clamp((event.pageY - f.cy) / f.ry));
  };

  const handleEnter = (event: ReactPointerEvent<HTMLElement>) => {
    onPointerEnter?.(event);
    if (!enabled || isTouch(event)) return;
    measure(event);
    hovered.set(1);
    track(event);
  };

  const handleMove = (event: ReactPointerEvent<HTMLElement>) => {
    onPointerMove?.(event);
    if (!enabled || isTouch(event)) return;
    if (!frame.current) {
      measure(event);
      hovered.set(1);
    }
    track(event);
  };

  const handleLeave = (event: ReactPointerEvent<HTMLElement>) => {
    onPointerLeave?.(event);
    reset();
  };

  const Tag = MOTION_TAGS[as];
  const motionStyle: MotionStyle = enabled
    ? { ...style, rotateX, rotateY, scale: scaleValue, transformPerspective }
    : { ...style };

  return (
    <TiltContext.Provider value={enabled ? state : null}>
      <Tag
        {...rest}
        className={cn(glare && enabled && "tilt-glare-host", className)}
        style={motionStyle}
        data-tilt=""
        onPointerEnter={handleEnter}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
      >
        {children}
        {glare && enabled && <TiltGlare state={state} />}
      </Tag>
    </TiltContext.Provider>
  );
}

/** Pointer light: a large soft spot slid around by transform inside a clipped layer. */
function TiltGlare({ state }: { state: TiltState }) {
  const lx = useTransform(state.x, (v) => `${v * 25}%`);
  const ly = useTransform(state.y, (v) => `${v * 25}%`);
  const opacity = useTransform(state.hover, (h) => h * motionSettings.tiltGlare);
  return (
    <span className="tilt-glare" aria-hidden="true">
      <motion.span className="tilt-glare__light" style={{ x: lx, y: ly, opacity }} />
    </span>
  );
}

export interface TiltLayerProps extends MotionPassThrough {
  children?: ReactNode;
  /**
   * Apparent depth in px. Positive sits in front and slides toward the
   * pointer; negative sits behind and slides away. ±8–24 is plenty.
   */
  depth?: number;
  as?: MotionTagName;
  id?: string;
  className?: string;
  style?: MotionStyle;
}

/**
 * A layer inside `<Tilt>` that shifts with the tilt, so foreground and
 * background separate like real depth. Plain 2D translation — no
 * `preserve-3d` needed, so overflow clipping and opacity keep working.
 * Outside a (live) Tilt it renders still.
 */
export function TiltLayer({ children, depth = 12, as = "div", style, ...rest }: TiltLayerProps) {
  const tilt = useContext(TiltContext);
  const Tag = MOTION_TAGS[as];
  if (!tilt) {
    return (
      <Tag {...rest} style={style}>
        {children}
      </Tag>
    );
  }
  return (
    <LiveTiltLayer {...rest} tilt={tilt} depth={depth} as={as} style={style}>
      {children}
    </LiveTiltLayer>
  );
}

function LiveTiltLayer({
  tilt,
  depth,
  as,
  style,
  children,
  ...rest
}: Omit<TiltLayerProps, "depth" | "as"> & { tilt: TiltState; depth: number; as: MotionTagName }) {
  const shift = depth * motionSettings.tiltLayerShift;
  const x = useTransform(tilt.x, (v) => v * shift);
  const y = useTransform(tilt.y, (v) => v * shift);
  const Tag = MOTION_TAGS[as];
  return (
    <Tag {...rest} style={{ ...style, x, y }}>
      {children}
    </Tag>
  );
}

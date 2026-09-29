import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type RefObject } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  Parallax,
  Reveal,
  Stagger,
  StaggerItem,
  TextReveal,
  useDepthEnabled,
  useReducedMotionSafe,
} from "@/animations";
import { getFutureByHorizon, type HorizonGroup } from "@/lib/content";
import { pad2 } from "./modeState";

/* ------------------------------------------------------------------ */
/* Layout helpers                                                      */
/* ------------------------------------------------------------------ */

const WIDE_QUERY = "(min-width: 64rem)";

function subscribeWide(callback: () => void): () => void {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/** Wide screens get the sticky road you travel along; false during prerender/hydration. */
function useWideScreen(): boolean {
  return useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => false
  );
}

/** Evenly spread stops, used until the real band positions are measured. */
const evenStops = (count: number): number[] =>
  Array.from({ length: count }, (_, i) => (count > 1 ? i / (count - 1) : 0));

/**
 * Scroll progress (0…1 across the list of bands) at which each band's top
 * reaches the reading line, measured from the DOM so tall and short bands
 * both line up with their marker on the road.
 */
function useBandStops(listRef: RefObject<HTMLOListElement | null>, count: number): number[] {
  const [stops, setStops] = useState(() => evenStops(count));
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const height = list.offsetHeight;
      const bands = Array.from(list.children) as HTMLElement[];
      if (!height || bands.length !== count) return;
      const next = bands.map((band) => Math.min(1, Math.max(0, band.offsetTop / height)));
      // Must increase strictly for useTransform; fall back to even stops otherwise.
      const valid = next.every((value, i) => i === 0 || value > next[i - 1]);
      const resolved = valid ? next : evenStops(count);
      setStops((current) =>
        current.length === resolved.length && current.every((v, i) => Math.abs(v - resolved[i]) < 0.002) ? current : resolved
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [listRef, count]);
  return stops;
}

/* ------------------------------------------------------------------ */
/* The road                                                            */
/* ------------------------------------------------------------------ */

/** Distance between markers along the floor (px, in the floor's own plane). */
const GAP = 170;

interface RoadProps {
  groups: HorizonGroup[];
  active: number;
  /** Continuous position along the road: 0 = at the first marker, n−1 = at the last. */
  travel: MotionValue<number>;
  /** Scroll-linked travel is on (wide screen, motion allowed). */
  moving: boolean;
  onJump: (index: number) => void;
}

/**
 * A floor that recedes to a horizon, with one marker standing on it per
 * horizon — Now nearest, Someday far away and small. On wide screens the
 * road is sticky beside the bands and scrolling walks you along it: the
 * markers come toward you, the one you're reading arrives in front, the
 * ones behind you slip away, and the horizon brightens as you near it.
 * Each marker is a button that scrolls to its band.
 */
function HorizonRoad({ groups, active, travel, moving, onJump }: RoadProps) {
  const last = Math.max(1, groups.length - 1);
  const shift = useTransform(travel, (v) => (moving ? v * GAP : 0));
  const floorShift = useMotionTemplate`${shift}px`;
  const glow = useTransform(travel, [0, last], [0.35, 1]);

  return (
    <div className="by-road" data-moving={moving ? "true" : "false"}>
      <motion.span className="by-road__glow" style={{ opacity: moving ? glow : 0.7 }} aria-hidden="true" />
      <span className="by-road__horizon" aria-hidden="true" />
      <div className="by-road__scene">
        <motion.div className="by-road__plane" style={{ "--by-road-shift": floorShift } as unknown as CSSProperties}>
          <motion.ol className="by-road__track" style={{ y: shift }}>
            {groups.map((group, i) => {
              const state = !moving ? (i === active ? "here" : "ahead") : i < active ? "passed" : i === active ? "here" : "ahead";
              return (
                <li
                  key={group.horizon}
                  className="by-road__post"
                  data-horizon={group.horizon}
                  data-state={state}
                  style={{ "--by-post": i } as CSSProperties}
                >
                  <button
                    type="button"
                    className="by-road__marker"
                    onClick={() => onJump(i)}
                    aria-current={i === active ? "step" : undefined}
                    data-cursor="view"
                    data-cursor-label={group.label}
                  >
                    <span className="by-road__pin" aria-hidden="true" />
                    <span className="by-road__label font-display">{group.label}</span>
                    <span className="by-road__index" aria-hidden="true">
                      {pad2(i + 1)}
                    </span>
                    {group.description && <span className="sr-only">: {group.description}</span>}
                  </button>
                </li>
              );
            })}
          </motion.ol>
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bands                                                               */
/* ------------------------------------------------------------------ */

interface BandProps {
  group: HorizonGroup;
  index: number;
  active: boolean;
}

/**
 * One horizon. The further out, the more room it gets and the lighter it
 * reads: Now is concrete (solid cards, the accent), Next is outlined,
 * Later is open text, Someday is written large across the horizon.
 */
function HorizonBand({ group, index, active }: BandProps) {
  const isFar = group.horizon === "someday";
  return (
    <li
      id={`horizon-${group.horizon}`}
      className="by-band"
      data-horizon={group.horizon}
      data-active={active ? "true" : "false"}
      style={{ "--by-band": index } as CSSProperties}
    >
      <header className="by-band__head">
        <Reveal variant="clip" className="by-band__line" aria-hidden="true">
          <span className="by-band__index">{pad2(index + 1)}</span>
        </Reveal>
        <Parallax speed={-0.05 * (index + 1)} className="by-band__label-wrap">
          <TextReveal as="h3" text={group.label} className="by-band__label font-display" />
        </Parallax>
        {group.description && (
          <Reveal as="p" delay={0.12} className="by-band__desc">
            {group.description}
          </Reveal>
        )}
      </header>
      <Stagger as="ul" className="by-band__goals" gap={isFar ? 0.16 : 0.09} variant={isFar ? "blur" : "rise"}>
        {group.goals.map((goal) => (
          <StaggerItem as="li" key={goal.id} className="by-goal" data-horizon={group.horizon}>
            <h4 className="by-goal__title font-display">{goal.title}</h4>
            <p className="by-goal__desc">{goal.description}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </li>
  );
}

/**
 * NEXT — where I'm headed, as a progression you move through: Now → Next
 * → Later → Someday (horizon groups from src/content/next.ts). A receding
 * road on one side, the horizons on the other, each band roomier and
 * lighter than the last, ending on the horizon line.
 */
export function NextPanel() {
  const groups = getFutureByHorizon();
  const listRef = useRef<HTMLOListElement>(null);
  const wide = useWideScreen();
  const depth = useDepthEnabled();
  const reduced = useReducedMotionSafe();
  const moving = wide && depth;

  const stops = useBandStops(listRef, groups.length);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 45%", "end 45%"] });
  const input = stops.length > 1 ? stops : [0, 1];
  const output = stops.length > 1 ? stops.map((_, i) => i) : [0, 0];
  const travel = useTransform(scrollYProgress, input, output);

  // Re-render only when the band being read changes, never per scroll event.
  const [active, setActive] = useState(0);
  const pick = useCallback(
    (value: number) => {
      const next = Math.max(0, Math.min(groups.length - 1, Math.floor(value + 0.2)));
      setActive((current) => (current === next ? current : next));
    },
    [groups.length]
  );
  useMotionValueEvent(travel, "change", pick);

  const jump = (index: number) => {
    const band = listRef.current?.children[index] as HTMLElement | undefined;
    band?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  if (groups.length === 0) return null;

  return (
    <div className="by-next by-shell" data-active={groups[active]?.horizon}>
      <div className="by-next__layout">
        <div className="by-next__viewer">
          <Reveal variant="fade" className="by-next__viewer-inner">
            <HorizonRoad groups={groups} active={active} travel={travel} moving={moving} onJump={jump} />
          </Reveal>
        </div>
        <ol ref={listRef} className="by-next__bands">
          {groups.map((group, index) => (
            <HorizonBand key={group.horizon} group={group} index={index} active={index === active} />
          ))}
        </ol>
      </div>
      <Reveal variant="clip" className="by-next__horizon" aria-hidden="true" />
    </div>
  );
}

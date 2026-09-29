import type { ReactNode } from "react";
import { TiltLayer } from "@/animations";
import { cn } from "@/lib/cn";
import type { ProjectCategory } from "@/types/content";

/**
 * PROJECT ART — a designed, category-driven visual for a project that has
 * no photos yet (public/media/projects/<id>/ is empty). As soon as media
 * is added, the Work lenses show the real cover instead (see
 * ProjectVisual), so this never needs to be removed by hand.
 *
 *   ai             a conversation: chat window, replies, a typing indicator
 *   social-impact  a cohort: many small nodes gathering into one hub, fanning out to opportunities
 *   web            a browser frame with a page being laid out
 *   research       stacked paper, ruled lines, a highlighted passage, a magnifier
 *   product        steps rising toward a flag
 *
 * Three planes (back / mid / front) are TiltLayers, so inside a <Tilt>
 * they separate in depth; outside one they sit still. Small variations
 * (bubble lengths, node jitter) come from the title, so every project's
 * artwork is its own and identical on server and client. Colours come from
 * the theme tokens (styles/work.css `.wk-art`), so both themes work.
 * Continuous details (typing dots, flowing lines) only move while the art
 * is on screen and never under reduced motion (CSS).
 *
 * Exported for other pages (e.g. a detail hero without media):
 *   <ProjectArt category={project.category} title={project.title} variant="stage" />
 */

export interface ProjectArtProps {
  category: ProjectCategory | string;
  /** Drives the small deterministic variations. */
  title: string;
  /** Optional caption chip in the corner, e.g. "AI · Shipped". */
  label?: string;
  /** "stage" = large featured composition, "card" = regular cover, "thumb" = small. */
  variant?: "stage" | "card" | "thumb";
  className?: string;
}

/** djb2 — same title, same artwork, every render. */
function hashString(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h;
}

/** Tiny deterministic PRNG (mulberry32) → numbers in [0, 1). */
function random(seed: number): () => number {
  let a = seed || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VIEW = "0 0 480 320";

function Plane({ children }: { children: ReactNode }) {
  return (
    <svg className="wk-art__svg" viewBox={VIEW} preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true">
      {children}
    </svg>
  );
}

interface SceneProps {
  rand: () => number;
}

/* ------------------------------------------------------------------ */
/* ai — a conversation                                                  */
/* ------------------------------------------------------------------ */

function AiMid({ rand }: SceneProps) {
  const w1 = 150 + Math.round(rand() * 44);
  const w2 = 104 + Math.round(rand() * 44);
  return (
    <Plane>
      <rect className="wk-art__surface wk-art__edge" x="118" y="30" width="244" height="262" rx="22" />
      <circle className="wk-art__accent" cx="146" cy="60" r="11" />
      <rect className="wk-art__ink" x="166" y="53" width="84" height="6" rx="3" />
      <rect className="wk-art__ink wk-art__ink--dim" x="166" y="64" width="52" height="5" rx="2.5" />
      <line className="wk-art__line" x1="118" y1="84" x2="362" y2="84" />
      <rect className="wk-art__surface-2" x="138" y="100" width={w1} height="42" rx="16" />
      <rect className="wk-art__ink" x="154" y="113" width={w1 - 42} height="5" rx="2.5" />
      <rect className="wk-art__ink wk-art__ink--dim" x="154" y="125" width={w1 - 76} height="5" rx="2.5" />
      <rect className="wk-art__accent" x={342 - w2} y="156" width={w2} height="30" rx="15" />
      <rect className="wk-art__on-accent" x={356 - w2} y="168" width={w2 - 30} height="5" rx="2.5" />
      <rect className="wk-art__surface-2" x="138" y="200" width="72" height="30" rx="15" />
      <circle className="wk-art__dot" cx="158" cy="215" r="3.6" style={{ animationDelay: "0s" }} />
      <circle className="wk-art__dot" cx="174" cy="215" r="3.6" style={{ animationDelay: "0.16s" }} />
      <circle className="wk-art__dot" cx="190" cy="215" r="3.6" style={{ animationDelay: "0.32s" }} />
      <rect className="wk-art__line wk-art__nofill" x="138" y="246" width="204" height="28" rx="14" />
      <circle className="wk-art__accent" cx="326" cy="260" r="8" />
    </Plane>
  );
}

function AiFront({ rand }: SceneProps) {
  const lift = Math.round(rand() * 14);
  return (
    <Plane>
      <path
        className="wk-art__accent wk-art__spark"
        d="M392 50 C394 64 398 68 412 70 C398 72 394 76 392 90 C390 76 386 72 372 70 C386 68 390 64 392 50 Z"
      />
      <path className="wk-art__soft" d="M401 104 C402 110 404 112 410 113 C404 114 402 116 401 122 C400 116 398 114 392 113 C398 112 400 110 401 104 Z" />
      <g transform={`rotate(-6 390 ${214 - lift})`}>
        <rect className="wk-art__surface-2 wk-art__edge" x="344" y={196 - lift} width="92" height="34" rx="17" />
        <rect className="wk-art__ink wk-art__ink--dim" x="360" y={210 - lift} width="58" height="5" rx="2.5" />
      </g>
    </Plane>
  );
}

/* ------------------------------------------------------------------ */
/* social-impact — a cohort gathering and fanning out                   */
/* ------------------------------------------------------------------ */

const HUB = { x: 262, y: 160 };
const OUTCOMES = [
  { x: 398, y: 88 },
  { x: 416, y: 160 },
  { x: 398, y: 232 },
];

function cohort(rand: () => number) {
  const nodes: { x: number; y: number }[] = [];
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 5; row++) {
      nodes.push({
        x: 66 + col * 32 + Math.round((rand() - 0.5) * 12),
        y: 80 + row * 40 + Math.round((rand() - 0.5) * 12),
      });
    }
  }
  return nodes;
}

function NetworkMid({ rand }: SceneProps) {
  const nodes = cohort(rand);
  return (
    <Plane>
      {nodes.map((n, i) => (
        <line key={`l${i}`} className="wk-art__line wk-art__line--faint" x1={n.x} y1={n.y} x2={HUB.x} y2={HUB.y} />
      ))}
      {nodes.map((n, i) => (
        <circle key={`n${i}`} className={i % 5 === 2 ? "wk-art__accent" : "wk-art__ink"} cx={n.x} cy={n.y} r="4.2" />
      ))}
      {OUTCOMES.map((o, i) => (
        <path
          key={`p${i}`}
          className="wk-art__line wk-art__line--accent wk-art__nofill"
          d={`M${HUB.x} ${HUB.y} C ${HUB.x + 60} ${HUB.y}, ${o.x - 70} ${o.y}, ${o.x} ${o.y}`}
        />
      ))}
      <circle className="wk-art__surface-2 wk-art__edge--accent" cx={HUB.x} cy={HUB.y} r="20" />
      <circle className="wk-art__accent" cx={HUB.x} cy={HUB.y} r="7" />
      {OUTCOMES.map((o, i) => (
        <g key={`o${i}`}>
          <circle className="wk-art__surface wk-art__edge--accent" cx={o.x} cy={o.y} r="13" />
          <rect className="wk-art__soft" x={o.x - 5} y={o.y - 5} width="10" height="10" rx="2" />
        </g>
      ))}
    </Plane>
  );
}

function NetworkFront(_: SceneProps) {
  return (
    <Plane>
      <circle className="wk-art__pulse wk-art__nofill" cx={HUB.x} cy={HUB.y} r="20" />
      {OUTCOMES.map((o, i) => (
        <path
          key={i}
          className="wk-art__flow wk-art__nofill"
          d={`M${HUB.x} ${HUB.y} C ${HUB.x + 60} ${HUB.y}, ${o.x - 70} ${o.y}, ${o.x} ${o.y}`}
        />
      ))}
    </Plane>
  );
}

/* ------------------------------------------------------------------ */
/* web — a browser frame                                                */
/* ------------------------------------------------------------------ */

function WebMid({ rand }: SceneProps) {
  const h1 = 150 + Math.round(rand() * 40);
  return (
    <Plane>
      <rect className="wk-art__surface wk-art__edge" x="62" y="40" width="356" height="240" rx="16" />
      <line className="wk-art__line" x1="62" y1="70" x2="418" y2="70" />
      <circle className="wk-art__ink wk-art__ink--dim" cx="84" cy="55" r="4.5" />
      <circle className="wk-art__ink wk-art__ink--dim" cx="99" cy="55" r="4.5" />
      <circle className="wk-art__ink wk-art__ink--dim" cx="114" cy="55" r="4.5" />
      <rect className="wk-art__surface-2" x="138" y="47" width="200" height="16" rx="8" />
      <rect className="wk-art__ink wk-art__ink--dim" x="150" y="53" width="70" height="4" rx="2" />
      <rect className="wk-art__ink" x="86" y="94" width={h1} height="12" rx="4" />
      <rect className="wk-art__ink" x="86" y="114" width={h1 - 52} height="12" rx="4" />
      <rect className="wk-art__ink wk-art__ink--dim" x="86" y="138" width="150" height="6" rx="3" />
      <rect className="wk-art__ink wk-art__ink--dim" x="86" y="150" width="118" height="6" rx="3" />
      <rect className="wk-art__accent" x="86" y="166" width="62" height="18" rx="9" />
      <rect className="wk-art__soft" x="282" y="92" width="112" height="90" rx="10" />
      <circle className="wk-art__surface" cx="310" cy="118" r="9" />
      <path className="wk-art__surface" d="M288 176 L320 140 L342 162 L358 148 L390 176 Z" />
      {[86, 196, 306].map((x) => (
        <g key={x}>
          <rect className="wk-art__surface-2" x={x} y="200" width="92" height="60" rx="8" />
          <rect className="wk-art__ink wk-art__ink--dim" x={x + 12} y="216" width="52" height="5" rx="2.5" />
          <rect className="wk-art__ink wk-art__ink--dim" x={x + 12} y="228" width="38" height="5" rx="2.5" />
        </g>
      ))}
    </Plane>
  );
}

function WebFront({ rand }: SceneProps) {
  const tilt = 3 + Math.round(rand() * 4);
  return (
    <Plane>
      <g transform={`rotate(${tilt} 370 40)`}>
        <rect className="wk-art__surface-2 wk-art__edge--accent" x="318" y="14" width="130" height="52" rx="10" />
        <circle className="wk-art__soft" cx="340" cy="40" r="11" />
        <rect className="wk-art__ink" x="358" y="32" width="68" height="5" rx="2.5" />
        <rect className="wk-art__ink wk-art__ink--dim" x="358" y="43" width="46" height="5" rx="2.5" />
      </g>
      <path
        className="wk-art__cursor"
        d="M322 178 L322 210 L330 202 L336 216 L342 213 L336 199 L347 199 Z"
      />
    </Plane>
  );
}

/* ------------------------------------------------------------------ */
/* research — paper and lines                                           */
/* ------------------------------------------------------------------ */

function ResearchMid({ rand }: SceneProps) {
  const widths = Array.from({ length: 10 }, () => 96 + Math.round(rand() * 58));
  const highlight = 2 + Math.floor(rand() * 5);
  return (
    <Plane>
      <rect className="wk-art__surface-2 wk-art__edge" x="150" y="40" width="196" height="252" rx="6" transform="rotate(-8 248 166)" />
      <rect className="wk-art__surface-2 wk-art__edge" x="146" y="38" width="196" height="252" rx="6" transform="rotate(4 244 164)" />
      <rect className="wk-art__paper wk-art__edge" x="142" y="34" width="196" height="252" rx="6" />
      <rect className="wk-art__ink" x="162" y="56" width="112" height="9" rx="3" />
      <rect className="wk-art__ink wk-art__ink--dim" x="162" y="71" width="64" height="5" rx="2.5" />
      {widths.map((w, i) =>
        i === highlight ? (
          <g key={i}>
            <rect className="wk-art__soft wk-art__marker" x="158" y={90 + i * 17} width={w + 8} height="12" rx="3" />
            <rect className="wk-art__ink" x="162" y={94 + i * 17} width={w} height="4" rx="2" />
          </g>
        ) : (
          <rect key={i} className="wk-art__ink wk-art__ink--dim" x="162" y={94 + i * 17} width={w} height="4" rx="2" />
        )
      )}
      <circle className="wk-art__accent" cx="326" cy={98 + highlight * 17} r="3" />
    </Plane>
  );
}

function ResearchFront(_: SceneProps) {
  return (
    <Plane>
      <circle className="wk-art__lens" cx="350" cy="214" r="38" />
      <line className="wk-art__handle" x1="378" y1="242" x2="410" y2="274" />
    </Plane>
  );
}

/* ------------------------------------------------------------------ */
/* product (and anything else) — steps rising to a flag                 */
/* ------------------------------------------------------------------ */

function ProductMid({ rand }: SceneProps) {
  const heights = [44, 78, 110, 146, 184].map((h) => h + Math.round((rand() - 0.5) * 14));
  return (
    <Plane>
      <line className="wk-art__line" x1="56" y1="266" x2="424" y2="266" />
      {heights.map((h, i) => (
        <rect
          key={i}
          className={i === heights.length - 1 ? "wk-art__accent" : "wk-art__surface-2 wk-art__edge"}
          x={92 + i * 62}
          y={266 - h}
          width="42"
          height={h}
          rx="6"
        />
      ))}
      <path
        className="wk-art__line wk-art__line--dashed wk-art__nofill"
        d={`M113 ${266 - heights[0] - 16} ${heights.map((h, i) => `L${113 + i * 62} ${266 - h - 16}`).join(" ")}`}
      />
    </Plane>
  );
}

function ProductFront(_: SceneProps) {
  return (
    <Plane>
      <line className="wk-art__handle wk-art__handle--thin" x1="361" y1="66" x2="361" y2="20" />
      <path className="wk-art__accent" d="M362 20 L398 30 L362 42 Z" />
    </Plane>
  );
}

const SCENES: Record<ProjectCategory, { Mid: (p: SceneProps) => ReactNode; Front: (p: SceneProps) => ReactNode }> = {
  ai: { Mid: AiMid, Front: AiFront },
  "social-impact": { Mid: NetworkMid, Front: NetworkFront },
  web: { Mid: WebMid, Front: WebFront },
  research: { Mid: ResearchMid, Front: ResearchFront },
  product: { Mid: ProductMid, Front: ProductFront },
};

export function ProjectArt({ category, title, label, variant = "card", className }: ProjectArtProps) {
  const scene = SCENES[category as ProjectCategory] ?? SCENES.product;
  const { Mid, Front } = scene;
  const seed = hashString(title);
  return (
    <span
      className={cn("wk-art", `wk-art--${variant}`, className)}
      data-art={category in SCENES ? category : "product"}
      aria-hidden="true"
    >
      <TiltLayer as="span" depth={-14} className="wk-art__layer wk-art__back" />
      <TiltLayer as="span" depth={0} className="wk-art__layer wk-art__mid">
        <Mid rand={random(seed)} />
      </TiltLayer>
      <TiltLayer as="span" depth={22} className="wk-art__layer wk-art__front">
        <Front rand={random(seed ^ 0x9e3779b9)} />
      </TiltLayer>
      {label && <span className="wk-art__label">{label}</span>}
    </span>
  );
}

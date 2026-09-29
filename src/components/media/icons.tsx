/**
 * Small stroke icons for the media controls. 24×24 grid, currentColor,
 * always decorative (the buttons carry the accessible label).
 */

interface IconProps {
  className?: string;
}

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function PlayIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8 5.5v13a.6.6 0 0 0 .9.5l10.2-6.5a.6.6 0 0 0 0-1L8.9 5a.6.6 0 0 0-.9.5Z" fill="currentColor" />
    </svg>
  );
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="6.5" y="5" width="3.6" height="14" rx="1" fill="currentColor" stroke="none" />
      <rect x="13.9" y="5" width="3.6" height="14" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ReplayIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 4.5v3.8h3.8" />
    </svg>
  );
}

/** Circular arrow with "10" — `dir` flips it for forward. */
export function SkipIcon({ className, dir }: IconProps & { dir: "back" | "forward" }) {
  return (
    <svg {...base} className={className} style={dir === "forward" ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M5 12a7 7 0 1 0 2.05-4.95" />
      <path d="M5 4.5v3.2h3.2" />
      <text
        x="12.2"
        y="15.2"
        textAnchor="middle"
        fontSize="7.2"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
        style={dir === "forward" ? { transform: "scaleX(-1)", transformOrigin: "12.2px 12px" } : undefined}
      >
        10
      </text>
    </svg>
  );
}

export function VolumeIcon({ className, level }: IconProps & { level: "muted" | "low" | "high" }) {
  return (
    <svg {...base} className={className}>
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" fill="currentColor" strokeWidth={1.2} />
      {level === "muted" ? (
        <path d="m16 9.5 5 5m0-5-5 5" />
      ) : (
        <>
          <path d="M15.5 9.2a4 4 0 0 1 0 5.6" />
          {level === "high" && <path d="M18 6.8a7.5 7.5 0 0 1 0 10.4" />}
        </>
      )}
    </svg>
  );
}

export function ChevronIcon({ className, dir }: IconProps & { dir: "left" | "right" }) {
  return (
    <svg {...base} className={className}>
      <path d={dir === "left" ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5"} />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function ExpandIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M14 4.5h5.5V10M10 19.5H4.5V14M19.5 4.5 13.5 10.5M4.5 19.5l6-6" />
    </svg>
  );
}

import { cn } from "@/lib/cn";

/** Small uppercase label used above headings to give sections a place-name. */
export function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-paper-dim",
        className
      )}
    >
      <span className="h-px w-6 bg-azure-soft" aria-hidden />
      {children}
    </p>
  );
}

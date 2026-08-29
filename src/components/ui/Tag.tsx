import { cn } from "@/lib/cn";

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-ink-line px-3 py-1 text-xs text-paper-dim",
        className
      )}
    >
      {children}
    </span>
  );
}

const tierStyles: Record<string, string> = {
  featured: "border-azure-soft/50 text-azure-soft",
  significant: "border-ink-line-strong text-paper",
  archive: "border-ink-line text-paper-faint",
};

export function TierTag({ tier }: { tier: "featured" | "significant" | "archive" }) {
  const label = tier === "featured" ? "Featured" : tier === "significant" ? "Significant" : "Archive";
  return <Tag className={tierStyles[tier]}>{label}</Tag>;
}

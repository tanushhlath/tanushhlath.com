import Link from "@/lib/Link";
import { Reveal } from "@/components/motion/Reveal";

interface Thread {
  lead: string;
  title: string;
  href: string;
}

/**
 * Ends a detail page by pointing somewhere else rather than just stopping —
 * "This project led me to..." → related project, etc. Pass 1-3 threads;
 * pages with nothing to link onward should omit this entirely rather than
 * rendering it empty.
 */
export function ContinueThread({ threads }: { threads: Thread[] }) {
  if (threads.length === 0) return null;
  return (
    <div className="border-t border-ink-line px-5 sm:px-8 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl space-y-8">
        {threads.map((t, i) => (
          <Reveal key={t.href} delay={i * 0.06}>
            <Link href={t.href} className="group block" data-cursor="view" data-cursor-label="Open">
              <p className="text-sm text-paper-faint">{t.lead}</p>
              <p className="mt-2 flex items-center gap-3 font-display text-2xl sm:text-3xl text-paper transition-colors duration-200 group-hover:text-azure-soft">
                {t.title}
                <span className="text-azure-soft transition-transform duration-200 group-hover:translate-x-1.5">
                  →
                </span>
              </p>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

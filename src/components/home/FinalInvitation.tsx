import Link from "@/lib/Link";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/ui/Magnetic";

const links = [
  { href: "/work", label: "See the full body of work" },
  { href: "/beyond", label: "See what's next" },
  { href: "/explore", label: "Explore a different way" },
  { href: "/archive", label: "Enter the archive" },
];

export function FinalInvitation() {
  return (
    <section className="border-t border-ink-line px-5 sm:px-8 py-28 sm:py-36 text-center">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="font-display text-balance text-[clamp(2rem,6vw,4rem)] leading-tight text-paper">
            That&rsquo;s the surface. There&rsquo;s a lot more underneath.
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {links.map((l) => (
            <Magnetic key={l.href} strength={0.2}>
              <Link
                href={l.href}
                data-cursor="view"
                data-cursor-label="Go"
                className="inline-block rounded-full border border-ink-line px-5 py-2.5 text-sm text-paper-dim transition-colors duration-200 hover:border-azure-soft hover:text-azure-soft"
              >
                {l.label}
              </Link>
            </Magnetic>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

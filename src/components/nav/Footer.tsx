import Link from "next/link";
import { site } from "@/content/site";
import { CopyEmail } from "@/components/ui/CopyEmail";

export function Footer() {
  const otherLinks = site.social.filter((s) => s.label !== "Email");

  return (
    <footer className="border-t border-ink-line px-5 sm:px-8 py-12 text-sm text-paper-faint">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-lg text-paper">{site.name}</p>
            <p className="mt-1 max-w-xs text-paper-faint">{site.tagline}</p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <CopyEmail email={site.email} className="text-paper hover:text-azure-soft transition-colors duration-200" />
            <div className="flex flex-wrap gap-x-5 gap-y-2 sm:justify-end">
              {otherLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  className="hover:text-paper transition-colors duration-200"
                  target={s.url.startsWith("http") ? "_blank" : undefined}
                  rel={s.url.startsWith("http") ? "noreferrer" : undefined}
                >
                  {s.label}
                </a>
              ))}
              <Link href="/archive" className="hover:text-paper transition-colors duration-200">
                Archive
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col-reverse gap-2 border-t border-ink-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {site.name}. Built as a living page — it changes as I do.</p>
          <p className="text-paper-faint">{site.location}</p>
        </div>
      </div>
    </footer>
  );
}

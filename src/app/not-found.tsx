import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center px-5 text-center">
      <p className="font-display text-[clamp(4rem,15vw,8rem)] leading-none text-paper">404</p>
      <p className="mt-4 max-w-md text-paper-dim">
        Nothing here — but there&rsquo;s plenty everywhere else. Try exploring instead.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="rounded-full bg-azure px-6 py-3 text-sm font-medium text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-azure-soft"
        >
          Go home
        </Link>
        <Link
          href="/explore"
          className="rounded-full border border-ink-line px-6 py-3 text-sm text-paper transition-colors duration-200 hover:border-azure-soft hover:text-azure-soft"
        >
          Explore instead
        </Link>
      </div>
    </div>
  );
}

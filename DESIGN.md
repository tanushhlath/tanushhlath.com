# Design System

## Direction

Editorial + cinematic + youthful + sophisticated — deliberately not a SaaS
landing page, not a developer portfolio, not LinkedIn. The reference points
are indie magazines and studio sites, not dashboards.

## Color

Defined as CSS variables in `src/app/globals.css`, exposed to Tailwind via
`@theme inline` (Tailwind v4's CSS-based config — there's no
`tailwind.config.js`).

| Token | Value | Use |
|---|---|---|
| `--color-ink` | `#12100e` | Base background — warm near-black, not `#000` |
| `--color-ink-raised` | `#1c1815` | Cards, raised panels |
| `--color-paper` | `#f5f0e8` | Primary text — warm off-white, not pure white |
| `--color-paper-dim` / `-faint` | | Secondary / tertiary text |
| `--color-azure` / `-soft` | `#3a5cff` / `#7d8fff` | The one accent. Used for links, CTAs, active states |
| `--color-ember` | `#ff6a3d` | Secondary warm accent — used *rarely* (currently just the Lab "testing" status and the "Surprise me" button) |

Change these variables and the whole site follows — nothing hard-codes hex
values in components.

## Typography

Two fonts, loaded via `next/font/google` in `src/app/layout.tsx`:

- **Fraunces** (`font-display` utility) — an editorial serif with real
  personality, used for all large headings. Its optical-size and softness
  axes are enabled, which is what gives headings their slightly warm,
  hand-set feel instead of looking like generic "big serif."
- **Manrope** (`font-sans`, the default) — a modern grotesk for everything
  else: body copy, labels, UI.

Monospace is intentionally almost unused — the one spot is the small
numbered list on the homepage ("01 / 02 / 03...") as a tiny deliberate detail,
not a running theme.

## Motion language

Defined once in `src/lib/motion.ts` and consumed via the `<Reveal>` component
(`src/components/motion/Reveal.tsx`) rather than re-invented per section.

- **Enter** — content fades up 28px on scroll into view (`fadeUp` /
  `<Reveal>`), once per element, with a shared easing curve
  (`cubic-bezier(0.16, 1, 0.3, 1)` — a fast-out, gentle-settle curve).
- **Explore** — hover states are subtle: color shifts, small translates,
  never full transforms or spins.
- **Expand** — accordions (Skills) and modals (What I Care About) use
  height/opacity/scale transitions around 300–350ms.
- **Transition** — the full-screen nav overlay fades and its columns
  stagger in; page-to-page navigation itself is instant (no artificial
  page-transition delay — cinematic motion within a page, not friction
  between pages).
- **Exit** — quick, no lingering (150–250ms).

`prefers-reduced-motion: reduce` is respected globally in `globals.css`
(collapses all animation/transition durations to near-zero) — this is a
blanket safety net in addition to component-level restraint.

## Layout principles

- Not everything is a rounded card. Full-bleed hero, large cropped imagery,
  thin-line dividers, and plain text rows sit alongside cards where a card
  genuinely helps (project previews, the Lab grid).
- A very faint film-grain texture sits over the whole page
  (`body::before` in `globals.css`) at 3.5% opacity — it keeps large flat
  dark panels from looking like flat UI, without being visible as an effect.
- Tier (`featured` / `significant` / `archive`) is the main driver of visual
  size — see `CONTENT_GUIDE.md` for how to change it.

## Extending the system

- New accent color needed for something one-off? Don't add a new global
  token — that's a sign it should probably just be azure or ember.
- New motion pattern needed? Add it to `src/lib/motion.ts` so it's reusable,
  rather than writing bespoke Framer Motion props inline in a component.

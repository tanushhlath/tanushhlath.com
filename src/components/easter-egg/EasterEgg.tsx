import { useEffect, useId, useRef, useState, type FormEvent, type Ref } from "react";
import { AnimatePresence, motion, useAnimate, type Variants } from "framer-motion";
import { DUR, EASE, useReducedMotionSafe } from "@/animations";
import { VideoPlayer } from "@/components/media";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { easterEgg, site } from "@/lib/content";
import { useFileMode } from "@/routing/fileMode";
import Link from "@/routing/Link";
import { canUnlock, unlockEgg } from "./eggCrypto";

/**
 * EASTER EGG DIALOG — opened by three quick clicks/taps on the wordmark
 * (components/nav/Wordmark.tsx); hosted by SiteChrome, which also owns the
 * focus trap, the inert page, Esc, scroll lock and focus return.
 *
 * Copy comes from `easterEgg` in src/content/site.ts. The password is not
 * in the code: the video is encrypted with it (see eggCrypto.ts), so
 * nothing is downloaded until a password is submitted, and a wrong one
 * simply fails to decrypt. The right one plays a short iris reveal into a
 * custom player (no download / speed / PiP / cast UI, never autoplays,
 * pauses and blacks out when the tab or window loses focus). Closing the
 * dialog unmounts the player and revokes the video's object URL.
 *
 * Opened from a file:// copy of the site, it explains that the secret
 * only opens on the live site (fetch is blocked there).
 */

/** Interface words (not content). */
const UI = {
  password: "Password",
  open: "Open",
  opening: "Opening…",
  showHint: "Reveal hint",
  hideHint: "Hide hint",
  close: "Close",
  fileMode: "This one only opens on the live site.",
  unsupported: "This needs a secure (https) connection — it opens on the live site.",
  error: "It didn't open this time. Give it another try in a moment.",
} as const;

export interface EasterEggDialogProps {
  /** The dialog element (SiteChrome traps focus inside it). */
  ref?: Ref<HTMLDivElement>;
  /** Attached to the password field, which gets focus on open. */
  inputRef?: Ref<HTMLInputElement>;
  /** The visitor closed it (×, Esc, backdrop). */
  onClose: () => void;
}

type Phase = "form" | "unlocking" | "video";
type Problem = "wrong" | "error" | "unsupported" | null;

export function EasterEggDialog({ ref, inputRef, onClose }: EasterEggDialogProps) {
  const reduced = useReducedMotionSafe();
  const fileMode = useFileMode();
  const titleId = useId();
  const subtitleId = useId();
  const [phase, setPhase] = useState<Phase>("form");
  const [problem, setProblem] = useState<Problem>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const urlRef = useRef<string | null>(null);

  // Closing (unmount) cancels an unlock in flight and frees the decrypted video.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    },
    []
  );

  const submit = async (password: string): Promise<Problem> => {
    if (!password.trim()) return "wrong";
    if (!canUnlock()) return "unsupported";
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("unlocking");
    setProblem(null);
    try {
      const result = await unlockEgg(password, controller.signal);
      if (controller.signal.aborted) return null;
      if (result.status === "ok") {
        urlRef.current = result.url;
        setVideoUrl(result.url);
        setPhase("video");
        return null;
      }
      setPhase("form");
      return result.status;
    } catch {
      return null; // aborted: the dialog is closing
    }
  };

  const variants = dialogVariants(reduced);

  return (
    <motion.div
      ref={ref}
      className="egg"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={subtitleId}
      data-phase={phase}
      initial="hidden"
      animate="shown"
      exit="hidden"
      variants={variants.dialog}
    >
      <motion.div className="egg__scrim" aria-hidden="true" variants={variants.scrim} />
      <div className="egg__stage" onClick={(e) => phase !== "video" && e.target === e.currentTarget && onClose()}>
        <AnimatePresence mode="wait" initial={false}>
          {phase === "video" && videoUrl ? (
            <VideoView key="video" url={videoUrl} titleId={titleId} subtitleId={subtitleId} onClose={onClose} reduced={reduced} />
          ) : (
            <FormView
              key="form"
              titleId={titleId}
              subtitleId={subtitleId}
              inputRef={inputRef}
              busy={phase === "unlocking"}
              fileMode={fileMode}
              problem={problem}
              onProblem={setProblem}
              onSubmit={submit}
              onClose={onClose}
              reduced={reduced}
              variants={variants.card}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Password card                                                       */
/* ------------------------------------------------------------------ */

interface FormViewProps {
  titleId: string;
  subtitleId: string;
  inputRef?: Ref<HTMLInputElement>;
  busy: boolean;
  fileMode: boolean;
  problem: Problem;
  onProblem: (problem: Problem) => void;
  onSubmit: (password: string) => Promise<Problem>;
  onClose: () => void;
  reduced: boolean;
  variants: Variants;
}

function FormView({
  titleId,
  subtitleId,
  inputRef,
  busy,
  fileMode,
  problem,
  onProblem,
  onSubmit,
  onClose,
  reduced,
  variants,
}: FormViewProps) {
  const [hintOpen, setHintOpen] = useState(false);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const fieldId = useId();
  const hintId = useId();
  const messageId = useId();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const input = event.currentTarget.elements.namedItem("password");
    const field = input instanceof HTMLInputElement ? input : null;
    const next = await onSubmit(field?.value ?? "");
    if (!next) return;
    onProblem(next);
    if (next === "wrong") {
      field?.select();
      if (!reduced && scope.current) {
        animate(scope.current, { x: [0, -12, 10, -7, 5, -2, 0] }, { duration: 0.5, ease: "easeOut" });
      }
    }
  };

  // Once the hint is showing, the wrong-password line stops suggesting it.
  const wrongMessage = hintOpen ? (easterEgg.wrongPasswordWithHint ?? easterEgg.wrongPassword) : easterEgg.wrongPassword;
  const message =
    problem === "wrong"
      ? wrongMessage
      : problem === "error"
        ? UI.error
        : problem === "unsupported"
          ? UI.unsupported
          : "";

  return (
    <motion.div className="egg-card" variants={variants} initial="hidden" animate="shown" exit="hidden">
      <div ref={scope} className="egg-card__body">
        <div className="egg-card__head">
          <span className="egg-seal" aria-hidden="true">
            <span className="egg-seal__ring" />
            <span className="egg-seal__ring egg-seal__ring--2" />
            <svg className="egg-seal__lock" viewBox="0 0 24 24" data-open={busy ? "" : undefined}>
              <path className="egg-seal__shackle" d="M8 11V8a4 4 0 0 1 8 0v3" />
              <rect x="5.5" y="11" width="13" height="9.5" rx="2.5" />
              <circle cx="12" cy="15.6" r="1.3" />
            </svg>
          </span>
          <CloseButton onClose={onClose} />
        </div>

        <h2 id={titleId} className="egg-card__title">
          {easterEgg.title}
        </h2>
        <p id={subtitleId} className="egg-card__subtitle">
          {easterEgg.subtitle}
        </p>

        {fileMode ? (
          <div className="egg-card__file">
            <p>{UI.fileMode}</p>
            <ExternalLink href={`${site.url}/`} className="egg-card__file-link">
              {site.url.replace(/^https?:\/\//, "")}
            </ExternalLink>
          </div>
        ) : (
          <form className="egg-form" onSubmit={handleSubmit} aria-busy={busy} noValidate>
            <label htmlFor={fieldId} className="egg-form__label">
              {UI.password}
            </label>
            <div className="egg-form__row">
              <input
                ref={inputRef}
                id={fieldId}
                name="password"
                type="password"
                className="egg-form__input"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                readOnly={busy}
                aria-invalid={problem === "wrong" ? true : undefined}
                aria-describedby={message ? messageId : undefined}
                onChange={() => problem && onProblem(null)}
              />
              <button type="submit" className="egg-form__submit" disabled={busy} data-cursor="view" data-cursor-label={UI.open}>
                {busy ? (
                  <>
                    <span className="egg-spinner" aria-hidden="true" />
                    <span>{UI.opening}</span>
                  </>
                ) : (
                  <>
                    <span>{UI.open}</span>
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </div>

            <p id={messageId} className="egg-form__message" role="alert">
              {message}
            </p>

            <div className="egg-hint">
              <button
                type="button"
                className="egg-hint__toggle"
                aria-expanded={hintOpen}
                aria-controls={hintId}
                onClick={() => setHintOpen((v) => !v)}
              >
                <span className="egg-hint__glyph" aria-hidden="true">
                  ?
                </span>
                {hintOpen ? UI.hideHint : UI.showHint}
              </button>
              <AnimatePresence initial={false}>
                {hintOpen && (
                  <motion.p
                    id={hintId}
                    className="egg-hint__text"
                    initial={{ opacity: 0, height: 0, y: reduced ? 0 : -4 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: reduced ? 0 : -4 }}
                    transition={{ duration: DUR.fast, ease: EASE.standard }}
                  >
                    {easterEgg.hint}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* The reveal                                                          */
/* ------------------------------------------------------------------ */

interface VideoViewProps {
  url: string;
  titleId: string;
  subtitleId: string;
  onClose: () => void;
  reduced: boolean;
}

function VideoView({ url, titleId, subtitleId, onClose, reduced }: VideoViewProps) {
  const iris: Variants = reduced
    ? { hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: DUR.fast } } }
    : {
        hidden: { clipPath: "circle(0% at 50% 50%)", scale: 0.9, opacity: 1 },
        shown: {
          clipPath: "circle(75% at 50% 50%)",
          scale: 1,
          transition: { duration: 0.64, ease: EASE.cinematic },
        },
      };

  return (
    <motion.div
      className="egg-reveal"
      initial="hidden"
      animate="shown"
      exit={{ opacity: 0, transition: { duration: DUR.fast } }}
    >
      {!reduced && (
        <motion.span
          className="egg-reveal__flash"
          aria-hidden="true"
          initial={{ scale: 0.2, opacity: 0.9 }}
          animate={{ scale: 2.4, opacity: 0 }}
          transition={{ duration: 0.7, ease: EASE.enter }}
        />
      )}
      <div className="egg-reveal__head">
        <div>
          <h2 id={titleId} className="egg-reveal__title">
            {easterEgg.title}
          </h2>
          <p id={subtitleId} className="sr-only">
            {easterEgg.subtitle}
          </p>
        </div>
        <CloseButton onClose={onClose} />
      </div>

      <motion.div className="egg-reveal__frame" variants={iris}>
        <VideoPlayer
          src={url}
          title={easterEgg.title}
          caption={easterEgg.caption}
          protectOnBlur
          autoFocus
          maxHeight="min(62svh, 36rem)"
          className="egg-reveal__player"
        />
      </motion.div>

      <motion.div
        className="egg-reveal__after"
        initial={{ opacity: 0, y: reduced ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR.base, ease: EASE.enter, delay: reduced ? 0 : 0.45 }}
      >
        {easterEgg.signoff && <p className="egg-reveal__signoff">{easterEgg.signoff}</p>}
        <Link href={easterEgg.afterLink.href} className="egg-reveal__link" data-cursor="view" data-cursor-label="Go">
          <span>{easterEgg.afterLink.label}</span>
          <span className="egg-reveal__arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </motion.div>
    </motion.div>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" className="egg-close" onClick={onClose} aria-label={UI.close} data-cursor="close">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Motion                                                              */
/* ------------------------------------------------------------------ */

function dialogVariants(reduced: boolean): Record<"dialog" | "scrim" | "card", Variants> {
  return {
    dialog: { hidden: {}, shown: {} },
    scrim: {
      hidden: { opacity: 0, transition: { duration: DUR.fast } },
      shown: { opacity: 1, transition: { duration: DUR.base, ease: EASE.standard } },
    },
    card: reduced
      ? {
          hidden: { opacity: 0, transition: { duration: DUR.micro } },
          shown: { opacity: 1, transition: { duration: DUR.fast } },
        }
      : {
          hidden: { opacity: 0, y: 24, scale: 0.96, filter: "blur(6px)", transition: { duration: 0.22, ease: EASE.exit } },
          shown: {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            transition: { duration: DUR.base, ease: EASE.enter, delay: 0.08 },
          },
        },
  };
}

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { cn } from "@/lib/cn";
import { mediaUrl, protectHandlers } from "./protection";
import { PauseIcon, PlayIcon, ReplayIcon, SkipIcon, VolumeIcon } from "./icons";

export interface VideoPlayerProps {
  /** Site path ("/media/…"), absolute URL, or a blob: URL. */
  src: string;
  poster?: string;
  caption?: string;
  /** Accessible name, e.g. "Jumping practice — clip 1". */
  title?: string;
  /** Intrinsic size (from the media manifest) — reserves space before metadata loads. */
  width?: number;
  height?: number;
  /** Cap for tall/portrait clips, any CSS length. Default "78svh". */
  maxHeight?: string;
  /**
   * Pause and black the frame out when the tab is hidden or the window
   * loses focus; playback resumes only after a deliberate click.
   */
  protectOnBlur?: boolean;
  loop?: boolean;
  onEnded?: () => void;
  /** Move focus to the play button on mount (e.g. right after a reveal). */
  autoFocus?: boolean;
  className?: string;
}

/**
 * Custom, keyboard-accessible video player. No native controls at all, so
 * there is no download / playback-speed / picture-in-picture / cast UI;
 * those are also disabled at the element level where browsers allow it.
 * Never autoplays. Only one player on the page plays at a time.
 *
 * Keys (while any control is focused): Space/K play-pause, J/L ∓10 s,
 * ←/→ ∓5 s, M mute. The seek and volume sliders are native range inputs.
 */
export function VideoPlayer({
  src,
  poster,
  caption,
  title,
  width,
  height,
  maxHeight = "78svh",
  protectOnBlur = false,
  loop = false,
  onEnded,
  autoFocus = false,
  className,
}: VideoPlayerProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const idleTimer = useRef<number | undefined>(undefined);
  const resumeAfterShield = useRef(false);
  const [shielded, setShielded] = useState(false);

  const media = useMediaState(videoRef, src);
  const url = mediaUrl(src);
  const near = useNearViewport(rootRef);

  /* --- commands ------------------------------------------------------ */

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) v.play().catch(() => {});
    else v.pause();
  }, []);

  const seekTo = useCallback((time: number) => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration)) return;
    v.currentTime = Math.min(v.duration, Math.max(0, time));
  }, []);

  const skip = useCallback(
    (delta: number) => {
      const v = videoRef.current;
      if (v) seekTo(v.currentTime + delta);
    },
    [seekTo]
  );

  const setVolume = useCallback((value: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = value;
    v.muted = value === 0;
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.muted || v.volume === 0) {
      if (v.volume === 0) v.volume = 0.6;
      v.muted = false;
    } else {
      v.muted = true;
    }
  }, []);

  /* --- controls auto-hide (DOM attribute, no per-move React state) ---- */

  const wake = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    root.removeAttribute("data-idle");
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) root.setAttribute("data-idle", "");
    }, 2600);
  }, []);

  useEffect(() => () => window.clearTimeout(idleTimer.current), []);

  /* --- one player at a time ------------------------------------------ */

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const announce = () => window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: id }));
    const onOtherPlay = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id && !v.paused) v.pause();
    };
    v.addEventListener("play", announce);
    window.addEventListener(PLAY_EVENT, onOtherPlay);
    return () => {
      v.removeEventListener("play", announce);
      window.removeEventListener(PLAY_EVENT, onOtherPlay);
    };
  }, [id]);

  /* --- blackout on tab/window loss ----------------------------------- */

  useEffect(() => {
    const v = videoRef.current;
    if (!protectOnBlur || !v) return;
    const hide = () => {
      resumeAfterShield.current = resumeAfterShield.current || !v.paused;
      v.pause();
      setShielded(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") hide();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", hide);
    window.addEventListener("pagehide", hide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", hide);
      window.removeEventListener("pagehide", hide);
    };
  }, [protectOnBlur]);

  const resume = () => {
    setShielded(false);
    if (resumeAfterShield.current) videoRef.current?.play().catch(() => {});
    resumeAfterShield.current = false;
    requestAnimationFrame(() => playButtonRef.current?.focus({ preventScroll: true }));
  };

  useEffect(() => {
    if (autoFocus) playButtonRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  /* --- keyboard ------------------------------------------------------ */

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey || shielded) return;
    const target = e.target as HTMLElement;
    const onRange = target instanceof HTMLInputElement && target.type === "range";
    switch (e.key) {
      case " ":
        if (target.tagName === "BUTTON") return; // native activation
        e.preventDefault();
        togglePlay();
        break;
      case "k":
      case "K":
        e.preventDefault();
        togglePlay();
        break;
      case "j":
      case "J":
        e.preventDefault();
        skip(-10);
        break;
      case "l":
      case "L":
        e.preventDefault();
        skip(10);
        break;
      case "ArrowLeft":
      case "ArrowRight":
        if (onRange) return; // the slider handles its own arrows
        e.preventDefault();
        skip(e.key === "ArrowLeft" ? -5 : 5);
        break;
      case "m":
      case "M":
        e.preventDefault();
        toggleMute();
        break;
      default:
        return;
    }
    wake();
  };

  /* --- render -------------------------------------------------------- */

  const ratio =
    width && height ? width / height : media.videoRatio > 0 ? media.videoRatio : 16 / 9;
  // Without a poster, Safari shows a black frame until playback; asking for
  // a time fragment makes it paint the first frame.
  const videoSrc = !poster && !url.startsWith("blob:") && !url.includes("#") ? `${url}#t=0.001` : url;
  const progress = media.duration ? media.current / media.duration : 0;
  const bufferedFrac = media.duration ? Math.min(1, media.buffered / media.duration) : 0;
  const state = media.error ? "error" : media.ended ? "ended" : media.paused ? "paused" : "playing";
  const effectiveVolume = media.muted ? 0 : media.volume;
  const volumeLevel = effectiveVolume === 0 ? "muted" : effectiveVolume < 0.5 ? "low" : "high";
  const label = title ? `Video: ${title}` : "Video";

  return (
    <figure
      className={cn("vp", className)}
      style={{ width: `min(100%, calc(${maxHeight} * ${ratio.toFixed(4)}))` }}
      {...protectHandlers}
    >
      <div
        ref={rootRef}
        role="group"
        aria-label={label}
        className="vp-frame"
        style={{ aspectRatio: ratio.toFixed(4) }}
        data-state={state}
        data-started={media.started ? "" : undefined}
        data-buffering={media.buffering ? "" : undefined}
        data-shielded={shielded ? "" : undefined}
        onPointerMove={wake}
        onKeyDown={onKeyDown}
        onFocus={wake}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          poster={poster ? mediaUrl(poster) : undefined}
          // Even "metadata" makes Chrome fetch a short clip whole, so a player
          // loads nothing until it is about to scroll into view
          // (pressing play loads it regardless). Decrypted blobs are local.
          preload={near || url.startsWith("blob:") ? "metadata" : "none"}
          playsInline
          loop={loop}
          controlsList="nodownload noplaybackrate noremoteplayback"
          disablePictureInPicture
          disableRemotePlayback
          x-webkit-airplay="deny"
          tabIndex={-1}
          onEnded={onEnded}
          className="vp-video"
        />

        {/* Click surface: toggles playback. Keyboard users use the play button. */}
        <div className="vp-surface" aria-hidden="true" onClick={shielded ? undefined : togglePlay}>
          <span className="vp-bigplay">
            {state === "ended" ? <ReplayIcon /> : <PlayIcon />}
          </span>
          <span className="vp-spinner" />
        </div>

        {media.error && (
          <p className="vp-message" role="status">
            This clip couldn’t be loaded.
          </p>
        )}

        <div className="vp-controls" inert={shielded}>
          <div className="vp-seek">
            <span className="vp-seek__track" aria-hidden="true">
              <span className="vp-seek__buffer" style={{ transform: `scaleX(${bufferedFrac})` }} />
              <span className="vp-seek__fill" style={{ transform: `scaleX(${progress})` }} />
            </span>
            <input
              type="range"
              className="vp-range"
              min={0}
              max={media.duration || 0}
              step={0.1}
              value={Math.min(media.current, media.duration || 0)}
              disabled={!media.duration}
              aria-label="Seek"
              aria-valuetext={`${formatTime(media.current)} of ${formatTime(media.duration)}`}
              onChange={(e) => seekTo(Number(e.target.value))}
              onPointerDown={(e) => e.currentTarget.parentElement?.setAttribute("data-scrubbing", "")}
              onPointerUp={(e) => e.currentTarget.parentElement?.removeAttribute("data-scrubbing")}
              onPointerCancel={(e) => e.currentTarget.parentElement?.removeAttribute("data-scrubbing")}
            />
          </div>

          <div className="vp-bar">
            <div className="vp-group">
              <button
                ref={playButtonRef}
                type="button"
                className="vp-btn vp-btn--primary"
                onClick={togglePlay}
                aria-label={state === "playing" ? "Pause" : state === "ended" ? "Replay" : "Play"}
              >
                {state === "playing" ? <PauseIcon /> : state === "ended" ? <ReplayIcon /> : <PlayIcon />}
              </button>
              <button type="button" className="vp-btn" onClick={() => skip(-10)} aria-label="Back 10 seconds">
                <SkipIcon dir="back" />
              </button>
              <button type="button" className="vp-btn" onClick={() => skip(10)} aria-label="Forward 10 seconds">
                <SkipIcon dir="forward" />
              </button>
              <span className="vp-time" aria-hidden="true">
                {formatTime(media.current)}
                <span className="vp-time__sep">/</span>
                {formatTime(media.duration)}
              </span>
            </div>
            <div className="vp-group vp-group--end">
              <button
                type="button"
                className="vp-btn"
                onClick={toggleMute}
                aria-label={media.muted || media.volume === 0 ? "Unmute" : "Mute"}
              >
                <VolumeIcon level={volumeLevel} />
              </button>
              <input
                type="range"
                className="vp-range vp-volume"
                min={0}
                max={1}
                step={0.05}
                value={effectiveVolume}
                aria-label="Volume"
                aria-valuetext={`${Math.round(effectiveVolume * 100)}%`}
                style={{ "--vp-volume": effectiveVolume } as CSSProperties}
                onChange={(e) => setVolume(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {shielded && (
          <button type="button" className="vp-shield" onClick={resume} autoFocus>
            <span className="vp-shield__title">Paused while you were away</span>
            <span className="vp-shield__hint">Click to continue</span>
          </button>
        )}
      </div>
      {caption && <figcaption className="vp-caption">{caption}</figcaption>}
    </figure>
  );
}

const PLAY_EVENT = "tl:video-play";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds % 60);
  const m = Math.floor(seconds / 60) % 60;
  const h = Math.floor(seconds / 3600);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/**
 * True once the element has come within 300px of the viewport
 * (and stays true). False on the server and on the first client render.
 */
function useNearViewport(ref: RefObject<HTMLElement | null>): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (near || !el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setNear(true);
      },
      { rootMargin: "300px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, near]);
  return near;
}

/* ------------------------------------------------------------------ */
/* Media element state, read from the element on its own events        */
/* ------------------------------------------------------------------ */

interface MediaState {
  paused: boolean;
  ended: boolean;
  started: boolean;
  current: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  buffering: boolean;
  error: boolean;
  videoRatio: number;
}

const INITIAL_STATE: MediaState = {
  paused: true,
  ended: false,
  started: false,
  current: 0,
  duration: 0,
  buffered: 0,
  volume: 1,
  muted: false,
  buffering: false,
  error: false,
  videoRatio: 0,
};

const MEDIA_EVENTS = [
  "loadedmetadata",
  "durationchange",
  "timeupdate",
  "progress",
  "play",
  "pause",
  "playing",
  "waiting",
  "canplay",
  "seeked",
  "ended",
  "volumechange",
  "error",
  "emptied",
] as const;

function readState(v: HTMLVideoElement): MediaState {
  const duration = Number.isFinite(v.duration) ? v.duration : 0;
  return {
    paused: v.paused,
    ended: v.ended,
    started: v.played.length > 0,
    current: v.currentTime,
    duration,
    buffered: v.buffered.length ? v.buffered.end(v.buffered.length - 1) : 0,
    volume: v.volume,
    muted: v.muted,
    buffering: !v.paused && v.readyState < 3,
    error: !!v.error,
    videoRatio: v.videoWidth && v.videoHeight ? v.videoWidth / v.videoHeight : 0,
  };
}

function sameState(a: MediaState, b: MediaState): boolean {
  return (Object.keys(a) as (keyof MediaState)[]).every((k) => a[k] === b[k]);
}

/**
 * Mirrors the <video> element's state into React. Updates only on media
 * events (timeupdate is ~4/s), plus one read after mount to pick up
 * anything that happened before hydration.
 */
function useMediaState(ref: RefObject<HTMLVideoElement | null>, src: string): MediaState {
  const [state, setState] = useState<MediaState>(INITIAL_STATE);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const sync = () =>
      setState((prev) => {
        const next = readState(v);
        return sameState(prev, next) ? prev : next;
      });
    MEDIA_EVENTS.forEach((type) => v.addEventListener(type, sync));
    const raf = requestAnimationFrame(sync);
    return () => {
      cancelAnimationFrame(raf);
      MEDIA_EVENTS.forEach((type) => v.removeEventListener(type, sync));
    };
  }, [ref, src]);
  return state;
}

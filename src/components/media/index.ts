/**
 * MEDIA — every photo and video on the site goes through these.
 * Import from "@/components/media" (direct file imports work too).
 * Styles: src/styles/media.css.
 *
 * DATA: pass the resolved records from "@/lib/content" — never build
 * paths by hand. `resolveMedia()` / `getWorkMedia(item)` → ResolvedMedia,
 * `entry.cover` / `getStoryImage(moment)` → ResolvedImage. Site paths
 * ("/media/…") are made file-mode safe internally (asset()).
 *
 * A RECORD'S PHOTOS + VIDEOS (detail pages)
 *   <MediaStage media={getWorkMedia(item)} title={item.item.title} />
 *       layout from the data (media.layout: hero | split | mosaic | filmstrip | stack | stage);
 *       force one with layout="filmstrip". Videos are always shown apart from photos,
 *       with their captions. Every photo opens the Lightbox. Renders nothing without media.
 *
 * CARD / HERO COVERS
 *   <MediaCover image={entry.cover} title={entry.title} label={entry.categoryLabel}
 *               aspect="16/10" vtName={`work-${entry.id}`} veil="bottom">…overlay…</MediaCover>
 *       hover zoom + slow crop drift (hover the cover, or any ancestor with `group`
 *       or `data-cover-host`); no image → typographic monogram panel, never a grey box.
 *       vtName = view-transition-name for the card → detail shared-element morph: put the
 *       SAME name on exactly one card cover and on the detail hero (priority on the hero).
 *       Without `aspect` it fills its positioned parent.
 *
 * ONE IMAGE
 *   <ProtectedImage image={img} className="rounded-2xl" />            intrinsic size, no layout shift
 *   <ProtectedImage image={img} fill fit="cover" priority />            fills a positioned parent
 *       lazy + async decode by default; `priority` = eager + fetchpriority high (above the fold only).
 *
 * VIEWER / PLAYER
 *   const [open, setOpen] = useState<number | null>(null);
 *   <Lightbox images={images} index={open} onClose={() => setOpen(null)} onIndexChange={setOpen} title="…" />
 *       modal dialog: focus trap, Esc, ←/→, Home/End, swipe, counter, captions, restores focus,
 *       locks page scroll; loads only the open photo and its neighbours.
 *   <VideoPlayer src="/media/events/x/1.mp4" caption="…" title="…" width={w} height={h} />
 *       custom controls (play/pause, −10/+10 s, seek, volume + mute, time); keys Space/K, J/L,
 *       ←/→, M. No download / speed / PiP / cast. Never autoplays. `protectOnBlur` blacks the
 *       frame out and pauses when the tab/window loses focus; a click resumes. `src` may be a blob: URL.
 *
 * PROTECTION (honest): no save/download UI, no drag-out, no long-press callout, no
 * right-click menu or copy on media, a transparent shield over every image. It deters
 * casual saving; it can't stop screenshots, screen recording or dev tools — never claim it does.
 * `protectHandlers` (plain elements) / `protectMotionHandlers` (motion elements) apply the
 * same to your own media wrappers.
 */

export { ProtectedImage, type ProtectedImageProps } from "./ProtectedImage";
export { MediaCover, type MediaCoverProps } from "./MediaCover";
export { MediaStage, type MediaStageProps } from "./MediaStage";
export { Lightbox, type LightboxProps } from "./Lightbox";
export { VideoPlayer, type VideoPlayerProps } from "./VideoPlayer";
export { protectHandlers, protectMotionHandlers, mediaUrl, aspectOf, fitFor } from "./protection";

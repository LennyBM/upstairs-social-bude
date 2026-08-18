import type { CSSProperties, MouseEventHandler } from 'react';
import { IMAGE_MANIFEST } from '../config/images';
import { site } from '../config/site';

/**
 * The single responsive image element for the estate (spec §10 item 6).
 *
 * Before this, every photograph on all 38 sites was a bare `<img src>`: no
 * `srcset`, no `sizes`, no modern format and no intrinsic dimensions. That is
 * two of the three §16 gates failing at once — the hero was both the LCP
 * element at 339 KB and a CLS contributor — and it was failing identically in
 * every repo, which is why the fix is one component plus one generated
 * manifest rather than a hand edit per call site.
 *
 * WHY `<picture>` AND NOT srcset ALONE
 * `srcset` selects by WIDTH; it cannot express "WebP if you can decode it,
 * JPEG otherwise", because the browser has no way to skip a candidate whose
 * format it does not support. `<picture><source type="image/webp">` is the
 * only markup that does, and it costs no JavaScript and no runtime dependency.
 *
 * WHY `display: contents` ON THE PICTURE
 * `<picture>` is an inline box by default, so wrapping an existing `<img>` in
 * one silently changes layout: `.media-img` is `position:absolute; inset:0`
 * and would keep working, but the Gallery tile's `w-full h-full` resolves
 * against its parent's height and would collapse, and the hero's `<picture>`
 * would become a zero-width flex item in `.hero`'s row. `display:contents`
 * removes the wrapper from the box tree entirely, so the `<img>` lays out as
 * a direct child of whatever contained it before and EVERY existing class,
 * aspect ratio and absolute positioning rule keeps its exact meaning. That is
 * what makes this a drop-in at ten call sites written by four other people.
 * `<picture>` carries no semantics, so removing its box costs nothing to
 * assistive technology.
 *
 * DEGRADES, NEVER BREAKS
 * A filename with no manifest entry renders a plain `<img src="/images/…">` —
 * exactly what the site did before. An unprocessed asset, a repo where the
 * pipeline has not been run yet, or a config typo therefore looks like the
 * old behaviour rather than a blank frame.
 */

const DIR = '/images/';

/** Layout-neutral wrapper. See the note above; this is load bearing. */
const PICTURE: CSSProperties = { display: 'contents' };

export interface ImgProps {
  /**
   * The bare filename as `site.ts` spells it, e.g. `img-00.jpg` — NOT a path.
   * The manifest is keyed by the original name, so config never has to know
   * that variants exist.
   */
  file: string;
  /**
   * Required, including for decorative images, where it is `''`. Making it
   * required rather than optional is what stops a call site quietly dropping
   * an alt during a refactor; `decorative` below is the explicit way to opt
   * out, and it is visible in review.
   */
  alt: string;
  /**
   * The rendered width of this image at each breakpoint. Wrong `sizes` is the
   * one way to make a correct `srcset` useless, so every call site states it
   * rather than inheriting a default.
   */
  sizes: string;
  className?: string;
  style?: CSSProperties;
  /**
   * The LCP candidate, or an image the user is actively waiting on. Sets
   * `fetchPriority="high"` and drops lazy loading. One per route above the
   * fold; the lightbox also qualifies, because it is opened deliberately.
   */
  priority?: boolean;
  /**
   * Backdrop imagery that carries no information — the §8 archetype E media
   * behind a pull quote. Adds `aria-hidden`; `alt` must be `''`.
   */
  decorative?: boolean;
  /** Lands on the `<img>`, not the wrapper, so `stopPropagation` still works. */
  onClick?: MouseEventHandler<HTMLImageElement>;
}

const stem = (file: string) => file.replace(/\.(jpe?g|png)$/i, '');

export function Img({ file, alt, sizes, className, style, priority, decorative, onClick }: ImgProps) {
  const variants = IMAGE_MANIFEST[file];
  const src = DIR + file;

  /* FOCAL POINT RESOLVED HERE, NOT AT THE CALL SITE.
     `.media-img` is `object-fit: cover`, so every one of these images is cropped
     by the box it lands in: a 4:3 rail tile, a 3:2 split panel, a tall hero. With
     no focal the crop is dead centre, which is right only for a centred subject
     and is why heads and shopfronts were being sliced off.
     Four call sites looked focal up themselves and two did not, and the two that
     did not — Gallery and Rooms — are where most of the estate's photographs are
     shown. Doing it in the component that already knows the filename means no
     call site can forget. An explicit `--focal` in `style` still wins, so a
     deliberate override at a call site is unaffected. */
  const declared = site.focal?.[file];
  const withFocal: CSSProperties | undefined =
    declared && !(style && '--focal' in style)
      ? ({ '--focal': declared, ...style } as CSSProperties)
      : style;

  const common = {
    alt,
    className,
    style: withFocal,
    onClick,
    'aria-hidden': decorative || undefined,
    /* An image the browser is told to prioritise must not also be told it may
       be deferred; the two attributes contradict and Chrome honours the lazy. */
    loading: priority ? ('eager' as const) : ('lazy' as const),
    fetchPriority: priority ? ('high' as const) : undefined,
    decoding: priority ? undefined : ('async' as const),
  };

  if (!variants) return <img src={src} sizes={sizes} {...common} />;

  const webp = variants.webp.map((w) => `${DIR}${stem(file)}-${w}.webp ${w}w`).join(', ');
  /* The top JPEG rung is the file named after the original, which is why it is
     appended here rather than listed in the manifest. */
  const jpeg = [
    ...variants.jpeg.map((w) => `${DIR}${stem(file)}-${w}.jpg ${w}w`),
    `${src} ${variants.w}w`,
  ].join(', ');

  return (
    <picture style={PICTURE}>
      <source type="image/webp" srcSet={webp} sizes={sizes} />
      {/* width/height are the intrinsic ratio, not the rendered box: every
          image in this system is sized by CSS. They exist so the box is
          reserved before the bytes arrive (§16: CLS 0.05 or less). */}
      <img src={src} srcSet={jpeg} sizes={sizes} width={variants.w} height={variants.h} {...common} />
    </picture>
  );
}

/* ── sizes vocabulary ─────────────────────────────────────────────────────
 * Named rather than inlined, because the same layout recurs across routes and
 * a `sizes` string that drifts from its layout is invisible until someone
 * profiles the site. Each value is derived from index.css, not estimated:
 * `--container` is 72rem and `--gutter-lg` is 2rem, so the desktop content
 * box is 1088px and the 12 columns are 61.33px on a 32px gutter.
 */

/** Full-bleed media: the hero (archetype A) and the archetype E backdrop. */
export const SIZES_FULL_BLEED = '100vw';

/**
 * Archetype B's media slot: columns 8–12 plus `margin-right: calc(50% - 50vw)`.
 *
 * The percentage in that margin resolves against the GRID AREA, not against
 * the grid container — 434.67px at a 1440 viewport, not 1088px — so the
 * element ends up far wider than the column span suggests and it overhangs
 * the viewport, which `.section-bleed`'s `overflow-x: clip` then hides. The
 * browser still selects `srcset` from the LAID OUT width, not the visible
 * one. Measured in Chrome: 703px at 1024, 937px at 1440, 1177px at 1920 —
 * 68.6 / 65.1 / 61.3vw. 65vw is the value that keeps every one of those on
 * the correct rung.
 *
 * Deriving this from the column arithmetic instead of measuring it gave 45vw,
 * which put a 480px file into a 703px box at 1024. If this rule is ever
 * changed in index.css, re-measure; do not recompute.
 */
export const SIZES_SPLIT_MEDIA = '(min-width: 1024px) 65vw, 100vw';

/**
 * A `.rail` tile (archetype D). `grid-auto-columns` is 78% of the container
 * below 1024px and 32% of the 1088px content box above it, so the desktop
 * width is pinned at ~348px however wide the viewport gets.
 */
export const SIZES_RAIL_TILE = '(min-width: 1024px) 350px, 78vw';

/** The /rooms card grid: 1 column, then 2 from 768px, then 3 from 1024px. */
export const SIZES_CARD_GRID = '(min-width: 1024px) 350px, (min-width: 768px) 45vw, 100vw';

/** The gallery lightbox, capped by `max-w-[90vw]` / `max-h-[85vh]`. */
export const SIZES_LIGHTBOX = '90vw';

import type { CSSProperties } from 'react';
import { site } from '../config/site';
import { Img, SIZES_FULL_BLEED } from './Img';

/** Interior page hero. Same graded media stack as the home hero (spec §10), left aligned. */
export function PageHero({
  title,
  sub,
  image,
  focal,
}: {
  title: string;
  sub?: string;
  image?: string;
  focal?: string;
}) {
  const img = image || site.hero;
  // §10 item 1 precedence: explicit prop → focal[image] → heroFocal when this is the
  // hero image → CSS 50% 50%.
  const imgFocal = focal ?? site.focal?.[img] ?? (img === site.hero ? site.heroFocal : undefined);
  return (
    <section className="media on-dark pt-36 pb-20 md:pt-44 md:pb-24" data-over-media="true">
      {/* The LCP element on the other eight routes: above the fold, full
          bleed, and the only image most of them load before first paint. */}
      <Img
        file={img}
        alt=""
        decorative
        sizes={SIZES_FULL_BLEED}
        className="media-img"
        style={imgFocal ? ({ '--focal': imgFocal } as CSSProperties) : undefined}
        priority
      />
      <div className="media-grade" aria-hidden="true" />
      <div className="media-grain" aria-hidden="true" />
      <div className="media-scrim" aria-hidden="true" />

      <div className="container-x relative">
        <h1 className="t-display">{title}</h1>
        {sub && (
          <p className="eyebrow mt-4" style={{ color: 'var(--text-on-dark-secondary)' }}>
            {sub}
          </p>
        )}
      </div>
    </section>
  );
}

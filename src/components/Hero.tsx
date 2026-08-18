import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { site } from '../config/site';
import { Img, SIZES_FULL_BLEED, SIZES_SPLIT_MEDIA } from './Img';
import { Stars } from './ui';

/** Token references, not literal values. See spec §3 on-dark roles, §7 radii. */
const ON_DARK_SECONDARY: CSSProperties = { color: 'var(--text-on-dark-secondary)' };
const R_MD: CSSProperties = { borderRadius: 'var(--r-md)' };

/**
 * §11 hero archetype. `site.design.hero` selects the composition; it is read
 * here and nowhere else. Before this the value was decorative config that
 * nothing branched on, so a repo set to `split` or `typographic` shipped the
 * anchor hero silently and two venues in the same town got the same page —
 * the exact failure §11 exists to prevent.
 *
 * What varies is the composition. What does NOT vary, in any variant:
 *  · exactly two actions, Book primary (§9.3), full width stacked below 400px;
 *  · one column in DOM order below 1024px (§1.7: the mobile form is declared);
 *  · a dark ground under the whole header band, so the §9.2 `data-over-media`
 *    contract stays true and the dark-ink-on-dark-photo defect cannot return;
 *  · `.t-display` on the h1 and the §3 on-dark text roles.
 */

/**
 * The copy column, identical in all three variants: §11 varies the layout, never
 * the conversion path. Rendered as a fragment so each variant owns its own
 * wrapper element and therefore its own grid placement.
 */
function HeroCopy() {
  // Same booking target resolution as the action bar, so the conversion path is identical.
  const bookTo = site.pages.book ? '/book' : site.pages.rooms ? '/rooms' : '/contact';
  const bookLabel = site.accommodation.has ? 'Book a Room' : 'Book a Table';

  // §9.3: the number is shown in its national form, never the raw +44 E.164 string.
  const phoneDisplay = site.phone.startsWith('+44') ? `0${site.phone.slice(3).trim()}` : site.phone;

  const eyebrow = [site.type, site.established ? `Est. ${site.established}` : null, site.town]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      {eyebrow && (
        <p className="eyebrow" style={ON_DARK_SECONDARY}>
          {eyebrow}
        </p>
      )}

      <h1 className="t-display mt-3">{site.name}</h1>

      <p className="t-lead mt-5" style={ON_DARK_SECONDARY}>
        {site.tagline}
      </p>

      <div className="mt-8 flex flex-col gap-3 min-[400px]:flex-row">
        <Link to={bookTo} className="btn btn-primary btn-block min-[400px]:w-auto">
          {bookLabel}
        </Link>
        <a
          href={site.phoneHref}
          className="btn btn-on-dark btn-block min-[400px]:w-auto flex-col gap-0.5"
          aria-label={`Call ${site.name} on ${phoneDisplay}`}
        >
          <span>Call us</span>
          <span className="t-small nums">{phoneDisplay}</span>
        </a>
      </div>
    </>
  );
}

/** The rating snapshot. Placement differs per archetype, contents do not. */
function HeroRating({ className }: { className?: string }) {
  if (!site.rating) return null;
  return (
    <p className={`flex items-center gap-2 ${className ?? ''}`} style={ON_DARK_SECONDARY}>
      <Stars rating={site.rating} />
      <span className="t-small nums">
        {site.rating} {'·'} {site.reviewsCount}+ reviews
      </span>
    </p>
  );
}

export function Hero({ focal }: { focal?: string }) {
  // §10 item 1 precedence: explicit prop → site.heroFocal → focal[hero] → CSS 50% 50%.
  const heroFocal = focal ?? site.heroFocal ?? site.focal?.[site.hero];
  const focalStyle = heroFocal ? ({ '--focal': heroFocal } as CSSProperties) : undefined;
  const alt = `${site.name}, ${site.town}`;

  /**
   * §10 item 4, the no-photograph route. Venue name at display size on flat
   * --brand-primary with a --line-strong hairline; <FactBar> follows it on the
   * page. This exists because some venues will supply unusable imagery, and a
   * flat brand field beats a bad photo every time. No media stack is mounted at
   * all, so there is no image request and nothing for §14's "text on ungraded
   * media" rule to catch.
   */
  if (site.design.hero === 'typographic') {
    return (
      <section className="hero hero-typographic on-dark">
        <div className="container-x flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <HeroCopy />
          </div>
          <HeroRating className="lg:shrink-0" />
        </div>
      </section>
    );
  }

  /**
   * §8 archetype B applied to the hero: 7/5 asymmetric from 1024px with the
   * media bleeding off the right edge, media above text on mobile. The media is
   * FIRST in the DOM because §8 declares B's mobile form as media first, text
   * below; the desktop composition is produced by grid placement (`.arch-split`
   * pins both slots to row 1), never by `order`, which would desynchronise the
   * focus order from the reading order.
   *
   * The band is --brand-primary, the §3 structural brand colour. That is load
   * bearing, not decoration: on desktop the left half of the fixed header sits
   * over the text column rather than over the photograph, so `--header-fg: #fff`
   * from `data-over-media="true"` needs a dark ground the whole way across.
   *
   * The media keeps the §10 item 2 grade and grain (but not the scrim, which
   * exists to carry overlaid copy and there is none here): the header's nav and
   * phone button sit over the top of this photograph at 1024px and above, so
   * white-on-ungraded-photo is a live contrast case, not a hypothetical one.
   */
  if (site.design.hero === 'split') {
    return (
      <section className="hero hero-split on-dark">
        <div className="container-x grid12 arch-split">
          <div className="arch-media">
            <div className="media aspect-[3/2] lg:aspect-auto lg:h-full" style={R_MD}>
              {/* The LCP element in this variant. `sizes` is the archetype B
                  media slot, which bleeds to the viewport edge from 1024px. */}
              <Img
                file={site.hero}
                alt={alt}
                sizes={SIZES_SPLIT_MEDIA}
                className="media-img"
                style={focalStyle}
                priority
              />
              <div className="media-grade" aria-hidden="true" />
              <div className="media-grain" aria-hidden="true" />
            </div>
          </div>
          <div className="arch-text">
            <HeroCopy />
            <HeroRating className="mt-8" />
          </div>
        </div>
      </section>
    );
  }

  /**
   * Archetype A, the default and the verified baseline (§8 archetype A, §9.3,
   * §10). Full-bleed graded media, text anchored bottom-left, exactly two
   * actions with Book as the primary. Never centred, never a bare black scrim.
   */
  return (
    <section className="hero media on-dark" data-over-media="true">
      {/* The LCP element on the homepage. Full bleed, so `sizes` is 100vw and
          the browser picks the rung that matches the device width. */}
      <Img
        file={site.hero}
        alt={alt}
        sizes={SIZES_FULL_BLEED}
        className="media-img"
        style={focalStyle}
        priority
      />
      <div className="media-grade" aria-hidden="true" />
      <div className="media-grain" aria-hidden="true" />
      <div className="media-scrim" aria-hidden="true" />

      <div className="container-x relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <HeroCopy />
        </div>
        <HeroRating className="lg:shrink-0" />
      </div>
    </section>
  );
}

import type { CSSProperties } from 'react';
import { site } from '../config/site';
import { SEO } from '../components/SEO';
import { SectionHeading, Reveal } from '../components/ui';
import { PageHero } from '../components/PageHero';
import { Img, SIZES_SPLIT_MEDIA } from '../components/Img';
import { useReveal } from '../lib/reveal';

/** Spec §7: --r-full is for circular badges and avatars only. Radius utilities are banned in JSX (§14.1). */
const CIRCLE: CSSProperties = { borderRadius: 'var(--r-full)' };
/** Spec §7: --r-md on media and cards. Radius utilities are banned in JSX (§14.1). */
const R_MD: CSSProperties = { borderRadius: 'var(--r-md)' };

/**
 * Our Story. Archetypes, §8: PageHero (A) · Heritage (C) · Why Visit (B).
 * No two adjacent sections share one, every asymmetric span is scoped to
 * `@media (min-width: 1024px)` in index.css, and both body archetypes resolve
 * to a single column stack below that.
 */
export function Story() {
  useReveal();
  const storyImage = site.images[7] || site.featured[5] || site.hero;
  const focal = site.focal?.[storyImage];

  return (
    <>
      <SEO title={`Our Story | ${site.name}, ${site.town}`}
        description={`The history and heritage of ${site.name} — ${site.tagline}`} path="/our-story" />
      <PageHero title="Our Story" sub={`${site.type} · ${site.town}, ${site.county}`} image={site.featured[4] || site.images[2] || site.hero} />

      {/* Archetype C. Columns 3 to 8 from 1024px; full width at --measure-prose
          below it, left aligned, no media. */}
      <section className="section">
        <div className="container-x grid12 arch-measure">
          <div className="arch-text measure">
            <SectionHeading
              eyebrow="Heritage"
              title={site.established ? `A ${site.town} institution since ${site.established}` : `At the heart of ${site.town}`}
            />
            {/* data-stagger: lib/reveal numbers the direct .reveal children. Spec §1.6. */}
            <div className="mt-8 space-y-5" data-stagger>
              {site.history.map((p, i) => (
                <Reveal key={i}>
                  <p className="t-body">{p}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Archetype B, the 7/5 asymmetry. Media first in the DOM because §8
          declares the mobile form as media first, text below; from 1024px the
          grid places the text in columns 1 to 7 and bleeds the media off the
          right edge, which .section-bleed clips at the section. */}
      <section className="section section-recessed section-bleed">
        <div className="container-x grid12 arch-split items-center">
          <Reveal className="arch-media">
            <div className="media aspect-[3/2] lg:aspect-[16/10]" style={R_MD}>
              <Img
                className="media-img"
                file={storyImage}
                alt={`${site.name}, ${site.town}`}
                sizes={SIZES_SPLIT_MEDIA}
                style={focal ? ({ '--focal': focal } as CSSProperties) : undefined}
              />
            </div>
          </Reveal>
          <div className="arch-text">
            <SectionHeading eyebrow="Why Visit" title="What Makes Us Special" />
            <div className="grid gap-5 sm:grid-cols-2 mt-10" data-stagger>
              {site.usps.map((u, i) => (
                <Reveal key={i}>
                  <div className="card p-6 h-full">
                    <div className="w-10 h-10 bg-primary/10 flex items-center justify-center mb-4" style={CIRCLE}>
                      <span className="t-h4 nums text-primary">{i + 1}</span>
                    </div>
                    <p className="t-body">{u}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

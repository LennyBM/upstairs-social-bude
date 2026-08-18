import { Fragment } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { site } from '../config/site';
import type { HomeOrder } from '../config/types.ts';
import { SEO } from '../components/SEO';
import { Hero } from '../components/Hero';
import { Reviews } from '../components/Reviews';
import { Gallery } from '../components/Gallery';
import { Img, SIZES_RAIL_TILE, SIZES_SPLIT_MEDIA } from '../components/Img';
import { FactBar, OpeningHours, MapEmbed, PolicyGrid } from '../components/InfoBlocks';
import { SectionHeading, Reveal } from '../components/ui';
import { useReveal } from '../lib/reveal';

/** Spec §7: --r-md on media and cards. Radius utilities are banned in JSX (§14.1). */
const R_MD: CSSProperties = { borderRadius: 'var(--r-md)' };
/** Spec §2.2: emphasis in body is Inter 600, never slanted. */
const EMPHASIS: CSSProperties = { fontWeight: 600 };
/** The UA stylesheet slants <address>; §14.3 allows font-style slant only on .pullquote and .logotype. */
const NOT_ITALIC: CSSProperties = { fontStyle: 'normal' };

/** The homepage sections §11 may reorder. Hero is excluded: it always leads. */
type SectionKey = 'facts' | 'rooms' | 'story' | 'reviews' | 'eats' | 'gallery' | 'policy' | 'find';

/** §10 item 1 precedence for a room card: room.focal → focal[image] → CSS 50% 50%. */
function focalStyle(image?: string, explicit?: string): CSSProperties | undefined {
  const f = explicit ?? (image ? site.focal?.[image] : undefined);
  return f ? ({ '--focal': f } as CSSProperties) : undefined;
}

/**
 * §11 homepage sequences. `site.design.order` selects one; it is read here and
 * nowhere else. Hero (A) and FactBar always lead, because the fact strip is what
 * puts opening hours inside the first 900px on mobile, and that is a conversion
 * requirement rather than a compositional one.
 *
 * Archetype letters, for the §8 adjacency rule:
 *   rooms D · story C · reviews E · eats B · gallery D · find C
 * `facts` and `policy` are unlettered: both are data strips, so neither claims a
 * letter nor can collide.
 *
 *   rooms-led    A · D · C · E · B · D · C   leads with what a stay costs
 *   food-led     A · B · D · C · E · D · C   leads with the kitchen
 *   locals-led   A · E · B · D · C · D · C   leads with social proof
 *
 * Every sequence holds §8: no two adjacent sections share a letter, and five
 * distinct archetypes are in play against a floor of three. Because rooms, eats
 * and gallery are all conditional on capability flags, adjacency has to hold for
 * the *realised* sequence too, not just the declared one — `scripts/check-estate.mjs`
 * proves that for all 38 configs against their own flags.
 */
const SEQUENCES: Record<HomeOrder, SectionKey[]> = {
  'rooms-led': ['facts', 'rooms', 'story', 'reviews', 'eats', 'gallery', 'policy', 'find'],
  'food-led': ['facts', 'eats', 'rooms', 'story', 'reviews', 'gallery', 'policy', 'find'],
  'locals-led': ['facts', 'reviews', 'eats', 'gallery', 'story', 'rooms', 'policy', 'find'],
};

/**
 * Homepage. Section bodies are built once, then emitted in the order §11 assigns
 * to this venue. Conditional sections resolve to null and drop out of the
 * sequence; §8 adjacency is verified against that realised sequence by the
 * estate checker, not assumed here.
 *
 * §8 rules held in every sequence:
 *  - no two adjacent sections share an archetype;
 *  - five distinct archetypes are in play, against a floor of three;
 *  - every asymmetric span lives in `@media (min-width: 1024px)` in index.css.
 *    Each archetype's mobile form is a single column stack in DOM order, which
 *    is why archetype B puts its media first in the markup: §8 declares media
 *    first, text below, and desktop reorders it by grid placement, not by DOM.
 *  - nothing is centred at section level; every section is left aligned.
 */
export function Home() {
  useReveal();

  const rooms = site.accommodation.rooms || [];
  const showRooms = site.accommodation.has && rooms.length > 0;

  /* Archetype B content. Falls back to the bar when a venue serves no food, so   */
  /* the section is not silently dropped from a drinks-led site's only asymmetry. */
  const eats =
    site.pages.food && site.food.serves
      ? {
          eyebrow: 'On the Menu',
          title: 'Food & Drink',
          desc: site.food.summary || 'Freshly prepared dishes and well-kept local ales.',
          cta: 'See the Menu',
        }
      : site.pages.food && site.drinks
        ? {
            eyebrow: 'At the Bar',
            title: 'Drinks & Ales',
            desc: site.drinks,
            cta: 'More at the Bar',
          }
        : null;

  const eatsImage = site.featured[5] || site.featured[2] || site.hero;
  const showGallery = site.pages.gallery && site.images.length > 3;

  /* Each section is built once here and emitted below in the order §11 assigns.  */
  /* A section whose capability flag is off resolves to null and drops out.        */
  const blocks: Record<SectionKey, ReactNode> = {
    /* FactBar — §9.4. Carries <StatusNow>, so opening hours land inside the
       first 900px on mobile. Not an archetype; it is the fact strip. */
    facts: <FactBar />,

    /* Rooms — archetype D. §8: the rail is the answer to a long list on
       mobile, and it is the same rail on desktop, scroll snapped. */
    rooms: showRooms && (
      <section className="section">
          <div className="container-x">
            <SectionHeading eyebrow="Stay With Us" title={`Rooms at ${site.shortName}`} />
            {/* data-stagger: lib/reveal numbers the direct .reveal children. Spec §1.6. */}
            <div className="rail mt-10" data-stagger>
              {rooms.map((r, i) => (
                <Reveal key={r.name + i}>
                  <Link to="/rooms" className="card block h-full">
                    <div className="media aspect-[4/3]">
                      <Img
                        className="media-img"
                        file={r.image || site.images[(i + 4) % site.images.length] || site.hero}
                        alt={r.name}
                        sizes={SIZES_RAIL_TILE}
                        style={focalStyle(r.image, r.focal)}
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="t-h4">{r.name}</h3>
                      <p className="t-small text-secondary mt-2">{r.desc}</p>
                      {r.price && (
                        <p className="t-small nums text-primary mt-3" style={EMPHASIS}>
                          {r.price}
                        </p>
                      )}
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
            <Link to="/rooms" className="btn btn-outline mt-8">
              All Rooms &amp; Rates
            </Link>
          </div>
      </section>
    ),

    /* Story — archetype C. Text in columns 3 to 8 from 1024px; full width
       at --measure-prose below it. No media, by definition. */
    story: (
      <section className="section section-recessed">
        <div className="container-x grid12 arch-measure">
          <div className="arch-text measure">
            <SectionHeading eyebrow="Welcome" title={site.tagline} />
            <div className="mt-8 space-y-5" data-stagger>
              {site.history.slice(0, 2).map((p, i) => (
                <Reveal key={i}>
                  <p className="t-body">{p}</p>
                </Reveal>
              ))}
            </div>
            <Link to="/our-story" className="btn btn-outline mt-8">
              Our Story
            </Link>
          </div>
        </div>
      </section>
    ),

    /* Reviews — archetype E. Full bleed graded media, one pull quote. */
    reviews: <Reviews variant="quote" />,

    /* Food — archetype B, the 7/5 asymmetry. Media is first in the DOM
       because §8 declares the mobile form as media 3:2 first, text below;
       from 1024px the grid places the text in columns 1 to 7 and bleeds the
       media off the right edge. .section-bleed clips that bleed at the
       section so it can never become a horizontal scrollbar. */
    eats: eats && (
        <section className="section section-bleed">
          <div className="container-x grid12 arch-split items-center">
            <Reveal className="arch-media">
              <div className="media aspect-[3/2] lg:aspect-[16/9]" style={R_MD}>
                <Img
                  className="media-img"
                  file={eatsImage}
                  alt={`${eats.title} at ${site.name}`}
                  sizes={SIZES_SPLIT_MEDIA}
                  style={focalStyle(eatsImage)}
                />
              </div>
            </Reveal>
            <Reveal className="arch-text">
              <p className="eyebrow">{eats.eyebrow}</p>
              <h2 className="t-h2 mt-3">{eats.title}</h2>
              <p className="t-body measure mt-5">{eats.desc}</p>
              <Link to="/food-drink" className="btn btn-outline mt-8">
                {eats.cta}
              </Link>
            </Reveal>
          </div>
      </section>
    ),

    /* Gallery — archetype D. Never placed adjacent to the rooms rail in any
       sequence; the estate checker proves that against each venue's own flags. */
    gallery: showGallery && (
      <section className="section section-recessed">
        <div className="container-x">
          <SectionHeading eyebrow="Gallery" title="A Glimpse Inside" />
          <div className="mt-10">
            <Gallery max={8} />
          </div>
          <div className="mt-8">
            <Link to="/gallery" className="btn btn-outline">
              View Full Gallery
            </Link>
          </div>
        </div>
      </section>
    ),

    /* Good to know — <PolicyGrid>, §9.4, which places it on Contact and Home.
       Not an archetype, the same way the fact bar is not: it is a data grid, so
       it neither claims a letter nor breaks the §8 adjacency rule. It sits at
       full container width rather than inside the measured Find us column,
       which is the only way its three-column desktop form has room to exist.
       No §11 sequence gives it a slot of its own; every sequence hangs it off
       the practical end of the page, immediately before Find us. */
    policy: (
      <section className="section section-rule">
        <div className="container-x">
          <SectionHeading eyebrow="Good to Know" title="Before You Arrive" />
          <Reveal className="mt-8 no-anim">
            <PolicyGrid />
          </Reveal>
        </div>
      </section>
    ),

    /* Find us — archetype C. Keeps the address, the hours and the two actions
       in one measured column at every width, and closes every sequence. */
    find: (
      <section className="section">
        <div className="container-x grid12 arch-measure">
          {/* §1.6: opening hours, phone numbers and CTAs must never animate. */}
          <Reveal className="arch-text measure no-anim">
            <p className="eyebrow">Find Us</p>
            <h2 className="t-h2 mt-3">Pop In &amp; Say Hello</h2>
            <address className="t-body mt-5" style={NOT_ITALIC}>
              {site.addressLines.join(', ')}
              <br />
              {site.town}, {site.county} {site.postcode}
            </address>
            <div className="mt-6">
              <OpeningHours />
            </div>
            <div className="flex flex-wrap gap-3 mt-7">
              <a href={site.phoneHref} className="btn btn-primary">
                Call {site.phone}
              </a>
              <a href={site.mapsLink} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                Get Directions
              </a>
            </div>
            <div className="mt-8">
              <MapEmbed />
            </div>
          </Reveal>
        </div>
      </section>
    ),
  };

  return (
    <>
      <SEO title={`${site.name} | ${site.type} in ${site.town}, ${site.county}`} description={site.intro} />

      {/* Hero — archetype A by default; §11 selects the composition per venue. */}
      <Hero />

      {SEQUENCES[site.design.order].map((key) => (
        <Fragment key={key}>{blocks[key]}</Fragment>
      ))}
    </>
  );
}

import type { CSSProperties } from 'react';
import { site } from '../config/site';
import { SEO } from '../components/SEO';
import { PageHero } from '../components/PageHero';
import { Img, SIZES_CARD_GRID } from '../components/Img';
import { SectionHeading, Reveal } from '../components/ui';
import { useReveal } from '../lib/reveal';

/** Spec §2.2: emphasis in body is Inter 600, never slanted. */
const EMPHASIS: CSSProperties = { fontWeight: 600 };
/** Spec §3: the only on-dark sub-copy role. */
const ON_DARK_SECONDARY: CSSProperties = { color: 'var(--text-on-dark-secondary)' };

export function Rooms() {
  useReveal();
  const rooms = site.accommodation.rooms || [];
  return (
    <>
      <SEO title={`Rooms & Stays | ${site.name}, ${site.town}`}
        description={site.accommodation.summary || `Stay at ${site.name} in ${site.town}, ${site.county}.`} path="/rooms" />
      <PageHero title="Stay With Us" sub={`${site.town}, ${site.county}`} image={site.featured[3] || site.images[3] || site.hero} />

      <section className="section">
        <div className="container-x">
          <SectionHeading eyebrow="Accommodation" title="Rest, Relax & Explore" sub={site.accommodation.summary} />
        </div>
      </section>

      {rooms.length > 0 && (
        <section className="section section-recessed pt-0">
          {/* data-stagger: lib/reveal numbers the direct .reveal children. Spec §1.6. */}
          <div className="container-x grid gap-8 md:grid-cols-2 lg:grid-cols-3" data-stagger>
            {rooms.map((r, i) => (
              <Reveal key={i}>
                <div className="card h-full flex flex-col">
                  <div className="aspect-[4/3] overflow-hidden">
                    <Img file={r.image || site.images[(i + 4) % site.images.length] || site.hero} alt={r.name}
                      sizes={SIZES_CARD_GRID} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="t-h4">{r.name}</h3>
                    <p className="t-small text-secondary flex-1 mt-2">{r.desc}</p>
                    {r.price && <p className="t-body nums text-primary mt-4" style={EMPHASIS}>{r.price}</p>}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="section bg-primary on-dark">
        <div className="container-x">
          <h2 className="t-h2">Book Your Stay</h2>
          <p className="t-body measure mt-4" style={ON_DARK_SECONDARY}>Call us direct for the best rates and to check availability.</p>
          <a href={site.phoneHref} className="btn btn-on-dark mt-7">Call {site.phone}</a>
        </div>
      </section>
    </>
  );
}

import type { CSSProperties } from 'react';
import { site } from '../config/site';
import { SEO } from '../components/SEO';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/ui';
import { useReveal } from '../lib/reveal';

/** Spec §2.2: emphasis in body is Inter 600, never slanted. */
const EMPHASIS: CSSProperties = { fontWeight: 600 };
/** Spec §3: the only on-dark sub-copy role. */
const ON_DARK_SECONDARY: CSSProperties = { color: 'var(--text-on-dark-secondary)' };

export function SundayLunch() {
  useReveal();
  const sl = site.sundayLunch;
  const bookHref = site.pages.book ? '/book' : site.phoneHref;
  return (
    <>
      <SEO title={`Sunday Lunch | ${site.name}, ${site.town}`}
        description={sl?.summary || `Traditional Sunday lunch at ${site.name} in ${site.town}. Booking recommended — call ${site.phone}.`} path="/sunday-lunch" />
      <PageHero title="Sunday Lunch" sub={`${site.town}, ${site.county}`} image={site.featured[2] || site.images[2] || site.hero} />

      <section className="section">
        <div className="container-x">
          <Reveal>
            <p className="eyebrow mb-3">A Sunday Tradition</p>
            <h2 className="t-h2">Roast Lunch at {site.shortName}</h2>
            <p className="t-lead mt-6">{sl?.summary || `Join us every Sunday for a proper roast — generous plates, all the trimmings, and a warm welcome.`}</p>
            {sl?.priceFrom && <p className="t-h4 nums text-primary mt-4">{sl.priceFrom}</p>}
          </Reveal>
        </div>
      </section>

      {sl?.items && sl.items.length > 0 && (
        <section className="section section-recessed">
          <div className="container-x max-w-3xl">
            <Reveal>
              <div className="mb-8">
                <h3 className="t-h3">On the Sunday Menu</h3>
              </div>
            </Reveal>
            <div className="space-y-1">
              {sl.items.map((it, i) => (
                <Reveal key={i}>
                  <div className="flex items-baseline gap-3 py-3 border-b border-line">
                    <div className="flex-1">
                      <span className="t-body" style={EMPHASIS}>{it.name}</span>
                      {it.desc && <span className="block t-small text-secondary">{it.desc}</span>}
                    </div>
                    {it.price && <span className="t-body nums text-primary whitespace-nowrap" style={EMPHASIS}>{it.price}</span>}
                  </div>
                </Reveal>
              ))}
            </div>
            <p className="t-caption text-muted measure mt-8">Sunday menu is a sample and subject to change. Please ask about dietary requirements.</p>
          </div>
        </section>
      )}

      <section className="section bg-primary on-dark">
        <div className="container-x">
          <h2 className="t-h2">Book Your Table</h2>
          <p className="t-body measure mt-4" style={ON_DARK_SECONDARY}>Sundays are our busiest day — we strongly recommend booking ahead.</p>
          <a href={bookHref} className="btn btn-on-dark mt-7">
            {site.pages.book ? 'Reserve a Table' : `Call ${site.phone}`}
          </a>
        </div>
      </section>
    </>
  );
}

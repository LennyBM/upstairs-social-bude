import { site } from '../config/site';
import { SEO } from '../components/SEO';
import { PageHero } from '../components/PageHero';
import { SectionHeading, Reveal } from '../components/ui';
import { useReveal } from '../lib/reveal';

export function Rooms() {
  useReveal();
  const clean = (s?: string) => (s || '').replace(/^\[DRAFT\]\s*/, '');
  const rooms = site.accommodation.rooms || [];
  return (
    <>
      <SEO title={`Rooms & Stays | ${site.name}, ${site.town}`}
        description={clean(site.accommodation.summary) || `Stay at ${site.name} in ${site.town}, ${site.county}.`} path="/rooms" />
      <PageHero title="Stay With Us" sub={`${site.town}, ${site.county}`} image={site.featured[3] || site.images[3] || site.hero} />

      <section className="section">
        <div className="container-x max-w-3xl text-center">
          <SectionHeading eyebrow="Accommodation" title="Rest, Relax & Explore" sub={clean(site.accommodation.summary)} />
        </div>
      </section>

      {rooms.length > 0 && (
        <section className="section bg-surface pt-0">
          <div className="container-x grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((r, i) => (
              <Reveal key={i}>
                <div className="card h-full flex flex-col" style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
                  <div className="aspect-[4/3] overflow-hidden bg-surface">
                    <img src={`/images/${r.image || site.images[(i + 4) % site.images.length] || site.hero}`} alt={r.name}
                      loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-headline text-2xl text-ink">{clean(r.name)}</h3>
                    <p className="mt-2 text-sm text-muted leading-relaxed flex-1">{clean(r.desc)}</p>
                    {r.price && <p className="mt-4 font-semibold text-primary">{r.price}</p>}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="section bg-primary text-contrast text-center">
        <div className="container-x">
          <h2 className="h-section text-contrast">Book Your Stay</h2>
          <p className="mt-4 max-w-xl mx-auto opacity-90">Call us direct for the best rates and to check availability.</p>
          <a href={site.phoneHref} className="btn mt-7" style={{ background: '#fff', color: 'var(--brand-primary)' }}>Call {site.phone}</a>
        </div>
      </section>
    </>
  );
}

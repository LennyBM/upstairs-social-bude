import { site } from '../config/site';
import { SEO } from '../components/SEO';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/ui';
import { useReveal } from '../lib/reveal';

export function SundayLunch() {
  useReveal();
  const clean = (s?: string) => (s || '').replace(/^\[DRAFT\]\s*/, '');
  const sl = site.sundayLunch;
  const bookHref = site.pages.book ? '/book' : site.phoneHref;
  return (
    <>
      <SEO title={`Sunday Lunch | ${site.name}, ${site.town}`}
        description={clean(sl?.summary) || `Traditional Sunday lunch at ${site.name} in ${site.town}. Booking recommended — call ${site.phone}.`} path="/sunday-lunch" />
      <PageHero title="Sunday Lunch" sub={`${site.town}, ${site.county}`} image={site.featured[2] || site.images[2] || site.hero} />

      <section className="section">
        <div className="container-x max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow mb-3">A Sunday Tradition</p>
            <h2 className="h-section text-ink">Roast Lunch at {site.shortName}</h2>
            <hr className="rule mt-5 mx-auto" />
            <p className="lead mt-6">{clean(sl?.summary) || `Join us every Sunday for a proper roast — generous plates, all the trimmings, and a warm welcome.`}</p>
            {sl?.priceFrom && <p className="mt-4 font-headline italic text-2xl text-primary">{clean(sl.priceFrom)}</p>}
          </Reveal>
        </div>
      </section>

      {sl?.items && sl.items.length > 0 && (
        <section className="section bg-surface">
          <div className="container-x max-w-3xl">
            <Reveal>
              <div className="text-center mb-8">
                <h3 className="font-headline italic text-3xl text-ink">On the Sunday Menu</h3>
                <hr className="rule mt-4 mx-auto" />
              </div>
            </Reveal>
            <div className="space-y-1">
              {sl.items.map((it, i) => (
                <Reveal key={i}>
                  <div className="flex items-baseline gap-3 py-3 border-b border-line">
                    <div className="flex-1">
                      <span className="font-semibold text-ink">{clean(it.name)}</span>
                      {it.desc && <span className="block text-sm text-muted">{clean(it.desc)}</span>}
                    </div>
                    {it.price && <span className="font-headline italic text-lg text-primary whitespace-nowrap">{clean(it.price)}</span>}
                  </div>
                </Reveal>
              ))}
            </div>
            <p className="text-center text-xs text-muted mt-8">Sunday menu is a sample and subject to change. Please ask about dietary requirements.</p>
          </div>
        </section>
      )}

      <section className="section bg-primary text-contrast text-center">
        <div className="container-x">
          <h2 className="h-section text-contrast">Book Your Table</h2>
          <p className="mt-4 max-w-xl mx-auto opacity-90">Sundays are our busiest day — we strongly recommend booking ahead.</p>
          <a href={bookHref} className="btn mt-7" style={{ background: '#fff', color: 'var(--brand-primary)' }}>
            {site.pages.book ? 'Reserve a Table' : `Call ${site.phone}`}
          </a>
        </div>
      </section>
    </>
  );
}

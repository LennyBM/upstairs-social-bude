import { site } from '../config/site';
import { SEO } from '../components/SEO';
import { PageHero } from '../components/PageHero';
import { SectionHeading, Reveal } from '../components/ui';
import { useReveal } from '../lib/reveal';

export function FoodDrink() {
  useReveal();
  const clean = (s?: string) => (s || '').replace(/^\[DRAFT\]\s*/, '');
  return (
    <>
      <SEO title={`${site.food.serves ? 'Food & Drink' : 'Drinks'} | ${site.name}, ${site.town}`}
        description={clean(site.food.summary) || clean(site.drinks) || `Great ${site.food.serves ? 'food and drink' : 'drinks and atmosphere'} at ${site.name} in ${site.town}.`} path="/food-drink" />
      <PageHero title={site.food.serves ? 'Food & Drink' : 'Drinks & Atmosphere'} sub={`${site.town}, ${site.county}`} image={site.featured[1] || site.images[1] || site.hero} />

      <section className="section">
        <div className="container-x max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow mb-3">{site.food.serves ? 'From Our Kitchen' : 'At the Bar'}</p>
            <h2 className="h-section text-ink">{site.food.serves ? 'Honest, Freshly-Prepared Food' : 'A Proper Local Welcome'}</h2>
            <hr className="rule mt-5 mx-auto" />
            <p className="lead mt-6">{clean(site.food.summary) || clean(site.drinks) || (site.food.serves
              ? 'Freshly-prepared dishes made with care, alongside well-kept local ales.'
              : `A genuine, drinks-led local in ${site.town} — well-kept ales, a friendly bar and a proper welcome.`)}</p>
          </Reveal>
        </div>
      </section>

      {site.food.menus && site.food.menus.length > 0 && (
        <section className="section bg-surface">
          <div className="container-x max-w-4xl">
            {site.food.menus.map((group) => (
              <div key={group.title} className="mb-14 last:mb-0">
                <Reveal>
                  <div className="text-center mb-8">
                    <h3 className="font-headline text-3xl text-ink">{group.title}</h3>
                    {group.note && <p className="text-sm text-muted mt-2">{clean(group.note)}</p>}
                    <hr className="rule mt-4 mx-auto" />
                  </div>
                </Reveal>
                <div className="space-y-1">
                  {group.items.map((it, i) => (
                    <Reveal key={i}>
                      <div className="flex items-baseline gap-3 py-3 border-b border-line">
                        <div className="flex-1">
                          <span className="font-semibold text-ink">{clean(it.name)}</span>
                          {it.desc && <span className="block text-sm text-muted">{clean(it.desc)}</span>}
                        </div>
                        {it.price && <span className="font-headline text-lg text-primary whitespace-nowrap">{it.price}</span>}
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-center text-xs text-muted mt-8">Menus are a sample and subject to change. Please ask about daily specials and dietary requirements.</p>
          </div>
        </section>
      )}

      {site.drinks && (
        <section className={`section${site.food.serves ? '' : ' bg-surface'}`}>
          <div className="container-x max-w-3xl text-center">
            <SectionHeading eyebrow="At the Bar" title="What's on Tap" sub={clean(site.drinks)} />
          </div>
        </section>
      )}

      {/* For wet-led pubs with no menu, fill the page with what to expect */}
      {!site.food.serves && site.usps && site.usps.length > 0 && (
        <section className="section">
          <div className="container-x max-w-5xl">
            <SectionHeading eyebrow="Why Pop In" title="What to Expect" />
            <div className="grid gap-5 sm:grid-cols-2 mt-10">
              {site.usps.slice(0, 6).map((u, i) => (
                <Reveal key={i}>
                  <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-5">
                    <span className="mt-1 text-primary">✦</span>
                    <span className="text-ink/85">{clean(u)}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section bg-primary text-contrast text-center">
        <div className="container-x">
          <h2 className="h-section text-contrast">{site.food.serves ? 'Book a Table' : 'Plan Your Visit'}</h2>
          <p className="mt-4 max-w-xl mx-auto opacity-90">
            {site.food.serves
              ? 'Tables fill up fast at weekends — give us a call to reserve your spot.'
              : `We'd love to see you — pop in, or give us a call with any questions.`}
          </p>
          <a href={site.pages.book ? '/book' : site.phoneHref} className="btn mt-7" style={{ background: '#fff', color: 'var(--brand-primary)' }}>
            {site.pages.book ? 'Book Now' : `Call ${site.phone}`}
          </a>
        </div>
      </section>
    </>
  );
}

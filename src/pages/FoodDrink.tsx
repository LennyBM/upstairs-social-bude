import type { CSSProperties } from 'react';
import { site } from '../config/site';
import { SEO } from '../components/SEO';
import { PageHero } from '../components/PageHero';
import { SectionHeading, Reveal } from '../components/ui';
import { useReveal } from '../lib/reveal';

/** Spec §2.2: emphasis in body is Inter 600, never slanted. Weight utilities are banned in JSX (§14.1). */
const EMPHASIS: CSSProperties = { fontWeight: 600 };
/** Spec §3: the only on-dark sub-copy role. */
const ON_DARK_SECONDARY: CSSProperties = { color: 'var(--text-on-dark-secondary)' };

export function FoodDrink() {
  useReveal();
  return (
    <>
      <SEO title={`${site.food.serves ? 'Food & Drink' : 'Drinks'} | ${site.name}, ${site.town}`}
        description={site.food.summary || site.drinks || `Great ${site.food.serves ? 'food and drink' : 'drinks and atmosphere'} at ${site.name} in ${site.town}.`} path="/food-drink" />
      <PageHero title={site.food.serves ? 'Food & Drink' : 'Drinks & Atmosphere'} sub={`${site.town}, ${site.county}`} image={site.featured[1] || site.images[1] || site.hero} />

      <section className="section">
        <div className="container-x">
          <Reveal>
            <p className="eyebrow mb-3">{site.food.serves ? 'From Our Kitchen' : 'At the Bar'}</p>
            <h2 className="t-h2">{site.food.serves ? 'Honest, Freshly-Prepared Food' : 'A Proper Local Welcome'}</h2>
            <p className="t-lead mt-6">{site.food.summary || site.drinks || (site.food.serves
              ? 'Freshly-prepared dishes made with care, alongside well-kept local ales.'
              : `A genuine, drinks-led local in ${site.town} — well-kept ales, a friendly bar and a proper welcome.`)}</p>
          </Reveal>
        </div>
      </section>

      {site.food.menus && site.food.menus.length > 0 && (
        <section className="section section-recessed">
          <div className="container-x max-w-4xl">
            {site.food.menus.map((group) => (
              <div key={group.title} className="mb-14 last:mb-0">
                <Reveal>
                  <div className="mb-8">
                    <h3 className="t-h3">{group.title}</h3>
                    {group.note && <p className="t-small text-secondary measure mt-2">{group.note}</p>}
                  </div>
                </Reveal>
                <div className="space-y-1">
                  {group.items.map((it, i) => (
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
              </div>
            ))}
            <p className="t-caption text-muted measure mt-8">Menus are a sample and subject to change. Please ask about daily specials and dietary requirements.</p>
          </div>
        </section>
      )}

      {site.drinks && (
        <section className={`section${site.food.serves ? '' : ' section-recessed'}`}>
          <div className="container-x">
            <SectionHeading eyebrow="At the Bar" title="What's on Tap" sub={site.drinks} />
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
                  <div className="card flex items-start gap-3 p-5">
                    <span className="text-primary mt-1">✦</span>
                    <span className="t-body">{u}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section bg-primary on-dark">
        <div className="container-x">
          <h2 className="t-h2">{site.food.serves ? 'Book a Table' : 'Plan Your Visit'}</h2>
          <p className="t-body measure mt-4" style={ON_DARK_SECONDARY}>
            {site.food.serves
              ? 'Tables fill up fast at weekends — give us a call to reserve your spot.'
              : `We'd love to see you — pop in, or give us a call with any questions.`}
          </p>
          <a href={site.pages.book ? '/book' : site.phoneHref} className="btn btn-on-dark mt-7">
            {site.pages.book ? 'Book Now' : `Call ${site.phone}`}
          </a>
        </div>
      </section>
    </>
  );
}

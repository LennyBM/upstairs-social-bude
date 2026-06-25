import { site } from '../config/site';
import { SEO } from '../components/SEO';
import { PageHero } from '../components/PageHero';
import { OpeningHours } from '../components/InfoBlocks';
import { Reveal } from '../components/ui';
import { useReveal } from '../lib/reveal';

export function Book() {
  useReveal();
  const clean = (s?: string) => (s || '').replace(/^\[DRAFT\]\s*/, '');
  const b = site.booking;
  const online = b?.url && /^https?:\/\//.test(b.url) ? b.url : '';
  const stay = site.accommodation.has;
  return (
    <>
      <SEO title={`Book | ${site.name}, ${site.town}`}
        description={`Book ${stay ? 'a room or table' : 'a table'} at ${site.name} in ${site.town}, ${site.county}. Call ${site.phone} or book online.`} path="/book" />
      <PageHero title="Book With Us" sub={`${site.town}, ${site.county}`} image={site.featured[0] || site.hero} />

      <section className="section">
        <div className="container-x max-w-3xl">
          <Reveal>
            <div className="text-center">
              <p className="eyebrow mb-3">Reservations</p>
              <h2 className="h-section text-ink">{stay ? 'Reserve a Room or Table' : 'Reserve Your Table'}</h2>
              <hr className="rule mt-5 mx-auto" />
              <p className="lead mt-6">
                {clean(site.accommodation.summary) || clean(site.food.summary) ||
                  `We can't wait to welcome you to ${site.shortName}. Book online or give us a call and we'll take care of the rest.`}
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid sm:grid-cols-2 gap-5">
            {online && (
              <Reveal>
                <a href={online} target="_blank" rel="noopener noreferrer"
                  className="block rounded-xl border border-line bg-surface p-7 text-center hover:shadow-lg transition">
                  <div className="font-headline italic text-2xl text-ink">Book Online</div>
                  <p className="text-sm text-muted mt-2">Check live availability and reserve instantly{b?.platform ? ` via ${clean(b.platform)}` : ''}.</p>
                  <span className="btn mt-5 inline-block">Start Booking →</span>
                </a>
              </Reveal>
            )}
            <Reveal>
              <a href={site.phoneHref}
                className="block rounded-xl border border-line bg-surface p-7 text-center hover:shadow-lg transition">
                <div className="font-headline italic text-2xl text-ink">Call Us</div>
                <p className="text-sm text-muted mt-2">Prefer to talk it through? We're happy to help.</p>
                <span className="btn btn-outline mt-5 inline-block">{site.phone}</span>
              </a>
            </Reveal>
            {site.email && (
              <Reveal>
                <a href={`mailto:${site.email}`}
                  className="block rounded-xl border border-line bg-surface p-7 text-center hover:shadow-lg transition">
                  <div className="font-headline italic text-2xl text-ink">Email</div>
                  <p className="text-sm text-muted mt-2">Send us your dates or party size and we'll come back to you.</p>
                  <span className="btn btn-outline mt-5 inline-block break-all">{site.email}</span>
                </a>
              </Reveal>
            )}
            {site.whatsapp && (
              <Reveal>
                <a href={`https://wa.me/${site.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="block rounded-xl border border-line bg-surface p-7 text-center hover:shadow-lg transition">
                  <div className="font-headline italic text-2xl text-ink">WhatsApp</div>
                  <p className="text-sm text-muted mt-2">Message us directly on WhatsApp.</p>
                  <span className="btn btn-outline mt-5 inline-block">Chat on WhatsApp</span>
                </a>
              </Reveal>
            )}
          </div>

          <div className="mt-12 max-w-md mx-auto"><OpeningHours /></div>
        </div>
      </section>
    </>
  );
}

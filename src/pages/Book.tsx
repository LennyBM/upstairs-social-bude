import { site } from '../config/site';
import { SEO } from '../components/SEO';
import { PageHero } from '../components/PageHero';
import { OpeningHours } from '../components/InfoBlocks';
import { Reveal } from '../components/ui';
import { useReveal } from '../lib/reveal';

export function Book() {
  useReveal();
  const b = site.booking;
  const online = b?.url && /^https?:\/\//.test(b.url) ? b.url : '';
  const stay = site.accommodation.has;
  return (
    <>
      <SEO title={`Book | ${site.name}, ${site.town}`}
        description={`Book ${stay ? 'a room or table' : 'a table'} at ${site.name} in ${site.town}, ${site.county}. Call ${site.phone} or book online.`} path="/book" />
      <PageHero title="Book With Us" sub={`${site.town}, ${site.county}`} image={site.featured[0] || site.hero} />

      <section className="section">
        <div className="container-x">
          <Reveal>
            <p className="eyebrow mb-3">Reservations</p>
            <h2 className="t-h2">{stay ? 'Reserve a Room or Table' : 'Reserve Your Table'}</h2>
            <p className="t-lead mt-6">
              {site.accommodation.summary || site.food.summary ||
                `We can't wait to welcome you to ${site.shortName}. Book online or give us a call and we'll take care of the rest.`}
            </p>
          </Reveal>

          <div className="mt-10 grid sm:grid-cols-2 gap-5">
            {online && (
              <Reveal>
                <a href={online} target="_blank" rel="noopener noreferrer"
                  className="card block p-7 text-center">
                  <div className="t-h4">Book Online</div>
                  <p className="t-small text-secondary mt-2">Check live availability and reserve instantly{b?.platform ? ` via ${b.platform}` : ''}.</p>
                  <span className="btn mt-5">Start Booking →</span>
                </a>
              </Reveal>
            )}
            <Reveal>
              <a href={site.phoneHref}
                className="card block p-7 text-center">
                <div className="t-h4">Call Us</div>
                <p className="t-small text-secondary mt-2">Prefer to talk it through? We're happy to help.</p>
                <span className="btn btn-outline nums mt-5">{site.phone}</span>
              </a>
            </Reveal>
            {site.email && (
              <Reveal>
                <a href={`mailto:${site.email}`}
                  className="card block p-7 text-center">
                  <div className="t-h4">Email</div>
                  <p className="t-small text-secondary mt-2">Send us your dates or party size and we'll come back to you.</p>
                  <span className="btn btn-outline mt-5 break-all">{site.email}</span>
                </a>
              </Reveal>
            )}
            {site.whatsapp && (
              <Reveal>
                <a href={`https://wa.me/${site.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="card block p-7 text-center">
                  <div className="t-h4">WhatsApp</div>
                  <p className="t-small text-secondary mt-2">Message us directly on WhatsApp.</p>
                  <span className="btn btn-outline mt-5">Chat on WhatsApp</span>
                </a>
              </Reveal>
            )}
          </div>

          <div className="mt-12 max-w-md"><OpeningHours /></div>
        </div>
      </section>
    </>
  );
}

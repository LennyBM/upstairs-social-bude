import { site } from '../config/site';
import { SEO } from '../components/SEO';
import { PageHero } from '../components/PageHero';
import { SectionHeading, Reveal } from '../components/ui';
import { useReveal } from '../lib/reveal';

export function WhatsOn() {
  useReveal();
  const clean = (s?: string) => (s || '').replace(/^\[DRAFT\]\s*/, '');
  return (
    <>
      <SEO title={`What's On | Events at ${site.name}, ${site.town}`}
        description={`Live music, quizzes and events at ${site.name} in ${site.town}.`} path="/whats-on" />
      <PageHero title="What's On" sub={`Events at ${site.shortName}`} image={site.featured[2] || site.images[2] || site.hero} />

      <section className="section">
        <div className="container-x max-w-3xl text-center">
          <SectionHeading eyebrow="Events & Entertainment" title="Always Something Happening" />
        </div>
        <div className="container-x max-w-3xl mt-12 space-y-4">
          {site.events.map((e, i) => (
            <Reveal key={i}>
              <div className="card p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="sm:w-44 shrink-0">
                  <span className="inline-block bg-primary/10 text-primary text-sm font-semibold rounded-full px-4 py-1.5">{clean(e.when)}</span>
                </div>
                <div>
                  <h3 className="font-headline text-xl text-ink">{clean(e.name)}</h3>
                  <p className="text-sm text-muted mt-1 leading-relaxed">{clean(e.desc)}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section bg-surface text-center">
        <div className="container-x max-w-2xl">
          <h2 className="h-section text-ink">Don't Miss Out</h2>
          <p className="mt-4 text-muted">Follow us on social media for the latest events, live music line-ups and last-minute specials.</p>
          <div className="flex justify-center gap-3 mt-7">
            {site.socials.facebook && <a href={site.socials.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Facebook</a>}
            {site.socials.instagram && <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-outline">Instagram</a>}
            <a href={site.phoneHref} className="btn btn-outline">Call {site.phone}</a>
          </div>
        </div>
      </section>
    </>
  );
}

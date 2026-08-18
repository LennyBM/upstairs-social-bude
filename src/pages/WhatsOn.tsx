import type { CSSProperties } from 'react';
import { site } from '../config/site';
import { SEO } from '../components/SEO';
import { PageHero } from '../components/PageHero';
import { SectionHeading, Reveal } from '../components/ui';
import { useReveal } from '../lib/reveal';

/** Spec §7: --r-sm is the chip and tag radius. Radius utilities are banned in JSX (§14.1). */
const CHIP: CSSProperties = { borderRadius: 'var(--r-sm)', fontWeight: 600 };

export function WhatsOn() {
  useReveal();
  return (
    <>
      <SEO title={`What's On | Events at ${site.name}, ${site.town}`}
        description={`Live music, quizzes and events at ${site.name} in ${site.town}.`} path="/whats-on" />
      <PageHero title="What's On" sub={`Events at ${site.shortName}`} image={site.featured[2] || site.images[2] || site.hero} />

      <section className="section">
        <div className="container-x">
          <SectionHeading eyebrow="Events & Entertainment" title="Always Something Happening" />
        </div>
        <div className="container-x max-w-3xl mt-12 space-y-4">
          {site.events.map((e, i) => (
            <Reveal key={i}>
              <div className="card p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="sm:w-44 shrink-0">
                  <span className="inline-block t-small nums bg-primary/10 text-primary px-4 py-1.5" style={CHIP}>{e.when}</span>
                </div>
                <div>
                  <h3 className="t-h4">{e.name}</h3>
                  <p className="t-small text-secondary mt-1">{e.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section section-recessed">
        <div className="container-x">
          <h2 className="t-h2">Don't Miss Out</h2>
          <p className="t-body measure text-secondary mt-4">Follow us on social media for the latest events, live music line-ups and last-minute specials.</p>
          <div className="flex flex-wrap gap-3 mt-7">
            {site.socials.facebook && <a href={site.socials.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Facebook</a>}
            {site.socials.instagram && <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-outline">Instagram</a>}
            <a href={site.phoneHref} className="btn btn-outline">Call {site.phone}</a>
          </div>
        </div>
      </section>
    </>
  );
}

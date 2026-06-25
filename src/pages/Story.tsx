import { site } from '../config/site';
import { SEO } from '../components/SEO';
import { SectionHeading, Reveal } from '../components/ui';
import { PageHero } from '../components/PageHero';
import { useReveal } from '../lib/reveal';

export function Story() {
  useReveal();
  const clean = (s: string) => s.replace(/^\[DRAFT\]\s*/, '');
  return (
    <>
      <SEO title={`Our Story | ${site.name}, ${site.town}`}
        description={`The history and heritage of ${site.name} — ${site.tagline}`} path="/our-story" />
      <PageHero title="Our Story" sub={`${site.type} · ${site.town}, ${site.county}`} image={site.featured[4] || site.images[2] || site.hero} />

      <section className="section">
        <div className="container-x max-w-3xl">
          <Reveal>
            <p className="eyebrow mb-3">Heritage</p>
            <h2 className="h-section text-ink">{site.established ? `A ${site.town} institution since ${site.established}` : `At the heart of ${site.town}`}</h2>
            <hr className="rule mt-5" />
          </Reveal>
          <div className="prose-pub mt-8 space-y-5 text-ink/85 leading-relaxed text-lg">
            {site.history.map((p, i) => <Reveal key={i}><p>{clean(p)}</p></Reveal>)}
          </div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container-x">
          <SectionHeading eyebrow="Why Visit" title="What Makes Us Special" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-12">
            {site.usps.map((u, i) => (
              <Reveal key={i}>
                <div className="card p-6 h-full" style={{ transitionDelay: `${(i % 3) * 70}ms` }}>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-primary font-headline text-lg">{i + 1}</span>
                  </div>
                  <p className="text-ink/85 leading-relaxed">{clean(u)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

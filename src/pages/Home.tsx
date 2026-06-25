import { Link } from 'react-router-dom';
import { site } from '../config/site';
import { SEO } from '../components/SEO';
import { Hero } from '../components/Hero';
import { Reviews } from '../components/Reviews';
import { Gallery } from '../components/Gallery';
import { OpeningHours, MapEmbed } from '../components/InfoBlocks';
import { TrustMarquee } from '../components/TrustMarquee';
import { SectionHeading, Reveal } from '../components/ui';
import { useReveal } from '../lib/reveal';

export function Home() {
  useReveal();
  const featured = site.featured.length ? site.featured : site.images.slice(0, 3);

  return (
    <>
      <SEO title={`${site.name} | ${site.type} in ${site.town}, ${site.county}`} description={site.intro} />
      <Hero />
      <TrustMarquee />

      {/* Welcome / story intro */}
      <section className="section">
        <div className="container-x grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <Reveal>
            <div className="relative">
              <img src={`/images/${featured[0]}`} alt={`Inside ${site.name}`}
                className="rounded-2xl w-full aspect-[4/5] object-cover shadow-lg" loading="lazy" />
              {site.established && (
                <div className="absolute -bottom-5 -right-3 md:-right-5 bg-primary text-contrast rounded-xl px-5 py-3 shadow-lg">
                  <span className="font-headline text-2xl">Est. {site.established}</span>
                </div>
              )}
            </div>
          </Reveal>
          <Reveal>
            <p className="eyebrow mb-3">Welcome</p>
            <h2 className="h-section text-ink">{site.tagline}</h2>
            <hr className="rule mt-5" />
            {site.history.slice(0, 2).map((p, i) => (
              <p key={i} className="mt-5 text-ink/80 leading-relaxed">{p.replace(/^\[DRAFT\]\s*/, '')}</p>
            ))}
            <Link to="/our-story" className="btn btn-outline mt-7">Our Story</Link>
          </Reveal>
        </div>
      </section>

      {/* Feature cards: what we offer */}
      <section className="section bg-surface">
        <div className="container-x">
          <SectionHeading eyebrow="What We Offer" title={`The Heart of ${site.town}`} />
          <div className="grid gap-6 md:grid-cols-3 mt-12">
            {offerCards().map((c, i) => (
              <Reveal key={c.title}>
                <Link to={c.to} className="card group block h-full" style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className="aspect-[3/2] overflow-hidden">
                    <img src={`/images/${c.img}`} alt={c.title} loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-headline text-2xl text-ink">{c.title}</h3>
                    <p className="mt-2 text-sm text-muted leading-relaxed">{c.desc}</p>
                    <span className="inline-block mt-4 text-sm font-semibold text-primary link-underline">{c.cta} →</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Reviews limit={3} />

      {/* Gallery preview */}
      {site.pages.gallery && site.images.length > 3 && (
        <section className="section">
          <div className="container-x">
            <SectionHeading eyebrow="Gallery" title="A Glimpse Inside" />
            <div className="mt-10"><Gallery max={8} /></div>
            <div className="text-center mt-8">
              <Link to="/gallery" className="btn btn-outline">View Full Gallery</Link>
            </div>
          </div>
        </section>
      )}

      {/* Find us */}
      <section className="section bg-surface">
        <div className="container-x grid lg:grid-cols-2 gap-12 items-center">
          <Reveal><MapEmbed /></Reveal>
          <Reveal>
            <p className="eyebrow mb-3">Find Us</p>
            <h2 className="h-section text-ink">Pop In & Say Hello</h2>
            <hr className="rule mt-5" />
            <address className="not-mt-5 text-ink/80 leading-relaxed">
              {site.addressLines.join(', ')}<br />{site.town}, {site.county} {site.postcode}
            </address>
            <div className="mt-6"><OpeningHours /></div>
            <div className="flex flex-wrap gap-3 mt-7">
              <a href={site.phoneHref} className="btn btn-primary">Call {site.phone}</a>
              <a href={site.mapsLink} target="_blank" rel="noopener noreferrer" className="btn btn-outline">Get Directions</a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );

  function offerCards() {
    const cards: { title: string; desc: string; to: string; cta: string; img: string }[] = [];
    const imgs = site.featured.length >= 3 ? site.featured : site.images;
    if (site.food.serves) cards.push({ title: 'Food & Drink', desc: site.food.summary?.replace(/^\[DRAFT\]\s*/, '') || 'Freshly prepared dishes and well-kept local ales.', to: '/food-drink', cta: 'See the menu', img: imgs[1] || imgs[0] });
    else cards.push({ title: 'The Bar', desc: site.drinks?.replace(/^\[DRAFT\]\s*/, '') || 'A cracking selection of cask ales, craft beers and spirits.', to: '/our-story', cta: 'Discover more', img: imgs[1] || imgs[0] });
    if (site.pages.whatsOn) cards.push({ title: "What's On", desc: 'Live music, quiz nights and events throughout the week.', to: '/whats-on', cta: "See what's on", img: imgs[2] || imgs[0] });
    if (site.accommodation.has) cards.push({ title: 'Stay With Us', desc: site.accommodation.summary?.replace(/^\[DRAFT\]\s*/, '') || 'Comfortable rooms for a relaxing local escape.', to: '/rooms', cta: 'View rooms', img: imgs[3] || imgs[0] });
    if (cards.length < 3) cards.push({ title: 'Our Story', desc: 'The history and heart behind ' + site.shortName + '.', to: '/our-story', cta: 'Read more', img: imgs[4] || imgs[0] });
    return cards.slice(0, 3);
  }
}

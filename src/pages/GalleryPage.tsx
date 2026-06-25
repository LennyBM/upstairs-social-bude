import { site } from '../config/site';
import { SEO } from '../components/SEO';
import { PageHero } from '../components/PageHero';
import { Gallery } from '../components/Gallery';
import { useReveal } from '../lib/reveal';

export function GalleryPage() {
  useReveal();
  return (
    <>
      <SEO title={`Gallery | ${site.name}, ${site.town}`}
        description={`Photos of ${site.name} — ${site.tagline}`} path="/gallery" />
      <PageHero title="Gallery" sub={`${site.name}, ${site.town}`} image={site.images[5] || site.hero} />
      <section className="section">
        <div className="container-x">
          <Gallery />
        </div>
      </section>
    </>
  );
}

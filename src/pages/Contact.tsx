import { site } from '../config/site';
import { SEO } from '../components/SEO';
import { PageHero } from '../components/PageHero';
import { OpeningHours, MapEmbed } from '../components/InfoBlocks';
import { Reveal } from '../components/ui';
import { useReveal } from '../lib/reveal';

export function Contact() {
  useReveal();
  return (
    <>
      <SEO title={`Contact | ${site.name}, ${site.town}`}
        description={`Get in touch with ${site.name} in ${site.town}, ${site.county}. Call ${site.phone}.`} path="/contact" />
      <PageHero title="Contact & Find Us" sub={`${site.town}, ${site.county}`} image={site.images[6] || site.hero} />

      <section className="section">
        <div className="container-x grid lg:grid-cols-2 gap-12">
          <Reveal>
            <p className="eyebrow mb-3">Get in Touch</p>
            <h2 className="h-section text-ink">We'd Love to See You</h2>
            <hr className="rule mt-5" />

            <div className="mt-8 space-y-6">
              <ContactRow label="Call us"><a href={site.phoneHref} className="text-lg text-primary font-semibold link-underline">{site.phone}</a></ContactRow>
              {site.email && <ContactRow label="Email"><a href={`mailto:${site.email}`} className="text-primary link-underline break-all">{site.email}</a></ContactRow>}
              <ContactRow label="Address">
                <address className="not-text-ink/80">
                  {site.addressLines.join(', ')}<br />{site.town}, {site.county} {site.postcode}
                </address>
                <a href={site.mapsLink} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-sm text-primary link-underline">Get directions →</a>
              </ContactRow>
              {(site.socials.facebook || site.socials.instagram) && (
                <ContactRow label="Social">
                  <div className="flex gap-3">
                    {site.socials.facebook && <a href={site.socials.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-outline py-2 px-4 text-sm">Facebook</a>}
                    {site.socials.instagram && <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-outline py-2 px-4 text-sm">Instagram</a>}
                  </div>
                </ContactRow>
              )}
            </div>

            <div className="mt-10"><OpeningHours /></div>
          </Reveal>

          <Reveal><MapEmbed /></Reveal>
        </div>
      </section>
    </>
  );
}

function ContactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="w-24 shrink-0 text-xs uppercase tracking-widest text-muted pt-1">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

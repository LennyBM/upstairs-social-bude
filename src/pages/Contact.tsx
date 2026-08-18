import type { CSSProperties } from 'react';
import { site } from '../config/site';
import { SEO } from '../components/SEO';
import { PageHero } from '../components/PageHero';
import { OpeningHours, MapEmbed, PolicyGrid } from '../components/InfoBlocks';
import { Reveal, SectionHeading } from '../components/ui';
import { useReveal } from '../lib/reveal';

/** The UA stylesheet slants <address>; §14.3 allows font-style slant only on .pullquote and .logotype. */
const NOT_ITALIC: CSSProperties = { fontStyle: 'normal' };

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
            <h2 className="t-h2">We'd Love to See You</h2>

            <div className="mt-8 space-y-6">
              {/* §14 48px floor. Inline link in a text row, so vertical padding grows
                  the hit box (23px -> 55px) and the line box, row rhythm and wrap are
                  untouched. Same reason as the Legal.tsx prose links. */}
              <ContactRow label="Call us"><a href={site.phoneHref} className="t-h4 nums text-primary link-underline py-4">{site.phone}</a></ContactRow>
              {site.email && <ContactRow label="Email"><a href={`mailto:${site.email}`} className="t-body text-primary link-underline break-all">{site.email}</a></ContactRow>}
              <ContactRow label="Address">
                <address className="t-body measure" style={NOT_ITALIC}>
                  {site.addressLines.join(', ')}<br />{site.town}, {site.county} {site.postcode}
                </address>
                {/* This one is inline-block, so padding would move everything below it.
                    It becomes a real 48px box instead (min-h-12, same idiom as the
                    social buttons on line 42), which grows the address row by 26px
                    and leaves the space-y-6 rhythm between rows intact. */}
                <a href={site.mapsLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-12 t-small text-primary link-underline mt-2">Get directions →</a>
              </ContactRow>
              {(site.socials.facebook || site.socials.instagram) && (
                <ContactRow label="Social">
                  <div className="flex flex-wrap gap-3">
                    {/* min-h-12 holds the §14.3 48px floor. `.btn-sm` is 2.75rem (44px)
                        by §5's control table, so the floor is held at the call site
                        rather than by contradicting that table in index.css. Same
                        pattern as Header, CookieBanner and Layout. */}
                    {site.socials.facebook && <a href={site.socials.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm min-h-12">Facebook</a>}
                    {site.socials.instagram && <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm min-h-12">Instagram</a>}
                  </div>
                </ContactRow>
              )}
            </div>

            <div className="mt-10"><OpeningHours /></div>
          </Reveal>

          <Reveal><MapEmbed /></Reveal>
        </div>
      </section>

      {/*
        Spec §9.4 places <PolicyGrid> on Contact and Home. It answers dogs, parking,
        step-free access, children, last orders and the kitchen cutoff — the six
        questions this page's phone number is currently being rung to ask. Anything
        the config does not state falls to the §9.5 empty state, a call link, so an
        unanswered question still converts.
      */}
      <section className="section section-rule">
        <div className="container-x">
          <SectionHeading eyebrow="Good to Know" title="Before You Arrive" />
          <Reveal className="mt-8"><PolicyGrid /></Reveal>
        </div>
      </section>
    </>
  );
}

function ContactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="eyebrow w-24 shrink-0 pt-1">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

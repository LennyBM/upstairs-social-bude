import { Link } from 'react-router-dom';
import { site, navLinks } from '../config/site';

export function Footer() {
  const year = 2026;
  return (
    <footer className="bg-ink text-white/80 mt-0">
      <div className="container-x py-16 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="font-headline text-2xl text-white">{site.name}</p>
          <p className="mt-3 text-sm leading-relaxed text-white/70">{site.tagline}</p>
          {site.rating && (
            <p className="mt-4 text-sm text-white/70">★ {site.rating} · {site.reviewsCount}+ reviews</p>
          )}
        </div>

        <div>
          <h3 className="text-white text-sm uppercase tracking-widest font-sans not-font-semibold mb-4">Explore</h3>
          <ul className="space-y-2 text-sm">
            {navLinks.map((l) => (
              <li key={l.to}><Link to={l.to} className="hover:text-white transition-colors">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-white text-sm uppercase tracking-widest font-sans not-font-semibold mb-4">Find Us</h3>
          <address className="not-text-sm space-y-1 text-white/70">
            {site.addressLines.map((l) => <div key={l}>{l}</div>)}
            <div>{site.town}, {site.county}</div>
            <div>{site.postcode}</div>
          </address>
          <a href={site.phoneHref} className="block mt-3 text-sm text-white hover:underline">{site.phone}</a>
          {site.email && <a href={`mailto:${site.email}`} className="block text-sm text-white/80 hover:underline break-all">{site.email}</a>}
          <div className="flex gap-3 mt-4">
            {site.socials.facebook && <SocialIcon href={site.socials.facebook} label="Facebook" d="M13 10h3l.5-3H13V5.5c0-.9.3-1.5 1.6-1.5H17V1.2C16.6 1.1 15.4 1 14.1 1 11.4 1 9.7 2.6 9.7 5.2V7H7v3h2.7v8H13z" />}
            {site.socials.instagram && <SocialIcon href={site.socials.instagram} label="Instagram" d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zM12 7.4a4.6 4.6 0 100 9.2 4.6 4.6 0 000-9.2zm0 7.6a3 3 0 110-6 3 3 0 010 6zm5.8-7.8a1.1 1.1 0 11-2.2 0 1.1 1.1 0 012.2 0z" />}
          </div>
        </div>

        <div>
          <h3 className="text-white text-sm uppercase tracking-widest font-sans not-font-semibold mb-4">Opening Hours</h3>
          <ul className="space-y-1 text-sm text-white/70">
            {site.openingHours.map((h) => (
              <li key={h.day} className="flex justify-between gap-3"><span>{h.day}</span><span className="text-white/90">{h.hours}</span></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>© {year} {site.name}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-white/80">Privacy</Link>
            <Link to="/terms" className="hover:text-white/80">Terms</Link>
            <Link to="/cookies" className="hover:text-white/80">Cookies</Link>
            <Link to="/accessibility" className="hover:text-white/80">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ href, label, d }: { href: string; label: string; d: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
      className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>
    </a>
  );
}

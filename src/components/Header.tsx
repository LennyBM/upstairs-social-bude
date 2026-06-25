import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { site } from '../config/site';
import { navLinks } from '../config/site';

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();

  useEffect(() => { setOpen(false); }, [loc.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-bg/95 backdrop-blur shadow-sm py-2' : 'py-4'
    }`}>
      <div className="container-x flex items-center justify-between gap-4">
        <Link to="/" className="flex flex-col leading-none" aria-label={`${site.name} home`}>
          <span className={`font-headline text-xl md:text-2xl ${scrolled ? 'text-ink' : 'text-ink'}`}>
            {site.shortName}
          </span>
          <span className="text-[0.6rem] uppercase tracking-[0.25em] text-muted mt-0.5">
            {site.town} · {site.county}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7" aria-label="Primary">
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}
              className={({ isActive }) =>
                `text-sm font-medium link-underline transition-colors ${isActive ? 'text-primary' : 'text-ink/80 hover:text-primary'}`}>
              {l.label}
            </NavLink>
          ))}
          <a href={site.phoneHref} className="btn btn-primary text-sm py-2.5 px-5">
            {site.phone}
          </a>
        </nav>

        <button className="lg:hidden p-2 -mr-2 text-ink" aria-label="Open menu" aria-expanded={open}
          onClick={() => setOpen(true)}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
        <div className={`absolute right-0 top-0 h-full w-[82%] max-w-sm bg-bg shadow-xl p-6 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between mb-8">
            <span className="font-headline text-xl text-ink">{site.shortName}</span>
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="p-2 text-ink">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {navLinks.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'}
                className={({ isActive }) =>
                  `py-3 text-lg font-medium border-b border-line ${isActive ? 'text-primary' : 'text-ink'}`}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <a href={site.phoneHref} className="btn btn-primary mt-8">Call {site.phone}</a>
          {site.socials.facebook && (
            <a href={site.socials.facebook} target="_blank" rel="noopener noreferrer"
              className="mt-4 text-center text-sm text-muted link-underline">Find us on Facebook</a>
          )}
        </div>
      </div>
    </header>
  );
}

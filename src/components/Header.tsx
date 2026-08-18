import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { site, navLinks } from '../config/site';
import { StatusNow } from './InfoBlocks';

/**
 * Routes whose first element is full bleed media, mirroring the route table in
 * App.tsx. The header is TOLD it sits over media (spec 9.2); it never samples
 * the image. Anything not listed here falls through to NotFound, which has no
 * hero, so the header keeps its ink foreground.
 */
const MEDIA_ROUTES = new Set<string>([
  '/',
  '/our-story',
  '/contact',
  '/privacy',
  '/terms',
  '/cookies',
  '/accessibility',
  ...(site.pages.food ? ['/food-drink'] : []),
  ...(site.pages.sundayLunch ? ['/sunday-lunch'] : []),
  ...(site.pages.book ? ['/book'] : []),
  ...(site.pages.rooms ? ['/rooms'] : []),
  ...(site.pages.whatsOn ? ['/whats-on'] : []),
  ...(site.pages.gallery ? ['/gallery'] : []),
]);

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  const path = loc.pathname.replace(/(.)\/+$/, '$1');
  const overMedia = MEDIA_ROUTES.has(path);

  // Close the drawer when the route changes. Adjusted during render rather than
  // in an effect, which would queue a second render pass on every navigation.
  const [lastPath, setLastPath] = useState(loc.pathname);
  if (lastPath !== loc.pathname) {
    setLastPath(loc.pathname);
    if (open) setOpen(false);
  }

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

  // Focus trap. Without it Tab walks straight out of the drawer and onto the
  // page behind the overlay, which is still painted and still clickable.
  useEffect(() => {
    if (!open) return;
    const node = drawerRef.current;
    if (!node) return;

    const items = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
    items()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
      if (e.key !== 'Tab') return;
      const list = items();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (!active || active === first || !node.contains(active)) { e.preventDefault(); last.focus(); }
      } else if (!active || active === last || !node.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Hand focus back to the control that opened the drawer.
  useEffect(() => {
    if (wasOpen.current && !open) openerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  return (
    <header
      className={`site-header ${scrolled ? 'py-2' : 'py-4'}`}
      data-scrolled={String(scrolled)}
      data-over-media={String(overMedia)}
    >
      <div className="container-x flex items-center justify-between gap-4">
        {/* §14 conversion gate: every interactive target is 48 x 48 or larger. The
            logotype's own content box is 43.98px tall, so the hit box is grown with
            padding and the layout box put back with an equal negative margin: the
            margin box stays 43.98px, the 50px header row and the 82px header height
            are unchanged, and both spans stay on the exact pixel they were on. */}
        <Link to="/" className="flex flex-col py-1 -my-1" aria-label={`${site.name} home`}>
          <span className="logotype t-h4">
            {site.shortName}
          </span>
          <span className="t-caption uppercase tracking-(--tracking-label) mt-0.5">
            {site.town} · {site.county}
          </span>
        </Link>

        {/*
          §9.4 places <StatusNow> in the fact bar AND in the header on scroll. It
          mounts only while `scrolled`, which is also the only state in which the
          header has its own background: over media at scrollY 0 the fact strip
          is doing this job 500px below, and a second copy would sit on the
          photograph. `tone="inherit"` is mandatory — the glyph must ride
          --header-fg rather than pin --text-secondary, which is a light-surface
          token and would repeat the dark-on-dark logo defect. `live={false}`
          stops this instance and the fact bar's announcing the same minute
          rollover twice. Wrapped rather than passed `hidden lg:inline-flex`, so
          the visibility does not depend on how Tailwind orders two display
          utilities inside one class attribute.
        */}
        {scrolled && (
          <div className="hidden lg:block">
            <StatusNow tone="inherit" live={false} />
          </div>
        )}

        {/* The current item is styled by the unlayered a[aria-current="page"] rule
            in index.css — inherited colour, weight 600, one underline. An
            `isActive ? 'text-accent'` branch here is dead (the unlayered rule
            outranks the utilities layer) and would pin gold text on a header that
            must stay white over media, so it is gone from both navs. */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="Primary">
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}
              className="t-small link-underline inline-flex items-center min-h-12 transition-colors duration-(--dur-fast) ease-inout">
              {l.label}
            </NavLink>
          ))}
          {/* min-h-12: the §14.3 48px floor. `.btn-sm` alone is 2.75rem (44px). */}
          <a href={site.phoneHref} className="btn btn-sm btn-primary min-h-12">
            {site.phone}
          </a>
        </nav>

        <button ref={openerRef} className="lg:hidden p-3 -mr-3" aria-label="Open menu"
          aria-expanded={open} aria-controls="mobile-menu" aria-haspopup="dialog"
          onClick={() => setOpen(true)}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`lg:hidden fixed inset-0 transition-opacity duration-(--dur-ui) ease-inout ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        inert={!open} aria-hidden={!open}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
        <div ref={drawerRef} id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu"
          className={`drawer text-text absolute right-0 top-0 h-full w-[82%] max-w-sm p-6 flex flex-col transition-transform duration-(--dur-ui) ease-inout ${open ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between mb-8">
            <span className="logotype t-h4">{site.shortName}</span>
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="p-3 -mr-3">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {navLinks.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'}
                className="flex items-center min-h-12 py-3 t-h4 border-b border-line">
                {l.label}
              </NavLink>
            ))}
          </nav>
          <a href={site.phoneHref} className="btn btn-primary mt-8">Call {site.phone}</a>
          {site.socials.facebook && (
            <a href={site.socials.facebook} target="_blank" rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center min-h-12 t-small text-muted link-underline">Find us on Facebook</a>
          )}
        </div>
      </div>
    </header>
  );
}

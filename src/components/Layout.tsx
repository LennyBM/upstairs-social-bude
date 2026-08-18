import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { CookieBanner } from './CookieBanner';
import { Schema } from './Schema';
import { ActionBar } from './ActionBar';
import { WhatsAppButton } from './WhatsAppButton';
import { site } from '../config/site';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); }, [pathname]);
  return null;
}

/**
 * Spec §9.4: one line, dismissible, under the header, driven by `site.notice`.
 * Defined locally because §13.5 assigns `<NoticeBanner>` to no file; `InfoBlocks.tsx`
 * is owned elsewhere in this pass. Move it out during the integration pass if wanted.
 *
 * `notice` is a volatile field (§9.5). Empty state is defined: nothing renders.
 *
 * The dismissal is read in the state initialiser rather than an effect, so the banner
 * never paints and then disappears, and no cascading render is queued.
 */
function NoticeBanner() {
  const notice = site.notice?.trim();
  //
  // The `typeof window` guard is for the prerender: the initialiser runs during render and
  // there is no `localStorage` outside a browser. No storage means nothing has been
  // dismissed, so the notice renders — a crawler and a JS-off visitor see it, which is the
  // point of it. Behaviour in a browser is unchanged.
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return window.localStorage.getItem('notice-dismissed') === notice; } catch { return false; }
  });
  if (!notice || dismissed) return null;
  const close = () => {
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem('notice-dismissed', notice); } catch { /* ignore */ }
    }
    setDismissed(true);
  };
  return (
    <div className="notice" role="status">
      <div className="container-x flex items-center gap-4">
        <p className="t-small flex-1">{notice}</p>
        <button type="button" onClick={close} aria-label="Dismiss notice"
          className="btn btn-sm btn-outline min-h-12 shrink-0">Dismiss</button>
      </div>
    </div>
  );
}

export function Layout() {
  return (
    <>
      <Schema />
      <ScrollToTop />
      <Header />
      <NoticeBanner />
      {/* §9.1: the action bar must not cover the last 60px of the footer below 1024px.
          The inset has to sit below the *footer*, not below <main>. The fixed
          .action-bar covers the document band [docH - var(--cta-bar-h), docH] at
          maximum scroll, and the footer is the element that ends at docH — so on
          <main> the padding only pushed the footer down and moved the problem with
          it. Measured at 390x844 before this change: the four legal links sat at
          [docH-58, docH-8] on every route, 48px of their 50px height behind the bar,
          i.e. Privacy/Terms/Cookies/Accessibility were unreachable on mobile.
          Above 1024px the action bar is display:none, so the inset is dropped. */}
      <div className="pb-[calc(var(--cta-bar-h)_+_env(safe-area-inset-bottom))] lg:pb-0">
        <main id="main">
          <Outlet />
        </main>
        <Footer />
      </div>
      <CookieBanner />
      <ActionBar />
      <WhatsAppButton />
    </>
  );
}

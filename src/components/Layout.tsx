import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { CookieBanner } from './CookieBanner';
import { Schema } from './Schema';
import { StickyMobileCTA } from './StickyMobileCTA';
import { WhatsAppButton } from './WhatsAppButton';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); }, [pathname]);
  return null;
}

export function Layout() {
  return (
    <>
      <Schema />
      <ScrollToTop />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <CookieBanner />
      <StickyMobileCTA />
      <WhatsAppButton />
    </>
  );
}

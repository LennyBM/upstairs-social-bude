import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { App } from './App';
import { site } from './config/site';
import './index.css';

// Spec §1.1: the display treatment is a per-venue axis, set on <html data-display>
// from site.ts. `index.css` defaults :root to 'inn' and overrides on [data-display="coast"],
// so this must be written or the 'coast' branch can never activate.
//
// The `typeof document` guard exists because this module previously touched the DOM at
// module scope. The build now prerenders every route, and although that renderer is a real
// headless browser (so `document` is present), a module-scope DOM write is the kind of thing
// that turns a future renderer swap — jsdom, `renderToString`, a test harness — into a build
// that dies at import time. Guarded, never removed: with a document present the behaviour is
// byte for byte what it was.
if (typeof document !== 'undefined') {
  document.documentElement.dataset.display = site.design.display;

  const container = document.getElementById('root');
  if (container) {
    createRoot(container).render(
      <StrictMode>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </StrictMode>,
    );
  }
}

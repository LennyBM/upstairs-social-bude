import { useState } from 'react';
import { Link } from 'react-router-dom';

export function CookieBanner() {
  // §13.3: visible by default, only JS may hide it. Read in the state initialiser so a
  // returning visitor never sees the banner paint and then vanish.
  //
  // The state initialiser runs during render, including during a prerender, where there may
  // be no `localStorage` at all. The `typeof window` guard makes the no-storage answer
  // explicit and keeps it on the §13.3 side of the line: no storage means nothing has been
  // consented to, so the banner shows. The behaviour with storage present is unchanged.
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return true;
    try { return !window.localStorage.getItem('cookie-consent'); } catch { return true; }
  });
  if (!show) return null;
  const close = (v: string) => {
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem('cookie-consent', v); } catch { /* ignore */ }
    }
    setShow(false);
  };
  return (
    <div className="consent" role="region" aria-label="Cookie consent">
      <div className="card float mx-auto max-w-[var(--container)] p-5 flex flex-col md:flex-row md:items-center gap-4">
        <p className="t-small text-secondary measure flex-1">
          We use essential cookies to make this site work and optional cookies to understand how it's used.
          {/* §14 conversion gate: 48px floor. This is an inline link inside running
              prose, so vertical padding grows the hit box (19px -> 51px) without
              touching the line box, the paragraph height or the wrap point. The
              hit box stops 1.75px clear of the consent buttons below it. */}
          See our <Link to="/cookies" className="text-primary underline py-4">Cookie Policy</Link>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => close('essential')} className="btn btn-sm btn-outline min-h-12 flex-1 md:flex-none">Essential only</button>
          <button onClick={() => close('all')} className="btn btn-sm btn-primary min-h-12 flex-1 md:flex-none">Accept all</button>
        </div>
      </div>
    </div>
  );
}

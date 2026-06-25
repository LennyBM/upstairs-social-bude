import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try { if (!localStorage.getItem('cookie-consent')) setShow(true); } catch { /* ignore */ }
  }, []);
  if (!show) return null;
  const close = (v: string) => { try { localStorage.setItem('cookie-consent', v); } catch { /* ignore */ } setShow(false); };
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4">
      <div className="container-x card p-5 shadow-xl flex flex-col md:flex-row md:items-center gap-4">
        <p className="text-sm text-ink/80 flex-1">
          We use essential cookies to make this site work and optional cookies to understand how it's used.
          See our <Link to="/cookies" className="text-primary underline">Cookie Policy</Link>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => close('essential')} className="btn btn-outline py-2.5 px-5 text-sm">Essential only</button>
          <button onClick={() => close('all')} className="btn btn-primary py-2.5 px-5 text-sm">Accept all</button>
        </div>
      </div>
    </div>
  );
}

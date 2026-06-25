import { site } from '../config/site';

/** Cross-Inn style scrolling trust strip. */
export function TrustMarquee() {
  const items = (site.usps && site.usps.length ? site.usps : [
    'A warm Cornish welcome', 'Well-kept local ales', 'Dogs & families welcome',
  ]).map((s) => s.replace(/^\[DRAFT\]\s*/, ''));
  const doubled = [...items, ...items];
  return (
    <div className="bg-primary text-contrast py-4 marquee-mask" aria-label="Why visit">
      <div className="marquee-track font-ui text-sm uppercase tracking-widest">
        {doubled.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-3">
            <span className="text-accent">◆</span>
            <span className="opacity-90">{t}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

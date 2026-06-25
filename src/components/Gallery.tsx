import { useState } from 'react';
import { site } from '../config/site';

export function Gallery({ images, max }: { images?: string[]; max?: number }) {
  const imgs = (images || site.images).slice(0, max);
  const [active, setActive] = useState<number | null>(null);
  if (!imgs.length) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {imgs.map((img, i) => (
          <button key={img + i} onClick={() => setActive(i)}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-surface"
            aria-label={`View photo ${i + 1}`}>
            <img src={`/images/${img}`} alt={`${site.name} ${i + 1}`} loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </button>
        ))}
      </div>

      {active !== null && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setActive(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white" aria-label="Close" onClick={() => setActive(null)}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></svg>
          </button>
          <button className="absolute left-4 text-white/80 hover:text-white p-2" aria-label="Previous"
            onClick={(e) => { e.stopPropagation(); setActive((active - 1 + imgs.length) % imgs.length); }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <img src={`/images/${imgs[active]}`} alt={`${site.name} ${active + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded" onClick={(e) => e.stopPropagation()} />
          <button className="absolute right-4 text-white/80 hover:text-white p-2" aria-label="Next"
            onClick={(e) => { e.stopPropagation(); setActive((active + 1) % imgs.length); }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      )}
    </>
  );
}

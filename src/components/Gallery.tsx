import { useCallback, useEffect, useState } from 'react';
import { site } from '../config/site';
import { Img, SIZES_LIGHTBOX, SIZES_RAIL_TILE } from './Img';

/**
 * Archetype D (spec §8): a horizontal `.rail` with `scroll-snap-type: x mandatory`,
 * which is the answer to a long list on mobile. Tiles take `--r-md` (§7). The
 * lightbox is one of the three surfaces permitted `.float`, the single shadow (§4).
 */
export function Gallery({ images, max }: { images?: string[]; max?: number }) {
  const imgs = (images || site.images).slice(0, max);
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (d: number) => setActive((i) => (i === null ? i : (i + d + imgs.length) % imgs.length)),
    [imgs.length],
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, close, step]);

  if (!imgs.length) return null;

  return (
    <>
      <div className="rail">
        {imgs.map((img, i) => (
          <button
            key={img + i}
            type="button"
            onClick={() => setActive(i)}
            className="group relative aspect-[4/3] overflow-hidden rounded-(--r-md) bg-surface"
            aria-label={`View photo ${i + 1}`}
          >
            {/* A rail tile is ~348px on desktop however wide the viewport
                gets, so this is the one place a fixed px `sizes` is correct. */}
            <Img
              file={img}
              alt={`${site.name} ${i + 1}`}
              sizes={SIZES_RAIL_TILE}
              className="w-full h-full object-cover transition-transform duration-(--dur-ui) ease-out group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-(--z-drawer) bg-black/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${site.name} photo ${active + 1} of ${imgs.length}`}
          onClick={close}
        >
          <button
            type="button"
            className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center text-(color:--text-on-dark-muted) hover:text-(color:--text-on-dark) transition-colors duration-(--dur-fast) ease-inout"
            aria-label="Close"
            onClick={close}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></svg>
          </button>

          <button
            type="button"
            className="absolute left-4 w-12 h-12 flex items-center justify-center text-(color:--text-on-dark-muted) hover:text-(color:--text-on-dark) transition-colors duration-(--dur-fast) ease-inout"
            aria-label="Previous"
            onClick={(e) => { e.stopPropagation(); step(-1); }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
          </button>

          {/* Opened deliberately, so it is fetched at high priority rather
              than lazily. width/height carry the real ratio, which is what
              stops the dialog reflowing as each photo arrives. */}
          <Img
            file={imgs[active]}
            alt={`${site.name} ${active + 1}`}
            sizes={SIZES_LIGHTBOX}
            priority
            className="float max-h-[85vh] max-w-[90vw] object-contain rounded-(--r-md)"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            className="absolute right-4 w-12 h-12 flex items-center justify-center text-(color:--text-on-dark-muted) hover:text-(color:--text-on-dark) transition-colors duration-(--dur-fast) ease-inout"
            aria-label="Next"
            onClick={(e) => { e.stopPropagation(); step(1); }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      )}
    </>
  );
}

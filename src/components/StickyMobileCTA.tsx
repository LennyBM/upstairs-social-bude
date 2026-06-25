import { Link } from 'react-router-dom';
import { site } from '../config/site';

/** Sticky bottom action bar on mobile: Call + Book/Reserve. */
export function StickyMobileCTA() {
  const canBook = site.pages.book;
  const bookTo = canBook ? '/book' : (site.pages.rooms ? '/rooms' : '/contact');
  const bookLabel = site.accommodation.has ? 'Book a Stay' : 'Book a Table';
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-line bg-bg/95 backdrop-blur shadow-[0_-2px_12px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <a href={site.phoneHref} className="flex-1 flex items-center justify-center gap-2 py-3.5 font-semibold text-ink"
        aria-label={`Call ${site.name}`}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        Call
      </a>
      <Link to={bookTo} className="flex-1 flex items-center justify-center gap-2 py-3.5 font-semibold bg-primary text-contrast"
        aria-label={bookLabel}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        {bookLabel}
      </Link>
    </div>
  );
}

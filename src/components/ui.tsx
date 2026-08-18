import type { CSSProperties, ReactNode } from 'react';

/** Token reference, not a literal colour. See spec §3 on-dark roles. */
const ON_DARK_SECONDARY: CSSProperties = { color: 'var(--text-on-dark-secondary)' };

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ');

/**
 * Section heading. Left aligned by default (spec §8: text-center is banned at
 * section level; centring is opt-in for cards and archetype E only).
 * Measures are carried by .t-h2 (22ch) and .t-lead (46ch), not by a wrapper width.
 */
export function SectionHeading({
  eyebrow, title, sub, center = false, light = false,
}: { eyebrow?: string; title: string; sub?: string; center?: boolean; light?: boolean }) {
  return (
    <div className={cx('reveal', center && 'text-center mx-auto', light && 'on-dark')}>
      {eyebrow && (
        <p className={cx('eyebrow', center && 'mx-auto')} style={light ? ON_DARK_SECONDARY : undefined}>
          {eyebrow}
        </p>
      )}
      <h2 className={cx('t-h2 mt-3', center && 'mx-auto')}>{title}</h2>
      {sub && (
        <p className={cx('t-lead mt-4', center && 'mx-auto')} style={light ? ON_DARK_SECONDARY : undefined}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function Stars({ rating = 5, className = '' }: { rating?: number; className?: string }) {
  const full = Math.round(rating);
  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24"
          fill={i < full ? 'var(--brand-accent)' : 'none'}
          stroke="var(--brand-accent)" strokeWidth="1.5">
          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 21.4l1.4-6.8L2.2 9.9l6.9-.8z" />
        </svg>
      ))}
    </span>
  );
}

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`reveal ${className}`}>{children}</div>;
}

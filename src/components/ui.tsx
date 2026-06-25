import type { ReactNode } from 'react';

export function SectionHeading({
  eyebrow, title, sub, center = true, light = false,
}: { eyebrow?: string; title: string; sub?: string; center?: boolean; light?: boolean }) {
  return (
    <div className={`${center ? 'text-center mx-auto' : ''} max-w-2xl reveal`}>
      {eyebrow && <p className="eyebrow mb-3" style={light ? { color: '#fff' } : undefined}>{eyebrow}</p>}
      <h2 className={`h-section ${light ? 'text-white' : 'text-ink'}`}>{title}</h2>
      <hr className={`rule mt-5 ${center ? 'mx-auto' : ''}`} />
      {sub && <p className={`lead mt-5 ${light ? 'text-white/80' : ''}`}>{sub}</p>}
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

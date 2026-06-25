import { site } from '../config/site';
import { SectionHeading, Stars, Reveal } from './ui';

export function Reviews({ limit }: { limit?: number }) {
  const reviews = limit ? site.reviews.slice(0, limit) : site.reviews;
  if (!reviews.length) return null;
  return (
    <section className="section bg-surface">
      <div className="container-x">
        <SectionHeading
          eyebrow="What People Say"
          title="Loved by Locals & Visitors"
          sub={site.rating ? `Rated ${site.rating}/5 across ${site.reviewsCount}+ reviews` : undefined}
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {reviews.map((r, i) => (
            <Reveal key={i}>
              <figure className="card p-6 h-full flex flex-col" style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
                <Stars rating={r.rating} className="mb-3" />
                <blockquote className="text-ink/85 flex-1 leading-relaxed">"{r.quote}"</blockquote>
                <figcaption className="mt-4 text-sm font-semibold text-ink">
                  {r.author}
                  <span className="font-normal text-muted"> · {r.source}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

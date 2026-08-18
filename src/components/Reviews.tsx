import { site } from '../config/site';
import { Img, SIZES_FULL_BLEED } from './Img';
import { SectionHeading, Stars, Reveal } from './ui';

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ');

/**
 * `cards` is the three-up grid. `quote` is archetype E (spec §8): full bleed
 * graded media with a single pull quote, which is what §11 puts on the homepage.
 */
export function Reviews({
  limit, variant = 'cards',
}: { limit?: number; variant?: 'cards' | 'quote' }) {
  const reviews = limit ? site.reviews.slice(0, limit) : site.reviews;
  if (!reviews.length) return null;

  const sub = site.rating
    ? `Rated ${site.rating}/5 across ${site.reviewsCount}+ reviews`
    : undefined;

  if (variant === 'quote') return <ReviewQuote sub={sub} />;

  return (
    <section className="section section-recessed">
      <div className="container-x">
        <SectionHeading eyebrow="What People Say" title="Loved by Locals & Visitors" sub={sub} />

        {/* Stagger opts in here. lib/reveal.ts writes --reveal-delay onto each   */}
        {/* .reveal child, which is the element carrying the transition. The old  */}
        {/* inline transitionDelay sat on the figure, where nothing transitions.  */}
        <div data-stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {reviews.map((r, i) => (
            <Reveal key={i}>
              <figure className="card p-6 h-full flex flex-col">
                <Stars rating={r.rating} className="mb-3" />
                <blockquote className="t-body flex-1">&ldquo;{r.quote}&rdquo;</blockquote>
                <figcaption className="mt-4 t-small text-secondary">
                  <span className="text-text">{r.author}</span> · {r.source}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Archetype E. Quote capped at 4 lines on mobile, 3 from 1024px (§8). Text is
 * centred, which §8 permits inside E and nowhere else at section level, and it
 * never sits on ungraded media (§10 item 5) — the grade, grain and scrim layers
 * are part of the stack, not decoration.
 */
function ReviewQuote({ sub }: { sub?: string }) {
  const r =
    site.reviews.find((x) => x.rating >= 5 && x.quote.length <= 160) ?? site.reviews[0];
  const image = site.featured[1] || site.featured[0] || site.hero;

  /* data-over-media: the ground here is a photograph, not --brand-bg, so any
     contrast check that walks the DOM has to be told rather than left to infer it
     from class names and descendants. §9.2 already uses this attribute for the
     header band; this is the same contract applied to the section that owns the
     media. Declaring it also means a future refactor of the grade or scrim layers
     cannot silently make the section look like flat ground. */
  return (
    <section className="media" data-over-media="true">
      {/* Archetype E is full bleed, so 100vw. Decorative: the quote carries
          the meaning and the photograph is the ground it sits on. */}
      <Img className="media-img" file={image} alt="" decorative sizes={SIZES_FULL_BLEED} />
      <div className="media-grade" aria-hidden="true" />
      <div className="media-grain" aria-hidden="true" />
      <div className="media-scrim-centre" aria-hidden="true" />

      <figure className="relative container-x section on-dark text-center">
        <p className="eyebrow text-(color:--text-on-dark-secondary)">What People Say</p>
        <Stars rating={r.rating} className="mt-4 justify-center" />
        <blockquote className={cx('pullquote mx-auto mt-6', 'line-clamp-4 lg:line-clamp-3')}>
          &ldquo;{r.quote}&rdquo;
        </blockquote>
        <figcaption className="mt-6 t-small text-(color:--text-on-dark-secondary)">
          <span className="text-(color:--text-on-dark)">{r.author}</span> · {r.source}
          {sub && <span className="block mt-1 nums">{sub}</span>}
        </figcaption>
      </figure>
    </section>
  );
}

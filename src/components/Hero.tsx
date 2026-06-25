import { Link } from 'react-router-dom';
import { site } from '../config/site';
import { Stars } from './ui';

export function Hero() {
  return (
    <section className="relative min-h-[88vh] flex items-center justify-center text-center text-white overflow-hidden">
      <img
        src={`/images/${site.hero}`}
        alt={`${site.name}, ${site.town}`}
        className="absolute inset-0 w-full h-full object-cover"
        fetchPriority="high"
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.25) 40%, var(--brand-hero-overlay))' }} />
      <div className="relative container-x py-32">
        {site.established && (
          <p className="eyebrow text-white/90 mb-4" style={{ color: '#fff' }}>
            {site.type} · Est. {site.established} · {site.town}
          </p>
        )}
        <h1 className="display text-white max-w-4xl mx-auto drop-shadow-sm">{site.name}</h1>
        <p className="lead text-white/90 mt-6 max-w-2xl mx-auto">{site.tagline}</p>

        <div className="flex flex-wrap gap-3 justify-center mt-9">
          <a href={site.phoneHref} className="btn btn-primary">Call {site.phone}</a>
          {site.food.serves && <Link to="/food-drink" className="btn btn-ghost-light">View the Menu</Link>}
          {!site.food.serves && site.pages.whatsOn && <Link to="/whats-on" className="btn btn-ghost-light">What's On</Link>}
          {site.accommodation.has && <Link to="/rooms" className="btn btn-ghost-light">Stay With Us</Link>}
        </div>

        {site.rating && (
          <div className="inline-flex items-center gap-2 mt-10 bg-black/30 backdrop-blur px-4 py-2 rounded-full">
            <Stars rating={site.rating} />
            <span className="text-sm text-white/90">{site.rating} · {site.reviewsCount}+ Google reviews</span>
          </div>
        )}
      </div>
    </section>
  );
}

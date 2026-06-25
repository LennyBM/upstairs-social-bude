import { Link } from 'react-router-dom';
import { site } from '../config/site';
import { SEO } from '../components/SEO';

export function NotFound() {
  return (
    <>
      <SEO title={`Page Not Found | ${site.name}`} description="The page you're looking for can't be found." />
      <section className="min-h-[70vh] flex items-center justify-center text-center pt-24">
        <div className="container-x">
          <p className="font-headline text-7xl text-primary">404</p>
          <h1 className="h-section text-ink mt-4">We couldn't find that page</h1>
          <p className="text-muted mt-3">It may have moved, or never poured a pint here at all.</p>
          <div className="flex justify-center gap-3 mt-8">
            <Link to="/" className="btn btn-primary">Back Home</Link>
            <a href={site.phoneHref} className="btn btn-outline">Call {site.phone}</a>
          </div>
        </div>
      </section>
    </>
  );
}

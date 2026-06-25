import { Helmet } from 'react-helmet-async';
import { site } from '../config/site';

/** LocalBusiness + opening hours JSON-LD — helps Google + AI search engines. */
export function Schema() {
  const dayMap: Record<string, string> = {
    Monday: 'Monday', Tuesday: 'Tuesday', Wednesday: 'Wednesday', Thursday: 'Thursday',
    Friday: 'Friday', Saturday: 'Saturday', Sunday: 'Sunday',
  };
  const hours = site.openingHours
    .filter((h) => h.hours && !/closed/i.test(h.hours))
    .map((h) => {
      const m = h.hours.match(/(\d{1,2}[:.]?\d{0,2})\s*[–-]\s*(\d{1,2}[:.]?\d{0,2})/);
      const norm = (t: string) => {
        const x = t.replace('.', ':');
        return x.includes(':') ? x.padStart(5, '0') : x.padStart(2, '0') + ':00';
      };
      return m && dayMap[h.day]
        ? { '@type': 'OpeningHoursSpecification', dayOfWeek: dayMap[h.day], opens: norm(m[1]), closes: norm(m[2]) }
        : null;
    })
    .filter(Boolean);

  const t = (site.type || '').toLowerCase();
  const schemaType =
    t.includes('hotel') ? 'Hotel'
    : (t.includes('guest') || t.includes('bed') || t.includes('b&b') || t.includes('farm')) ? 'BedAndBreakfast'
    : t.includes('bar') ? 'BarOrPub'
    : (site.food.serves && (site.food.menus?.length ?? 0) >= 2) ? 'Restaurant'
    : 'BarOrPub';

  const data = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: site.name,
    description: site.tagline,
    url: site.siteUrl,
    telephone: site.phone,
    ...(site.email ? { email: site.email } : {}),
    image: site.siteUrl + '/images/' + site.hero,
    priceRange: '££',
    servesCuisine: site.food.serves ? 'British' : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.addressLines[0],
      addressLocality: site.town,
      addressRegion: site.county,
      postalCode: site.postcode,
      addressCountry: 'GB',
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.coordinates.lat, longitude: site.coordinates.lng },
    ...(hours.length ? { openingHoursSpecification: hours } : {}),
    ...(site.rating ? {
      aggregateRating: {
        '@type': 'AggregateRating', ratingValue: site.rating, reviewCount: site.reviewsCount || site.reviews.length,
      },
    } : {}),
    sameAs: Object.values(site.socials).filter(Boolean),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}

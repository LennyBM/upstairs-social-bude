import { site } from '../config/site';

export function OpeningHours({ light = false }: { light?: boolean }) {
  return (
    <div>
      <h3 className={`font-headline text-2xl mb-4 ${light ? 'text-white' : 'text-ink'}`}>Opening Hours</h3>
      <ul className={`divide-y ${light ? 'divide-white/15' : 'divide-line'}`}>
        {site.openingHours.map((h) => (
          <li key={h.day} className="flex justify-between py-2.5 text-sm">
            <span className={light ? 'text-white/70' : 'text-muted'}>{h.day}</span>
            <span className={`font-medium ${light ? 'text-white' : 'text-ink'}`}>{h.hours}</span>
          </li>
        ))}
      </ul>
      {site.hoursNote && <p className={`mt-3 text-xs ${light ? 'text-white/60' : 'text-muted'}`}>{site.hoursNote}</p>}
    </div>
  );
}

export function MapEmbed() {
  return (
    <div className="rounded-xl overflow-hidden border border-line aspect-[4/3] bg-surface">
      <iframe
        title={`Map to ${site.name}`}
        src={site.mapsEmbed}
        className="w-full h-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}

export function USPStrip() {
  return (
    <section className="bg-primary text-contrast">
      <div className="container-x py-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-center">
        {site.usps.slice(0, 4).map((u, i) => (
          <div key={i} className="px-2">
            <p className="text-sm leading-relaxed">{u}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

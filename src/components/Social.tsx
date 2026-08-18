import { site } from '../config/site';
import { whatsappNumber } from '../lib/whatsapp';

/**
 * Social and messaging marks.
 *
 * Three things were wrong before this existed:
 *  · `socials.tripadvisor` is set on all 38 venues and was rendered by nothing.
 *    For a pub or an inn TripAdvisor is often the strongest proof it has, so it
 *    was the single most valuable link in the config and it was invisible.
 *  · `site.whatsapp` is declared on all 38 and empty on all 38, so `<WhatsAppButton>`
 *    and the ActionBar chat slot could never render. Now populated wherever the
 *    venue's own number is a mobile, which is the only case where WhatsApp resolves.
 *  · the marks themselves were two hand-rolled paths in a bare outlined circle.
 *
 * Marks are inline SVG because a strict CSP blocks every external request, and
 * because an icon font would be a second typeface loaded for six glyphs.
 * Each is 48x48 to hold the §14.3 target floor without padding tricks.
 */

type Net = 'facebook' | 'instagram' | 'tripadvisor' | 'whatsapp';

/** Brand colour, used on hover only. At rest the row stays monochrome so it reads
    as one set rather than four competing logos, which is what cheapens a footer. */
const BRAND: Record<Net, string> = {
  facebook: '#1877F2',
  instagram: '#E1306C',
  tripadvisor: '#34E0A1',
  whatsapp: '#25D366',
};

const LABEL: Record<Net, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tripadvisor: 'TripAdvisor',
  whatsapp: 'WhatsApp',
};

function Glyph({ net }: { net: Net }) {
  if (net === 'facebook') {
    return (
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22C18.34 21.24 22 17.08 22 12.06z" />
    );
  }
  if (net === 'instagram') {
    return (
      <>
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38C1.35 2.68.93 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13.67.66 1.34 1.08 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.13-1.38.66-.67 1.08-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.13C21.32 1.35 20.65.93 19.86.63 19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0z" />
        <path d="M12 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
        <circle cx="18.41" cy="5.59" r="1.44" />
      </>
    );
  }
  if (net === 'whatsapp') {
    return (
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.748-.957zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z" />
    );
  }
  /* TripAdvisor's owl, reduced to the part that identifies it: two ringed eyes
     and a beak between them. A first attempt filled the whole head and read as a
     heavy white mask at 20px rather than a bird, so the head is a thin stroke and
     the eyes carry the recognition. Drawn, not traced from their brandmark. */
  return (
    <>
      <ellipse cx="12" cy="12" rx="11" ry="7.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="12" r="1.55" />
      <circle cx="17" cy="12" r="1.55" />
      <path d="M12 10.6l1.5 2.6h-3z" />
    </>
  );
}

function Mark({ net, href }: { net: Net; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${site.shortName} on ${LABEL[net]}`}
      title={LABEL[net]}
      style={{ '--net': BRAND[net] } as React.CSSProperties}
      className="social-mark w-12 h-12 rounded-(--r-full) flex items-center justify-center
                 transition-colors duration-(--dur-fast) ease-inout"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <Glyph net={net} />
      </svg>
    </a>
  );
}

/** The full row. Renders only the networks this venue actually has. */
export function SocialLinks({ className = '' }: { className?: string }) {
  const wa = whatsappNumber();
  const s = site.socials;
  const items: Array<[Net, string]> = [];
  if (s.facebook) items.push(['facebook', s.facebook]);
  if (s.instagram) items.push(['instagram', s.instagram]);
  if (s.tripadvisor) items.push(['tripadvisor', s.tripadvisor]);
  if (wa) items.push(['whatsapp', `https://wa.me/${wa}`]);
  if (!items.length) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map(([net, href]) => <Mark key={net} net={net} href={href} />)}
    </div>
  );
}

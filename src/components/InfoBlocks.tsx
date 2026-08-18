import { useEffect, useState } from 'react';
import { site } from '../config/site';

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ');

/* ══ icons ═══════════════════════════════════════════════════════════════ */
/* Fact and policy rows are icon led (spec §9.4). One 24px stroke set, drawn  */
/* in currentColor so the row owns the colour token, never the glyph.         */

const ICONS = {
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 1.8" /></>,
  pin: <><path d="M12 21s6.5-5.6 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21z" /><circle cx="12" cy="10.5" r="2.4" /></>,
  star: <path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.2 5.7-5.2-3-5.2 3 1.2-5.7-4.3-4 5.8-.7z" />,
  bed: <><path d="M3 19v-9M3 14h18v5M21 19v-5a3 3 0 0 0-3-3h-6v3" /><circle cx="7.5" cy="10.5" r="2" /></>,
  plate: <><path d="M7 3v6.5a2 2 0 0 0 4 0V3M9 9.5V21" /><path d="M17.5 3c-1.2 1.8-1.8 3.7-1.8 5.6h3.6V3zM17.5 8.6V21" /></>,
  paw: <><circle cx="7" cy="9.5" r="1.7" /><circle cx="11" cy="6.8" r="1.7" /><circle cx="15.4" cy="7.6" r="1.7" /><circle cx="18.4" cy="11.4" r="1.7" /><path d="M8.6 15.4c1.6-2 5.2-2.5 7-.8 1.7 1.6.7 4.4-1.6 5-1.7.4-3.7.3-5.2-.5-1.6-.9-1.4-2.5-.2-3.7z" /></>,
  car: <><path d="M4.5 16.5v-3.2l1.7-4.2A2 2 0 0 1 8 7.8h8a2 2 0 0 1 1.8 1.3l1.7 4.2v3.2z" /><path d="M4.5 16.5h15M6.5 16.5v2M17.5 16.5v2" /></>,
  access: <><circle cx="13" cy="4.6" r="1.7" /><path d="M12 8.2v4.3h4.2M12 12.5a4.8 4.8 0 1 0 4.3 6.4M16.2 12.5l2.2 6.4h2.1" /></>,
  kids: <><circle cx="8.5" cy="5.6" r="2" /><path d="M8.5 8.2v6.2M5.8 11l2.7-2 2.7 2M6.6 20.5l1.9-6M10.4 20.5l-1.9-6" /><circle cx="16.8" cy="9.2" r="1.6" /><path d="M16.8 11.2v3.6M15.4 20.5l1.4-5M18.2 20.5l-1.4-5" /></>,
  glass: <><path d="M7.5 3.5h9l-1 15.2a2 2 0 0 1-2 1.8h-3a2 2 0 0 1-2-1.8z" /><path d="M7.9 9.5h8.2" /></>,
  check: <path d="M20 6.5L9.5 17 4.5 12" />,
};

type IconName = keyof typeof ICONS;

/**
 * `tone="inherit"` drops the token and lets the glyph ride `currentColor` from
 * whatever owns the row. Needed anywhere the surface is not the page background:
 * `--text-secondary` is a light-surface token and paints dark on dark.
 */
function Icon({ name, tone = 'secondary' }: { name: IconName; tone?: 'secondary' | 'inherit' }) {
  return (
    <svg
      width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className={cx('shrink-0 mt-0.5', tone === 'secondary' && 'text-secondary')}
    >
      {ICONS[name]}
    </svg>
  );
}

/* ══ opening hours ═══════════════════════════════════════════════════════ */

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Minutes from midnight. `close <= open` means the span runs past midnight. */
type Span = { open: number; close: number };

function parseSpan(hours: string | undefined): Span | null {
  if (!hours || /closed/i.test(hours)) return null;
  const m = hours.match(/(\d{1,2})(?:[:.](\d{2}))?\s*(?:[–—-]|to)\s*(\d{1,2})(?:[:.](\d{2}))?/i);
  if (!m) return null;
  const open = Number(m[1]) * 60 + Number(m[2] ?? 0);
  const close = Number(m[3]) * 60 + Number(m[4] ?? 0);
  if (Number.isNaN(open) || Number.isNaN(close) || open > 1439 || close > 1439) return null;
  return { open, close };
}

/** The hours row governing a given weekday: a named row, a daily row, or a lone row. */
function rowFor(dayIndex: number) {
  const rows = site.openingHours;
  const full = DAYS[dayIndex].toLowerCase();
  const abbr = full.slice(0, 3);
  const named = rows.find((r) => {
    const d = r.day.toLowerCase();
    return d.includes(full) || d.includes(abbr);
  });
  if (named) return named;
  const daily = rows.find((r) => /daily|every ?day|all week|7 days/i.test(r.day));
  if (daily) return daily;
  return rows.length === 1 ? rows[0] : undefined;
}

const fmtTime = (mins: number) =>
  `${String(Math.floor((mins % 1440) / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

export type OpeningStatus = { open: boolean; text: string };

/**
 * Spec §9.4: *Open now until 21:00* or *Closed, opens 12:00 tomorrow*, computed
 * from `openingHours`. Returns `null` when no row parses, which is the defined
 * empty state required by §9.5 — nothing is asserted that the config cannot back.
 */
function computeStatus(now: Date): OpeningStatus | null {
  const mins = now.getHours() * 60 + now.getMinutes();
  const today = parseSpan(rowFor(now.getDay())?.hours);

  if (today) {
    const close = today.close <= today.open ? today.close + 1440 : today.close;
    if (mins >= today.open && mins < close) {
      return { open: true, text: `Open now until ${fmtTime(today.close)}` };
    }
    if (mins < today.open) {
      return { open: false, text: `Closed, opens ${fmtTime(today.open)} today` };
    }
  }

  for (let i = 1; i <= 7; i += 1) {
    const day = (now.getDay() + i) % 7;
    const next = parseSpan(rowFor(day)?.hours);
    if (!next) continue;
    const when = i === 1 ? 'tomorrow' : DAYS[day];
    return { open: false, text: `Closed, opens ${fmtTime(next.open)} ${when}` };
  }

  return null;
}

/** Recomputes each minute so a session that spans a closing time does not go stale. */
function useOpeningStatus(): OpeningStatus | null {
  const [status, setStatus] = useState(() => computeStatus(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setStatus(computeStatus(new Date())), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return status;
}

/**
 * Live open/closed line. Spec §9.4 places it in the fact bar AND in the header on
 * scroll. Never animated: §1.6 forbids animating opening hours.
 *
 * Standalone on purpose, so the second placement costs the caller one import:
 * it owns its clock, takes no required props, reads only `site.openingHours`,
 * and renders nothing at all when no row parses (§9.5 empty state). Mounting it
 * twice is supported and is the intended configuration.
 *
 * `tone="inherit"` is what the header placement needs. `.site-header` drives
 * `--header-fg` — `#fff` over media, `--text-primary` once scrolled — via `color`,
 * so the row must inherit rather than pin `--text-secondary`, which would repeat
 * the dark-on-dark logo bug. Open/closed is then carried by the sentence itself,
 * which is where it should have been: §1.4 and §3 rule out an opacity tint, and
 * colour alone was never a sufficient signal.
 *
 * `live={false}` drops the aria-live region. With two instances mounted, the
 * default would announce the same minute rollover twice.
 */
export function StatusNow({
  className = '',
  tone = 'default',
  live = true,
}: {
  className?: string;
  tone?: 'default' | 'inherit';
  live?: boolean;
}) {
  const status = useOpeningStatus();
  if (!status) return null;
  const inherit = tone === 'inherit';
  return (
    <span role={live ? 'status' : undefined} className={cx('inline-flex items-start gap-2.5', className)}>
      <Icon name="clock" tone={inherit ? 'inherit' : 'secondary'} />
      <span className={cx('t-small nums', !inherit && (status.open ? 'text-text' : 'text-secondary'))}>
        {status.text}
      </span>
    </span>
  );
}

export function OpeningHours({ light = false }: { light?: boolean }) {
  return (
    <div className={light ? 'on-dark' : undefined}>
      <h3 className="t-h3">Opening Hours</h3>
      <ul className={cx('mt-4 divide-y', light ? 'divide-white/15' : 'divide-line')}>
        {site.openingHours.map((h) => (
          <li key={h.day} className="flex justify-between gap-4 py-2.5 t-small">
            <span className={light ? 'text-(color:--text-on-dark-secondary)' : 'text-secondary'}>{h.day}</span>
            <span className={cx('nums', light ? 'text-(color:--text-on-dark)' : 'text-text')}>{h.hours}</span>
          </li>
        ))}
      </ul>
      {site.hoursNote && (
        <p className={cx('mt-3 t-caption', light ? 'text-(color:--text-on-dark-muted)' : 'text-muted')}>
          {site.hoursNote}
        </p>
      )}
    </div>
  );
}

export function MapEmbed() {
  return (
    <div className="well overflow-hidden aspect-[4/3]">
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

/* ══ fact bar ════════════════════════════════════════════════════════════ */

type Fact = { icon: IconName; label: string };

/** Spec §9.4: maximum 5 items, maximum 5 words each. */
const MAX_FACTS = 5;
const MAX_WORDS = 5;

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/**
 * `site.usps` entries only qualify at 5 words or fewer (§14.2 lints this at the
 * config). Longer entries are dropped rather than truncated: half a sentence is
 * worse than no fact.
 */
function suppliedFacts(items?: string[]): Fact[] {
  return (items ?? site.usps)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && wordCount(s) <= MAX_WORDS)
    .map((label) => ({ icon: 'check' as IconName, label }));
}

/** Fallback drawn only from typed config fields, so nothing is asserted loosely. */
function derivedFacts(): Fact[] {
  const facts: Fact[] = [];
  facts.push({ icon: 'pin', label: `${site.town}, ${site.county}` });
  if (site.rating) {
    facts.push({
      icon: 'star',
      label: `Rated ${site.rating} from ${site.reviewsCount || site.reviews.length} reviews`,
    });
  }
  if (site.accommodation.has) facts.push({ icon: 'bed', label: 'Rooms available' });
  if (site.food.serves) facts.push({ icon: 'plate', label: 'Food served' });
  if (site.established) facts.push({ icon: 'check', label: `Established ${site.established}` });
  return facts;
}

/**
 * Spec §9.4. Sits immediately below the hero and carries `<StatusNow>`, which is
 * how opening hours land inside the first 900px on mobile. Was `USPStrip`, which
 * rendered up to four long sentences and wasted the slot.
 */
export function FactBar({ items }: { items?: string[] }) {
  const status = useOpeningStatus();
  const supplied = suppliedFacts(items);
  const pool = supplied.length ? supplied : derivedFacts();
  const facts = pool.slice(0, status ? MAX_FACTS - 1 : MAX_FACTS);
  if (!status && !facts.length) return null;

  return (
    <section className="section-recessed" aria-label="At a glance">
      <div className="container-x py-6 md:py-7">
        <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-5">
          {status && <li><StatusNow /></li>}
          {facts.map((f) => (
            <li key={f.label} className="flex items-start gap-2.5">
              <Icon name={f.icon} />
              <span className="t-small">{f.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ══ policy grid ═════════════════════════════════════════════════════════ */

export type Policy = { icon: IconName; label: string; value: string | null };

/**
 * `null` renders the defined empty state (§9.5): a phone link, so an unanswered
 * question still converts rather than dead-ending.
 */
const haystack = () =>
  [site.accommodation.summary, site.food.summary, site.drinks, ...site.usps]
    .filter(Boolean)
    .join(' · ');

/**
 * A clock time: `9pm`, `9.30pm`, `21:00`. The bare-digit form is deliberately not
 * accepted without either a meridiem or a `:mm`, so `2 courses` and `43" TV` can
 * never be read back as a closing time.
 */
const TIME = String.raw`(\d{1,2}(?:[:.]\d{2})?\s?[ap]\.?m\.?|\d{1,2}[:.]\d{2})`;

const normaliseTime = (raw: string) => {
  const t = raw.trim().toLowerCase();
  const meridiem = t.match(/([ap])\.?m\.?$/);
  const clock = t.replace(/\s*[ap]\.?m\.?$/, '').replace('.', ':');
  return meridiem ? `${clock}${meridiem[1]}m` : clock;
};

/**
 * Quotes a time back only when the config states it in the same clause as the
 * subject — the match window stops at any sentence or list boundary. Nothing is
 * ever inferred from context: no match returns `null` and the row falls to the
 * §9.5 empty state, because a guessed serving cutoff is worse than no cutoff.
 */
function statedTime(subject: string): string | null {
  const m = haystack().match(new RegExp(`(?:${subject})[^.;·|]{0,28}?\\b${TIME}`, 'i'));
  return m ? normaliseTime(m[1]) : null;
}

function derivedPolicies(): Policy[] {
  const hay = haystack();
  const has = (re: RegExp) => re.test(hay);
  return [
    { icon: 'paw', label: 'Dogs', value: has(/pet[- ]friendly|dog[- ]friendly|dogs welcome/i) ? 'Welcome' : null },
    {
      icon: 'car',
      label: 'Parking',
      value: has(/free (on[- ]site )?parking|parking \(free\)/i)
        ? 'Free on site'
        : has(/car park|parking/i) ? 'Nearby' : null,
    },
    { icon: 'access', label: 'Step-free access', value: has(/step[- ]free|level access|wheelchair/i) ? 'Yes' : null },
    { icon: 'kids', label: 'Children', value: has(/family rooms?|children welcome|child[- ]friendly/i) ? 'Welcome' : null },
    { icon: 'glass', label: 'Last orders', value: statedTime(String.raw`last orders`) },
    site.food.serves
      ? {
          icon: 'plate',
          label: 'Kitchen closes',
          value: statedTime(String.raw`kitchen (?:closes|closing|shuts)|food (?:is )?served until|last food orders`),
        }
      // `serves: false` is an explicit statement in the config, not an absence, so
      // it is the one food answer that can be given without a phone call.
      : { icon: 'plate', label: 'Food', value: 'Not served' },
  ];
}

/**
 * Spec §9.4: dogs, parking, step free access, kids, last orders, kitchen closing.
 * Placed on Contact and Home. Each answered here is a phone call the landlord
 * does not have to take; each unanswered one still routes to the phone rather
 * than dead-ending, which is the §9.5 empty state.
 */
export function PolicyGrid({ items, className = '' }: { items?: Policy[]; className?: string }) {
  const policies = items ?? derivedPolicies();
  if (!policies.length) return null;
  return (
    <dl className={cx('grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8', className)}>
      {policies.map((p) => (
        <div key={p.label} className="flex items-start gap-3 py-3.5 border-t border-line">
          <Icon name={p.icon} />
          <div>
            <dt className="t-caption text-muted">{p.label}</dt>
            <dd className="t-small mt-0.5">
              {p.value ?? (
                // Several of these can render at once. Without the label folded in,
                // a screen reader hears "Call to check" three times over.
                //
                // `py-4 -my-4` is a hit area, not spacing: it lifts a 19px `tel:`
                // target to 51px for the §14.3 48px floor while the negative margin
                // keeps the row's own height at 19px, so the grid rhythm is
                // unchanged. Row pitch is 71px, so two stacked hit areas cannot
                // overlap. A resting `underline` rather than `.link-underline`,
                // whose sweep is hover-only and would both sit 32px adrift of the
                // text inside the padded box and never render on touch at all —
                // leaving the one control on the row looking like plain prose.
                <a
                  href={site.phoneHref}
                  className="inline-block underline py-4 -my-4"
                  aria-label={`Call ${site.name} to check ${p.label.toLowerCase()}`}
                >
                  Call to check
                </a>
              )}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

// Single source of truth for a pub site. The generator writes site.ts to match this shape.

export interface NavLink { label: string; to: string; }

export interface OpeningHour { day: string; hours: string; }

export interface MenuItem { name: string; desc?: string; price?: string; }
export interface MenuGroup { title: string; note?: string; items: MenuItem[]; }

/**
 * A CSS `object-position` value for an image reference, e.g. `'50% 35%'`.
 * Spec §10 item 1: focal point per image, default `'50% 50%'`, overridden per venue.
 * Centre crop is why bad photos look catastrophic rather than merely ordinary.
 */
export type Focal = string;

export interface Room { name: string; desc: string; price?: string; image?: string; focal?: Focal; }

export interface SundayLunch { summary?: string; priceFrom?: string; items: MenuItem[]; }
export interface Booking { url?: string; phone?: string; platform?: string; }

export interface PubEvent { name: string; when: string; desc: string; }

export interface Review { quote: string; author: string; source: string; rating: number; }

export interface FaqItem { q: string; a: string; }

export interface Theme {
  /** 'light' = warm cream backgrounds; 'dark' = night-time bar mood */
  mode: 'light' | 'dark';
  primary: string;   // brand colour (buttons, links, accents)
  accent: string;    // secondary highlight
  ink: string;       // main body text
  bg: string;        // page background
  surface: string;   // card background
  contrast: string;  // text colour that sits on top of `primary`
}

/**
 * §1.1 display treatment. `inn` = Newsreader roman h1/h2 (hotels, coaching inns,
 * historic B&Bs). `coast` = Inter (bars, surf, food-led, contemporary venues).
 * Written to `<html data-display="...">`.
 */
export type DisplayTreatment = 'inn' | 'coast';

/**
 * §8 section archetypes A / B and §10 item 4. `anchor` = full-bleed media with the
 * text overlaid. `split` = 7/5 asymmetric with media bleeding off the right edge.
 * `typographic` = the no-photo route for venues whose imagery fails review.
 */
export type HeroArchetype = 'anchor' | 'split' | 'typographic';

/** §11 homepage section sequence. */
export type HomeOrder = 'rooms-led' | 'food-led' | 'locals-led';

/**
 * §11 variation axis. Three selectors, assigned per venue, that stop 38 sites with
 * identical layout grammar reading as clones.
 * Rule: no two venues in the same town may share the same `display` + `order` pair.
 */
export interface SiteDesign {
  display: DisplayTreatment;
  hero: HeroArchetype;
  order: HomeOrder;
}

export interface SiteConfig {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  intro: string;            // hero sub-paragraph
  type: string;             // 'Pub' | 'Inn' | 'Bar' | 'Hotel'
  established?: string;      // e.g. "2017" or "Tudor era"
  siteUrl: string;

  // contact
  addressLines: string[];
  town: string;
  county: string;
  postcode: string;
  phone: string;
  phoneHref: string;
  email?: string;
  coordinates: { lat: number; lng: number };
  mapsLink: string;
  mapsEmbed: string;

  socials: {
    facebook?: string;
    instagram?: string;
    tripadvisor?: string;
    other?: string;
  };

  // rating snapshot for trust badges
  rating?: number;
  reviewsCount?: number;
  awards?: string[];

  openingHours: OpeningHour[];
  hoursNote?: string;

  /**
   * §9.4 `<NoticeBanner>`: one short line, dismissible, under the header
   * ("Kitchen closed this Tuesday"). Volatile field per §9.5 — omitted or empty
   * renders nothing, which is the defined empty state.
   */
  notice?: string;

  history: string[];        // paragraphs for the story page
  usps: string[];           // short selling points

  food: {
    serves: boolean;
    summary?: string;
    menus?: MenuGroup[];
  };
  sundayLunch?: SundayLunch | null;
  booking?: Booking | null;
  whatsapp?: string;
  drinks?: string;

  accommodation: {
    has: boolean;
    summary?: string;
    rooms?: Room[];
  };

  events: PubEvent[];
  reviews: Review[];
  faqs: FaqItem[];

  images: string[];         // filenames in /images (gallery)
  hero: string;             // hero image filename
  featured: string[];       // 3 images used in home highlights
  videoUrls?: string[];

  /**
   * §10 item 1. `object-position` per image reference, keyed by the filename used in
   * `images` / `hero` / `featured` / `rooms[].image`. Any filename absent from this
   * map falls back to `'50% 50%'`.
   * Precedence for a room card: `room.focal` → `focal[room.image]` → `'50% 50%'`.
   */
  focal?: Record<string, Focal>;

  /** §10 item 1. Focal point for the hero crop. Wins over `focal[hero]`. */
  heroFocal?: Focal;

  /** §11 variation axis: display treatment, hero archetype, homepage order. */
  design: SiteDesign;

  theme: Theme;
  seoKeywords: string[];

  // which sections/pages are enabled (derived but explicit for clarity)
  pages: {
    food: boolean;
    rooms: boolean;
    whatsOn: boolean;
    gallery: boolean;
    sundayLunch: boolean;
    book: boolean;
  };
}

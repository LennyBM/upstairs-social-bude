// Single source of truth for a pub site. The generator writes site.ts to match this shape.

export interface NavLink { label: string; to: string; }

export interface OpeningHour { day: string; hours: string; }

export interface MenuItem { name: string; desc?: string; price?: string; }
export interface MenuGroup { title: string; note?: string; items: MenuItem[]; }

export interface Room { name: string; desc: string; price?: string; image?: string; }

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

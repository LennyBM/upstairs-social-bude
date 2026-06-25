import { site } from '../config/site';
import { SEO } from '../components/SEO';
import { PageHero } from '../components/PageHero';

type Kind = 'privacy' | 'terms' | 'cookies' | 'accessibility';

const TITLES: Record<Kind, string> = {
  privacy: 'Privacy Policy', terms: 'Terms & Conditions',
  cookies: 'Cookie Policy', accessibility: 'Accessibility Statement',
};

export function Legal({ kind }: { kind: Kind }) {
  return (
    <>
      <SEO title={`${TITLES[kind]} | ${site.name}`} description={`${TITLES[kind]} for ${site.name}, ${site.town}.`} path={`/${kind}`} />
      <PageHero title={TITLES[kind]} sub={site.name} />
      <section className="section">
        <div className="container-x max-w-3xl prose-pub space-y-4 text-ink/85 leading-relaxed">
          {kind === 'privacy' && <Privacy />}
          {kind === 'terms' && <Terms />}
          {kind === 'cookies' && <Cookies />}
          {kind === 'accessibility' && <Accessibility />}
          <p className="text-sm text-muted pt-6">Last updated: 2026. This policy is provided as part of a website demonstration and should be reviewed by {site.name} before going live.</p>
        </div>
      </section>
    </>
  );
}

const H = ({ children }: { children: React.ReactNode }) => <h2 className="font-headline text-2xl text-ink mt-8 mb-2">{children}</h2>;

function Privacy() {
  return (
    <>
      <p>{site.name} ("we", "us") is committed to protecting your privacy and handling your data in line with the UK GDPR and the Data Protection Act 2018.</p>
      <H>Information we collect</H>
      <p>If you contact us by phone or email, we collect the details you provide (such as your name, contact details and the content of your enquiry) solely to respond to you and manage any booking.</p>
      <H>How we use your information</H>
      <p>We use your information to respond to enquiries, manage reservations, and meet our legal obligations. We do not sell your data to third parties.</p>
      <H>Cookies & analytics</H>
      <p>This website uses essential cookies to function and may use optional analytics cookies to understand how visitors use the site. See our Cookie Policy for details.</p>
      <H>Your rights</H>
      <p>You have the right to access, correct or request deletion of your personal data. To exercise these rights, contact us at <a className="text-primary underline" href={site.email ? `mailto:${site.email}` : site.phoneHref}>{site.email || site.phone}</a>.</p>
      <H>Contact</H>
      <p>{site.name}, {site.addressLines.join(', ')}, {site.town}, {site.county} {site.postcode}. Tel: {site.phone}.</p>
    </>
  );
}

function Terms() {
  return (
    <>
      <H>Use of this website</H>
      <p>By using this website you agree to these terms. Content is provided for general information about {site.name} and may change without notice.</p>
      <H>Bookings & reservations</H>
      <p>Table and room reservations are subject to availability and confirmation by us. Please contact us directly on {site.phone} to make or amend a booking.</p>
      <H>Accuracy</H>
      <p>We aim to keep information (including menus, prices, opening hours and events) accurate and up to date, but these are subject to change. Please call ahead to confirm.</p>
      <H>Liability</H>
      <p>We accept no liability for any loss arising from reliance on the information on this website to the fullest extent permitted by law.</p>
      <H>Governing law</H>
      <p>These terms are governed by the laws of England and Wales.</p>
    </>
  );
}

function Cookies() {
  return (
    <>
      <p>This website uses cookies to make the site work and to improve your experience.</p>
      <H>Essential cookies</H>
      <p>These are required for the website to function (for example, remembering your cookie preferences). They cannot be switched off.</p>
      <H>Analytics cookies</H>
      <p>With your consent, we may use analytics cookies to understand how visitors interact with the site so we can improve it. You can decline these using the cookie banner.</p>
      <H>Managing cookies</H>
      <p>You can clear or block cookies at any time through your browser settings. Doing so may affect how the website works.</p>
    </>
  );
}

function Accessibility() {
  return (
    <>
      <p>{site.name} is committed to making this website accessible to as many people as possible, in line with WCAG 2.2 AA guidance.</p>
      <H>What we do</H>
      <p>We aim for clear, readable text, sufficient colour contrast, keyboard navigation, descriptive alt text on images, and a layout that works across devices and screen sizes.</p>
      <H>Need help?</H>
      <p>If you have difficulty using any part of this website, or need information in a different format, please call us on <a className="text-primary underline" href={site.phoneHref}>{site.phone}</a> and we'll be happy to help.</p>
    </>
  );
}

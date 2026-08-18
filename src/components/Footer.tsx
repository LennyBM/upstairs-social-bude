import { Link } from 'react-router-dom';
import { site, navLinks } from '../config/site';
import { SocialLinks } from './Social';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="on-dark bg-footer">
      {/*
        Two columns on mobile, not one. The four blocks stacked to a 1,900px
        footer on a 390px screen: seven nav rows at the 48px floor alone are
        336px, and the hours list is seven more. Paired side by side, the
        column count carries what the scroll used to. The brand block still
        spans the full width because a tagline reads badly in a half column.
      */}
      <div className="container-x py-16 grid gap-x-6 gap-y-10 grid-cols-2 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <p className="logotype t-h3">{site.name}</p>
          <p className="mt-3 t-small text-(color:--text-on-dark-secondary)">{site.tagline}</p>
          {site.rating && (
            <p className="mt-4 t-small text-(color:--text-on-dark-secondary)">
              ★ <span className="nums">{site.rating}</span> · <span className="nums">{site.reviewsCount}</span>+ reviews
            </p>
          )}
        </div>

        <div>
          <h3 className="eyebrow on-dark mb-4">Explore</h3>
          {/*
            §14.3 48px floor. These seven links measured 19px each, and unlike a
            lone `tel:` in a wide row they STACK, so the `py-4 -my-4` idiom used
            elsewhere in the estate is wrong here: a 48px hit box on a 29.75px
            row pitch would overlap its neighbour by 18px and a thumb aimed at
            the bottom of "Menu" would open "Stay". Where targets stack, the
            pitch has to carry the hit box, so the row IS the target — `min-h-12`
            for the floor, `space-y-2` removed so pitch and hit box are both 48
            and adjacent rows touch without overlapping. The link is a block, so
            the full column width is live and a thumb landing beside a short
            label ("Stay" is 31px of text) still lands on the link.
            Deliberate consequence: this column grows 200px → 336px.
          */}
          <ul className="t-small text-(color:--text-on-dark-secondary)">
            {navLinks.map((l) => (
              <li key={l.to}><Link to={l.to} className="flex items-center min-h-12 hover:text-(color:--text-on-dark) transition-colors duration-(--dur-fast) ease-inout">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow on-dark mb-4">Find Us</h3>
          <address className="not-italic t-small space-y-1 text-(color:--text-on-dark-secondary)">
            {site.addressLines.map((l) => <div key={l}>{l}</div>)}
            <div>{site.town}, {site.county}</div>
            <div>{site.postcode}</div>
          </address>
          {/*
            The estate's primary conversion, and it measured 342 x 21.75px. The
            phone and the mail link stack directly on one another wherever a
            config sets `email`, so again the hit box has to be the row,
            not padding hung off a 22px line: `min-h-12` makes each a 48px row
            that sits flush against its neighbour instead of eating into it.
            The old `mt-3` is gone because the row's own 13px of internal space
            above the number replaces it, and `mt-4` under the icons becomes
            `mt-0.5` for the same reason. Both numbers are measured, not
            guessed: the gap from the address to the number reads 13.00 → 14.13
            and the gap from the number to the icons 17.75 → 16.88, so nothing
            in this column moves by more than 1.2px.
          */}
          <a href={site.phoneHref} className="flex items-center min-h-12 t-small nums hover:underline">{site.phone}</a>
          {site.email && <a href={`mailto:${site.email}`} className="flex items-center min-h-12 t-small text-(color:--text-on-dark-secondary) hover:underline break-all">{site.email}</a>}
          {/* §11 of nobody's spec: the TripAdvisor link is set on all 38 venues and
              was rendered by nothing. For a pub it is often the strongest proof it
              has. WhatsApp joins the row wherever the venue's number is a mobile. */}
          <SocialLinks className="mt-0.5" />
        </div>

        {/*
          Full width on mobile, one column from md. In a half-width mobile cell
          every row wrapped: "Monday 07:30-" then "21:00" on its own line, seven
          times. Opening hours are the most-read thing in a pub footer, so the
          twin grid pays for itself on the nav and address columns and gives this
          one its width back. `whitespace-nowrap` stops the en dash offering a
          break point inside a single time range.
        */}
        <div className="col-span-2 md:col-span-1">
          <h3 className="eyebrow on-dark mb-4">Opening Hours</h3>
          <ul className="space-y-1 t-small text-(color:--text-on-dark-secondary)">
            {site.openingHours.map((h) => (
              <li key={h.day} className="flex justify-between gap-3">
                <span>{h.day}</span>
                <span className="nums text-(color:--text-on-dark) whitespace-nowrap">{h.hours}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x py-6 flex flex-col md:flex-row items-center justify-between gap-4 t-caption text-(color:--text-on-dark-muted)">
          <p>© <span className="nums">{year}</span> {site.name}. All rights reserved.</p>
          {/*
            These four measured 18.19px tall and 39-79px wide. They sit SIDE BY
            SIDE, so here the padding-plus-negative-margin idiom is the right
            one: `py-4 -my-4` lifts each to 50.19px while the row keeps its
            18.19px height, and `px-2` against a zero column gap lifts the two
            narrow ones over 48px wide while leaving the visual gap between
            labels at the 16px it already was. `-mx-2` on the wrapper puts the
            outer text edges back where they were, so nothing moves. The parent
            gap goes 3 → 4 (12px → 16px) so the taller boxes stop flush against
            the copyright line instead of 4px inside it. `gap-y-8` is insurance:
            these labels fit one row at 390px with 78px to spare today, but if a
            future config ever wrapped them, 32px of row gap is exactly the two
            16px paddings, so wrapped rows would touch and never overlap.
          */}
          <div className="flex flex-wrap gap-y-8 -mx-2">
            <Link to="/privacy" className="px-2 py-4 -my-4 hover:text-(color:--text-on-dark)">Privacy</Link>
            <Link to="/terms" className="px-2 py-4 -my-4 hover:text-(color:--text-on-dark)">Terms</Link>
            <Link to="/cookies" className="px-2 py-4 -my-4 hover:text-(color:--text-on-dark)">Cookies</Link>
            <Link to="/accessibility" className="px-2 py-4 -my-4 hover:text-(color:--text-on-dark)">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { Link } from "react-router-dom";

const CONTACT_EMAIL = "info@glueckengineering.com";

const SERVICE_LINKS = [
  { to: "/service", label: "3D-Druck Dienstleistung" },
  { to: "/fertigteile", label: "Fertigteile" },
  { to: "/artworks", label: "3D-Artworks" },
  { to: "/materialien", label: "Material-Guide" },
];

const INFO_LINKS = [
  { to: "/faq", label: "Häufige Fragen" },
  { to: "/impressum", label: "Impressum" },
  { to: "/datenschutz", label: "Datenschutz" },
  { to: "/agb", label: "AGB & Widerruf" },
];

function LinkColumn({ title, links }) {
  return (
    <nav aria-label={title}>
      <h2 className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-neutral-300">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="text-sm text-neutral-400 transition hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-neutral-800/80 sm:mt-28">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 sm:pb-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr] lg:gap-x-8">
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-3">
              <img
                src="/logo.webp"
                alt=""
                width="40"
                height="40"
                loading="lazy"
                className="h-10 w-10 object-contain opacity-90"
              />
              <span className="font-display text-lg font-semibold tracking-tight text-white">Glück Engineering</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-400">
              Fertigteile, technischer 3D-Druck und mehrschichtige 3D-Artworks aus einer Hand.
            </p>
          </div>

          <LinkColumn title="Leistungen" links={SERVICE_LINKS} />
          <LinkColumn title="Informationen" links={INFO_LINKS} />

          <div className="col-span-2 lg:col-span-1">
            <h2 className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-neutral-300">Kontakt</h2>
            <address className="mt-4 space-y-2.5 text-sm not-italic text-neutral-400">
              <div className="text-neutral-300">M.Eng. Werner Glück</div>
              <div>94424 Arnstorf, Niederbayern</div>
              <a href={`mailto:${CONTACT_EMAIL}`} className="inline-block text-accent transition hover:text-accent-light">
                {CONTACT_EMAIL}
              </a>
            </address>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-neutral-900 pt-6 text-xs text-neutral-450 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Glück Engineering · Inhaber M.Eng. Werner Glück</span>
          <span>Gefertigt in Niederbayern</span>
        </div>
      </div>
    </footer>
  );
}

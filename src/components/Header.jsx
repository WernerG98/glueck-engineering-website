import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

function navClassName({ isActive }) {
  return [
    "w-full rounded-lg border px-5 py-2.5 text-center text-sm font-medium transition md:w-auto",
    isActive
      ? "border-accent bg-neutral-800/80 text-white"
      : "border-transparent text-neutral-400 hover:border-neutral-800 hover:bg-neutral-900 hover:text-white",
  ].join(" ");
}

export default function Header({ onOpenContactModal }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleContactClick = () => {
    setMenuOpen(false);
    onOpenContactModal("Allgemeine Anfrage", "general");
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 border-b border-neutral-800/80 px-4 py-4 sm:px-6 md:py-5">
        <Link to="/" className="flex items-center gap-3 sm:gap-4" onClick={() => setMenuOpen(false)}>
          <img
            src="/logo.png"
            alt="Glück Engineering Logo"
            className="h-12 w-12 object-contain sm:h-14 sm:w-14 md:h-16 md:w-16"
          />
          <span className="text-lg font-semibold tracking-tight text-white sm:text-xl md:text-2xl">
            Glück Engineering
          </span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <NavLink to="/" className={navClassName} end>
            Startseite
          </NavLink>

          <NavLink to="/service" className={navClassName}>
            3D-Druck
          </NavLink>

          <NavLink to="/fertigteile" className={navClassName}>
            Fertigteile
          </NavLink>

          <NavLink to="/artworks" className={navClassName}>
            3D-Artworks
          </NavLink>

          <NavLink to="/materialien" className={navClassName}>
            Materialien
          </NavLink>

          <button
            onClick={handleContactClick}
            className="ml-2 rounded-lg bg-accent px-5 py-2.5 text-center text-sm font-medium text-neutral-950 transition hover:bg-accent-light"
          >
            Kontakt
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 text-neutral-300 transition hover:bg-neutral-900 md:hidden"
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="border-b border-neutral-800/80 px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-2 pt-1">
            <NavLink to="/" className={navClassName} end onClick={() => setMenuOpen(false)}>
              Startseite
            </NavLink>

            <NavLink to="/service" className={navClassName} onClick={() => setMenuOpen(false)}>
              3D-Druck
            </NavLink>

            <NavLink to="/fertigteile" className={navClassName} onClick={() => setMenuOpen(false)}>
              Fertigteile
            </NavLink>

            <NavLink to="/artworks" className={navClassName} onClick={() => setMenuOpen(false)}>
              3D-Artworks
            </NavLink>

            <NavLink to="/materialien" className={navClassName} onClick={() => setMenuOpen(false)}>
              Materialien
            </NavLink>

            <button
              onClick={handleContactClick}
              className="w-full rounded-lg bg-accent px-5 py-2.5 text-center text-sm font-medium text-neutral-950 transition hover:bg-accent-light"
            >
              Kontakt
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

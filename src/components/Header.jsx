import { Link, NavLink } from "react-router-dom";
import StatusBanner from "./StatusBanner";

function navClassName({ isActive }) {
  return [
    "w-full rounded-lg border px-5 py-2.5 text-center text-sm font-medium transition md:w-auto",
    isActive
      ? "border-neutral-700 bg-neutral-800/80 text-white"
      : "border-transparent text-neutral-400 hover:border-neutral-800 hover:bg-neutral-900 hover:text-white",
  ].join(" ");
}

export default function Header({ onOpenContactModal }) {
  return (
    <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md">
      <StatusBanner />
      <div className="mx-auto flex max-w-7xl flex-col gap-4 border-b border-neutral-800/80 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between md:py-5">
        <Link to="/" className="flex items-center gap-3 sm:gap-4">
          <img
            src="/logo.png"
            alt="Glück Engineering Logo"
            className="h-12 w-12 object-contain sm:h-14 sm:w-14 md:h-16 md:w-16"
          />
          <span className="text-lg font-semibold tracking-tight text-white sm:text-xl md:text-2xl">
            Glück Engineering
          </span>
        </Link>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <NavLink to="/" className={navClassName} end>
            Startseite
          </NavLink>

          <NavLink to="/fertigteile" className={navClassName}>
            Fertigteile
          </NavLink>

          <NavLink to="/artworks" className={navClassName}>
            3D-Artworks
          </NavLink>

          <button
            onClick={() => onOpenContactModal("Allgemeine Anfrage", "general")}
            className="w-full rounded-lg bg-white px-5 py-2.5 text-center text-sm font-medium text-neutral-950 transition hover:bg-neutral-200 md:ml-2 md:w-auto"
          >
            Kontakt
          </button>
        </div>
      </div>
    </header>
  );
}

import { Link } from "react-router-dom";
import Reveal from "../Reveal";

export default function FertigteileTeaserSection() {
  return (
    <section className="mt-16 sm:mt-20 md:mt-24">
      <Reveal className="grid gap-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:gap-8 sm:p-8 md:grid-cols-2 md:items-center md:p-10">
        <div className="text-left">
          <span className="eyebrow">Produkte</span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Fertigteile</h2>

          <p className="mt-4 text-sm leading-relaxed text-neutral-400 sm:text-base">
            Passgenaue Ersatz- und Zubehörteile für ausgewählte Fahrzeuge, direkt ab Lager fertigbar.
            <br />
            <br />
            Auf der eigenen Fertigteile-Seite gibt es die komplette Übersicht mit allen aktuell
            verfügbaren Teilen.
          </p>

          <div className="mt-8">
            <Link
              to="/fertigteile"
              className="inline-block rounded-lg bg-accent px-6 py-3 text-center font-medium text-neutral-950 transition hover:bg-accent-light"
            >
              Alle Fertigteile ansehen
            </Link>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-neutral-800">
          <img
            src="/Heckklappenaussteller_T4_T5_T6.png"
            alt="VW T4/T5/T6 Heckklappenaussteller"
            className="h-64 w-full object-cover transition duration-700 ease-out group-hover:scale-105 sm:h-80 md:h-full"
          />
        </div>
      </Reveal>
    </section>
  );
}

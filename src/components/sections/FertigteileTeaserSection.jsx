import { Link } from "react-router-dom";
import Reveal from "../Reveal";
import ModelViewer from "../ModelViewer";

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

        <div className="relative h-64 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 sm:h-80 md:h-full">
          <ModelViewer src="/models/heckklappenaussteller-t4-t5-t6.stl" format="stl" />
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-neutral-950/80 px-3 py-1.5 text-xs font-medium text-neutral-300 backdrop-blur-sm">
            VW T4/T5/T6 Heckklappenaussteller · 3D-Vorschau
          </span>
        </div>
      </Reveal>
    </section>
  );
}

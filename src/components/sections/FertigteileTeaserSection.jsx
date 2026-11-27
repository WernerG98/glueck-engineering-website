import { Link } from "react-router-dom";
import Reveal from "../Reveal";
import ModelViewer from "../ModelViewer";
import fertigteile from "../../data/fertigteile";

// Vorschau: die ersten vier Teile, mit 3D-Modell als Standbild (sonst Foto)
const PREVIEW = fertigteile.filter((item) => item.model || item.image).slice(0, 4);

export default function FertigteileTeaserSection() {
  return (
    <section className="mt-16 sm:mt-20 md:mt-24">
      <Reveal>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <span className="eyebrow">Produkte</span>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Fertigteile</h2>
            <p className="mt-4 text-base leading-relaxed text-neutral-300">
              Passgenaue Ersatz- und Zubehörteile für ausgewählte Fahrzeuge, direkt ab Lager fertigbar.
            </p>
          </div>

          <Link
            to="/fertigteile"
            className="group inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-neutral-700 px-5 py-2.5 text-sm font-medium transition hover:border-neutral-500 hover:bg-neutral-900 md:self-auto"
          >
            Alle {fertigteile.length} Fertigteile ansehen
            <svg viewBox="0 0 24 24" className="h-4 w-4 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-6-6m6 6l-6 6" />
            </svg>
          </Link>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {PREVIEW.map((item) => (
            <li key={item.id}>
              <Link
                to="/fertigteile"
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70 backdrop-blur-md transition hover:border-neutral-600"
              >
                <div className="aspect-square overflow-hidden bg-neutral-950 transition duration-700 ease-out group-hover:scale-105">
                  {item.studio ? (
                    <img src={item.studio.image} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : item.model ? (
                    <ModelViewer src={item.model.src} format={item.model.format} interactive={false} />
                  ) : (
                    <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-450">
                    {item.vehicles.join(" · ")}
                  </span>
                  <span className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-neutral-100">{item.name}</span>
                  <span className="mt-auto pt-3 font-display text-lg font-semibold text-accent">{item.price}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

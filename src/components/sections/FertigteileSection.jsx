import { useState } from "react";
import Reveal from "../Reveal";
import ModelViewer from "../ModelViewer";
import TiltCard from "../TiltCard";
import { useMerkzettel } from "../../context/MerkzettelContext";

const VIEW_LABELS = { studio: "Studio", "3d": "3D", foto: "Foto" };

function FertigteilCard({ item, onRequest }) {
  const hasModel = Boolean(item.model);
  const views = [item.studio && "studio", hasModel && "3d", item.image && "foto"].filter(Boolean);
  // Studio-Ansicht ist Standard (lädt schnell), 3D-Modell und Foto per Umschalter
  const [view, setView] = useState(views[0] || null);
  const show3D = view === "3d";
  const { isSaved, toggleItem } = useMerkzettel();
  const saved = isSaved(item.id);

  return (
    <TiltCard
      disabled={show3D}
      className="flex h-full flex-col rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 transition hover:border-neutral-700 sm:p-6"
    >
      <div className="group relative aspect-square overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
        <button
          type="button"
          onClick={() => toggleItem(item)}
          aria-label={saved ? "Von Merkzettel entfernen" : "Zum Merkzettel hinzufügen"}
          aria-pressed={saved}
          className={`absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition ${
            saved ? "bg-accent text-neutral-950" : "bg-neutral-950/80 text-white hover:bg-neutral-900"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h12v17l-6-4-6 4z" />
          </svg>
        </button>

        {view === "studio" ? (
          // Studio-Rendering aus Blender (blender/fertigteile_render.py)
          <img
            src={item.studio.image}
            alt={`${item.name} – Studioaufnahme`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
          />
        ) : show3D && hasModel ? (
          <ModelViewer src={item.model.src} format={item.model.format} />
        ) : item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-950">
            <span className="text-base font-semibold uppercase tracking-[0.2em] text-neutral-450 sm:text-lg">
              Coming soon
            </span>
          </div>
        )}

        {show3D && hasModel && (
          <span className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-neutral-950/70 px-2.5 py-1 text-[11px] font-medium text-neutral-300 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" />
            </svg>
            Ziehen zum Drehen
          </span>
        )}

        {views.length > 1 && (
          <div
            role="group"
            aria-label="Ansicht wählen"
            className="absolute bottom-3 left-3 z-10 flex gap-1 rounded-xl border border-neutral-700 bg-neutral-950/80 p-1 backdrop-blur-sm"
          >
            {views.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  view === v ? "bg-accent text-neutral-950" : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex flex-wrap gap-1.5">
          {item.vehicles.map((vehicle) => (
            <span
              key={vehicle}
              className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-accent"
            >
              {vehicle}
            </span>
          ))}
        </div>
        <h3 className="mt-3 text-base font-medium leading-snug text-white sm:text-lg">{item.name}</h3>
        <p className="mt-2 font-display text-2xl font-semibold text-accent">{item.price}</p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-300">{item.text}</p>

        <div className="mt-auto pt-6">
          <button
            onClick={() => onRequest(item.name, "product")}
            className="w-full rounded-lg border border-neutral-700 py-3 text-center text-sm font-medium transition hover:border-neutral-500 hover:bg-neutral-800"
          >
            Anfrage senden
          </button>
        </div>
      </div>
    </TiltCard>
  );
}

export default function FertigteileSection({ items, onRequest, showHeading = true }) {
  return (
    <section className="mt-16 sm:mt-20 md:mt-24">
      {showHeading && (
        <Reveal>
          <span className="eyebrow">Produkte</span>
          <h2 className="mb-6 mt-2 text-2xl font-semibold tracking-tight sm:mb-8 sm:text-3xl">Fertigteile</h2>
        </Reveal>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={item.id || `${item.name}-${index}`} delay={index * 100} className="h-full">
            <FertigteilCard item={item} onRequest={onRequest} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

import { useState } from "react";
import Reveal from "../Reveal";
import ModelViewer from "../ModelViewer";
import TiltCard from "../TiltCard";
import { useMerkzettel } from "../../context/MerkzettelContext";

function FertigteilCard({ item, onRequest }) {
  const [show3D, setShow3D] = useState(false);
  const hasModel = Boolean(item.model);
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

        {show3D && hasModel ? (
          <ModelViewer src={item.model.src} format={item.model.format} />
        ) : item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-950">
            <span className="text-base font-semibold uppercase tracking-[0.2em] text-neutral-500 sm:text-lg">
              Coming soon
            </span>
          </div>
        )}

        {hasModel && (
          <button
            type="button"
            onClick={() => setShow3D((v) => !v)}
            className="absolute bottom-3 right-3 rounded-full bg-neutral-950/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-neutral-900"
          >
            {show3D ? "Foto ansehen" : "In 3D ansehen"}
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="text-base text-neutral-200 sm:text-lg">{item.name}</h3>
        <p className="mt-2 text-lg font-semibold text-white">{item.price}</p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">{item.text}</p>

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

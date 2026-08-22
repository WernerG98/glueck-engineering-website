import { useState } from "react";
import Reveal from "../Reveal";
import BeforeAfterSlider from "../BeforeAfterSlider";

const steps = [
  {
    title: "Übermittlung von Bild und Wünschen",
    description: "Das Motiv wird als JPG, PNG, WEBP oder SVG übermittelt, zusammen mit folgenden Angaben:",
    bullets: ["Schwarz-Weiß oder Farbe", "Gewünschte Abmessungen", "Rahmen gewünscht oder nicht", "Rahmenfarbe", "Anzahl"],
  },
  {
    title: "Prüfung der Angaben und Vorabentwurf",
    description:
      "Auf Basis der Angaben wird die Umsetzbarkeit geprüft; vor dem Druck wird ein Vorabentwurf inklusive Preis zugesendet. So ist bereits vorab erkennbar, wie das spätere Artwork aussehen wird.",
    image: "/Artwork_Stanced_E46_6.png",
    imageAlt: "Vorabentwurf des Artworks",
  },
  {
    title: "Freigabe des Angebots",
    description: "Erst nach Zustimmung zu Entwurf und Preis wird das Angebot bestätigt. Vorher wird nichts produziert.",
  },
  {
    title: "Fertigung und Versand",
    description:
      "Nach erfolgter Freigabe wird das Produkt gefertigt und anschließend sorgfältig verpackt versendet. So wird aus dem Entwurf ein echtes Artwork:",
    beforeAfter: {
      beforeSrc: "/Artwork_Stanced_E46_6.png",
      afterSrc: "/Artwork_E46_Ergebnis.jpg",
      beforeLabel: "Entwurf",
      afterLabel: "Fertig gedruckt",
    },
  },
];

export default function ArtworksProcessSection() {
  const [activeStep, setActiveStep] = useState(0);
  const step = steps[activeStep];

  return (
    <section id="ablauf-artworks" className="mt-16 sm:mt-20 md:mt-24">
      <Reveal>
        <span className="eyebrow">Ablauf</span>
        <h2 className="mb-6 mt-2 text-2xl font-semibold tracking-tight sm:mb-8 sm:text-3xl">
          Ablauf für individuelle 3D-Artworks
        </h2>
      </Reveal>

      <Reveal className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          {steps.map((s, index) => (
            <button
              key={s.title}
              onClick={() => setActiveStep(index)}
              className={[
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition sm:px-4",
                index === activeStep
                  ? "border-neutral-700 bg-neutral-800/80 text-white"
                  : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
                  index === activeStep ? "border-white" : "border-neutral-600",
                ].join(" ")}
              >
                {index + 1}
              </span>
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 border-t border-neutral-800 pt-6">
          <h3 className="text-lg font-semibold sm:text-xl">{step.title}</h3>
          <p className="mt-3 text-sm text-neutral-400 sm:text-base">{step.description}</p>

          {step.bullets && (
            <div className="mt-4 space-y-2 text-sm text-neutral-300 sm:text-base">
              {step.bullets.map((bullet) => (
                <p key={bullet}>• {bullet}</p>
              ))}
            </div>
          )}

          {step.image && (
            <div className="mt-6 flex justify-center">
              <div className="group w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800">
                <img
                  src={step.image}
                  alt={step.imageAlt}
                  className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                />
              </div>
            </div>
          )}

          {step.beforeAfter && (
            <div className="mt-6 flex justify-center">
              <div className="w-full max-w-md">
                <BeforeAfterSlider
                  beforeSrc={step.beforeAfter.beforeSrc}
                  afterSrc={step.beforeAfter.afterSrc}
                  beforeLabel={step.beforeAfter.beforeLabel}
                  afterLabel={step.beforeAfter.afterLabel}
                />
                <p className="mt-3 text-center text-xs text-neutral-500">Zum Vergleichen ziehen</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
              disabled={activeStep === 0}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm transition hover:border-neutral-500 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Zurück
            </button>
            <button
              onClick={() => setActiveStep((s) => Math.min(steps.length - 1, s + 1))}
              disabled={activeStep === steps.length - 1}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm transition hover:border-neutral-500 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Weiter
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

import { useState } from "react";
import Reveal from "../Reveal";
import ProcessStations from "../ProcessStations";

const steps = [
  {
    title: "Datei einreichen oder Idee schildern",
    description:
      "Bei einer bereits fertigen Datei genügt die Übermittlung des Modells. Sonst reicht eine Beschreibung der Idee, von der Konstruktion bis zur Optimierung wird gemeinsam erarbeitet, was gebraucht wird.",
  },
  {
    title: "Technische Beratung & Angebot",
    description:
      "Prüfung der Machbarkeit sowie Auswahl des passenden Werkstoffs hinsichtlich mechanischer Belastung, Temperaturbeständigkeit und Umgebungsbedingungen wie UV-Einwirkung oder Feuchtigkeit. Anschließend gibt es ein Angebot mit Materialempfehlung.",
  },
  {
    title: "Freigabe des Angebots",
    description: "Erst nach Zustimmung zu Angebot und Preis wird produziert. Vorher wird nichts gefertigt.",
  },
  {
    title: "Fertigung & Versand",
    description: "Nach der Freigabe wird das Bauteil gedruckt, geprüft, sorgfältig verpackt und versendet.",
  },
];

export default function ServiceProcessSection() {
  const [activeStep, setActiveStep] = useState(0);
  const step = steps[activeStep];

  return (
    <section id="ablauf-service" className="mt-16 sm:mt-20 md:mt-24">
      <Reveal>
        <span className="eyebrow">Fertigungsbegleitschein</span>
        <h2 className="mb-6 mt-2 text-2xl font-semibold tracking-tight sm:mb-8 sm:text-3xl">
          Ablauf der 3D-Druck Dienstleistung
        </h2>
      </Reveal>

      <Reveal className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 bg-neutral-950/40 px-6 py-3 sm:px-8">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-neutral-500">
            Fertigungsbegleitschein
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-neutral-500">
            Station {String(activeStep + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
          </span>
        </div>

        <ProcessStations steps={steps} activeStep={activeStep} onSelect={setActiveStep} />

        <div className="border-t border-neutral-800 px-6 py-6 sm:px-8 sm:py-8">
          <h3 className="text-lg font-semibold sm:text-xl">{step.title}</h3>
          <p className="mt-3 text-sm text-neutral-400 sm:text-base">{step.description}</p>

          {step.image && (
            <div className="mt-6 flex justify-center">
              <div className="group w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800">
                <img
                  src={step.image}
                  alt="Fertig gedrucktes Bauteil"
                  className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
              disabled={activeStep === 0}
              className="rounded-lg border border-neutral-700 px-4 py-2 font-mono text-xs uppercase tracking-wide transition hover:border-neutral-500 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹ Zurück
            </button>
            <button
              onClick={() => setActiveStep((s) => Math.min(steps.length - 1, s + 1))}
              disabled={activeStep === steps.length - 1}
              className="rounded-lg border border-neutral-700 px-4 py-2 font-mono text-xs uppercase tracking-wide transition hover:border-neutral-500 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Weiter ›
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

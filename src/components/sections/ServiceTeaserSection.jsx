import { Link } from "react-router-dom";
import Reveal from "../Reveal";

export default function ServiceTeaserSection({ onRequest }) {
  return (
    <section className="mt-16 sm:mt-20 md:mt-24">
      <Reveal className="grid gap-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:gap-8 sm:p-8 md:grid-cols-2 md:items-center md:p-10">
        <div className="text-left">
          <span className="eyebrow">Dienstleistung</span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">3D-Druck Dienstleistung</h2>

          <p className="mt-4 text-sm leading-relaxed text-neutral-400 sm:text-base">
            Datei einreichen, Bauteil erhalten – oder von der Idee bis zum fertigen Produkt: technische
            Beratung, Werkstoffauswahl und Fertigung aus einer Hand, für funktionale Bauteile, Prototypen und
            Kleinserien.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/service"
              className="inline-block rounded-lg bg-white px-6 py-3 text-center font-medium text-neutral-950 transition hover:bg-neutral-200"
            >
              Mehr erfahren
            </Link>

            <button
              onClick={() => onRequest("3D-Druck Dienstleistung", "service")}
              className="inline-block rounded-lg border border-neutral-700 px-6 py-3 text-center transition hover:border-neutral-500 hover:bg-neutral-900"
            >
              Direkt anfragen
            </button>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-neutral-800">
          <img
            src="/3D-Druck_S54_Ergebnis.jpg"
            alt="3D-Druck Dienstleistung"
            className="h-64 w-full object-cover transition duration-700 ease-out group-hover:scale-105 sm:h-80 md:h-full"
          />
        </div>
      </Reveal>
    </section>
  );
}

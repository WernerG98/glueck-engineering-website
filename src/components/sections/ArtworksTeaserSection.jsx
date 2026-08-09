import { Link } from "react-router-dom";

export default function ArtworksTeaserSection({ onRequest, onPreview }) {
  return (
    <section className="mt-16 sm:mt-20 md:mt-24">
      <div className="grid gap-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:gap-8 sm:p-8 md:grid-cols-2 md:items-center md:p-10">
        <div className="text-left">
          <span className="eyebrow">Artworks</span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Individuelle 3D-Artworks</h2>

          <p className="mt-4 text-sm leading-relaxed text-neutral-400 sm:text-base">
            Wir verwandeln dein Motiv in ein mehrschichtiges 3D-Artwork mit ausgeprägter Tiefenwirkung. Möglich sind schwarz-weiße und mehrfarbige Ausführungen mit bis zu sechs Farben.
            <br />
            <br />
            Auf der eigenen Artwork-Seite findest du Beispiele, den Ablauf und alle wichtigen Informationen auf einen Blick.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/artworks"
              className="inline-block rounded-lg bg-white px-6 py-3 text-center font-medium text-neutral-950 transition hover:bg-neutral-200"
            >
              Mehr erfahren
            </Link>

            <button
              onClick={() => onRequest("Individuelles 3D-Artwork", "custom")}
              className="inline-block rounded-lg border border-neutral-700 px-6 py-3 text-center transition hover:border-neutral-500 hover:bg-neutral-900"
            >
              Direkt anfragen
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-800">
          <img
            src="/Artwork_Stanced_E46.png"
            alt="3D Artwork BMW E46"
            className="h-64 w-full cursor-pointer object-cover sm:h-80 md:h-full"
            onClick={() => onPreview("/Artwork_Stanced_E46.png")}
          />
        </div>
      </div>
    </section>
  );
}

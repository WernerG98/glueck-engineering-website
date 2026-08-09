import Reveal from "../Reveal";

export default function ArtworksProcessSection() {
  return (
    <section id="ablauf-artworks" className="mt-16 sm:mt-20 md:mt-24">
      <Reveal>
        <span className="eyebrow">Ablauf</span>
        <h2 className="mb-6 mt-2 text-2xl font-semibold tracking-tight sm:mb-8 sm:text-3xl">Ablauf für individuelle 3D-Artworks</h2>
      </Reveal>

      <div className="space-y-6 sm:space-y-8">
        <Reveal className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-lg font-semibold text-neutral-200">1</div>
          <h3 className="text-lg font-semibold sm:text-xl">Übermittlung von Bild und Wünschen</h3>
          <p className="mt-3 text-sm text-neutral-400 sm:text-base">
            Das Motiv wird als JPG, PNG, WEBP oder SVG übermittelt, zusammen mit folgenden Angaben:
          </p>
          <div className="mt-4 space-y-2 text-sm text-neutral-300 sm:text-base">
            <p>• Schwarz-Weiß oder Farbe</p>
            <p>• Gewünschte Abmessungen</p>
            <p>• Rahmen gewünscht oder nicht</p>
            <p>• Rahmenfarbe</p>
            <p>• Anzahl</p>
          </div>
        </Reveal>

        <Reveal delay={100} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-lg font-semibold text-neutral-200">2</div>
          <h3 className="text-lg font-semibold sm:text-xl">Prüfung der Angaben und Vorabentwurf</h3>
          <p className="mt-3 text-sm text-neutral-400 sm:text-base">
            Auf Basis der Angaben wird die Umsetzbarkeit geprüft; vor dem Druck wird ein Vorabentwurf
            inklusive Preis zugesendet. So ist bereits vorab erkennbar, wie das spätere Artwork aussehen wird.
          </p>

          <div className="mt-6 flex justify-center">
            <div className="group w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800">
              <img
                src="/Artwork_Stanced_E46_6.png"
                alt="Vorabentwurf des Artworks"
                className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
              />
            </div>
          </div>
        </Reveal>

        <Reveal delay={200} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-lg font-semibold text-neutral-200">3</div>
          <h3 className="text-lg font-semibold sm:text-xl">Freigabe des Angebots</h3>
          <p className="mt-3 text-sm text-neutral-400 sm:text-base">
            Erst nach Zustimmung zu Entwurf und Preis wird das Angebot bestätigt. Vorher wird nichts produziert.
          </p>
        </Reveal>

        <Reveal delay={300} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-lg font-semibold text-neutral-200">4</div>
          <h3 className="text-lg font-semibold sm:text-xl">Fertigung und Versand</h3>
          <p className="mt-3 text-sm text-neutral-400 sm:text-base">
            Nach erfolgter Freigabe wird das Produkt gefertigt und anschließend sorgfältig verpackt versendet.
          </p>

          <div className="mt-6 flex justify-center">
            <div className="group w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800">
              <img
                src="/Artwork_E46_Ergebnis.jpg"
                alt="Fertig gedrucktes Artwork"
                className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

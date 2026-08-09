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
          <h3 className="text-lg font-semibold sm:text-xl">Du sendest uns dein Bild und deine Wünsche</h3>
          <p className="mt-3 text-sm text-neutral-400 sm:text-base">
            Sende uns dein Motiv als JPG, PNG, WEBP oder SVG und teile uns folgende Informationen mit:
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
          <h3 className="text-lg font-semibold sm:text-xl">Wir prüfen deine Angaben und erstellen einen Vorabentwurf</h3>
          <p className="mt-3 text-sm text-neutral-400 sm:text-base">
            Auf Basis deiner Angaben prüfen wir die Umsetzbarkeit und senden dir vor dem Druck einen Vorabentwurf inklusive Preis zu. So siehst du bereits vorab, wie das spätere Artwork aussehen wird.
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
          <h3 className="text-lg font-semibold sm:text-xl">Du gibst das Angebot frei</h3>
          <p className="mt-3 text-sm text-neutral-400 sm:text-base">
            Erst wenn du mit Entwurf und Preis einverstanden bist, bestätigst du das Angebot. Vorher wird nichts produziert.
          </p>
        </Reveal>

        <Reveal delay={300} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-lg font-semibold text-neutral-200">4</div>
          <h3 className="text-lg font-semibold sm:text-xl">Wir fertigen dein Artwork und verschicken es</h3>
          <p className="mt-3 text-sm text-neutral-400 sm:text-base">
            Nach deiner Freigabe fertigen wir das Produkt und versenden es anschließend sorgfältig verpackt an dich.
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

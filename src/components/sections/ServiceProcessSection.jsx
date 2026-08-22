import Reveal from "../Reveal";

export default function ServiceProcessSection() {
  return (
    <section id="ablauf-service" className="mt-16 sm:mt-20 md:mt-24">
      <Reveal>
        <span className="eyebrow">Ablauf</span>
        <h2 className="mb-6 mt-2 text-2xl font-semibold tracking-tight sm:mb-8 sm:text-3xl">
          Ablauf der 3D-Druck Dienstleistung
        </h2>
      </Reveal>

      <div className="space-y-6 sm:space-y-8">
        <Reveal className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-lg font-semibold text-neutral-200">
            1
          </div>
          <h3 className="text-lg font-semibold sm:text-xl">Datei einreichen oder Idee schildern</h3>
          <p className="mt-3 text-sm text-neutral-400 sm:text-base">
            Bei einer bereits fertigen Datei genügt die Übermittlung des Modells. Sonst reicht eine Beschreibung
            der Idee – von der Konstruktion bis zur Optimierung wird gemeinsam erarbeitet, was gebraucht wird.
          </p>
        </Reveal>

        <Reveal delay={100} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-lg font-semibold text-neutral-200">
            2
          </div>
          <h3 className="text-lg font-semibold sm:text-xl">Technische Beratung &amp; Angebot</h3>
          <p className="mt-3 text-sm text-neutral-400 sm:text-base">
            Prüfung der Machbarkeit sowie Auswahl des passenden Werkstoffs hinsichtlich mechanischer Belastung,
            Temperaturbeständigkeit und Umgebungsbedingungen wie UV-Einwirkung oder Feuchtigkeit. Anschließend
            gibt es ein Angebot mit Materialempfehlung.
          </p>
        </Reveal>

        <Reveal delay={200} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-lg font-semibold text-neutral-200">
            3
          </div>
          <h3 className="text-lg font-semibold sm:text-xl">Freigabe des Angebots</h3>
          <p className="mt-3 text-sm text-neutral-400 sm:text-base">
            Erst nach Zustimmung zu Angebot und Preis wird produziert. Vorher wird nichts gefertigt.
          </p>
        </Reveal>

        <Reveal delay={300} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-lg font-semibold text-neutral-200">
            4
          </div>
          <h3 className="text-lg font-semibold sm:text-xl">Fertigung &amp; Versand</h3>
          <p className="mt-3 text-sm text-neutral-400 sm:text-base">
            Nach der Freigabe wird das Bauteil gedruckt, geprüft, sorgfältig verpackt und versendet.
          </p>

          <div className="mt-6 flex justify-center">
            <div className="group w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800">
              <img
                src="/3D-Druck_S54_Ergebnis.jpg"
                alt="Fertig gedrucktes Bauteil"
                className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

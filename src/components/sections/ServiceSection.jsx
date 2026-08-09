import Reveal from "../Reveal";

export default function ServiceSection({ onRequest }) {
  return (
    <section className="mt-16 sm:mt-20">
      <Reveal className="grid gap-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:gap-8 sm:p-8 md:grid-cols-2 md:items-center md:p-10">
        <div className="text-left">
          <span className="eyebrow">Dienstleistung</span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">3D-Druck und Dienstleistungen</h2>

          <p className="mt-3 text-lg text-neutral-200">Deine Datei. Dein Bauteil. Wir übernehmen den Rest.</p>

          <p className="mt-4 text-sm leading-relaxed text-neutral-400 sm:text-base">
            Wir bieten individuelle 3D-Drucklösungen für funktionale Bauteile, Prototypen und Kleinserien.
            <br />
            <br />
            Du hast bereits eine fertige Datei? Dann sende uns einfach dein Modell, wir übernehmen den Druck und liefern das Bauteil direkt zu dir.
            <br />
            <br />
            Alternativ unterstützen wir dich von der Idee bis zum fertigen Produkt: von der technischen Beratung über Konstruktion und Optimierung bis hin zur fertigen Bauteilproduktion.
            <br />
            <br />
            Neben der reinen Fertigung unterstützen wir bei der Auslegung von Bauteilen hinsichtlich mechanischer Belastung, Temperaturbeständigkeit und Umgebungsbedingungen wie UV-Einwirkung oder Feuchtigkeit.
            <br />
            <br />
            Verfügbare Materialien umfassen unter anderem PLA, PETG, TPU, ABS, ASA, PC, PA sowie faserverstärkte Varianten, zum Beispiel Carbon.
            <br />
            <br />
            Maximale Bauteilgröße: 33 × 32,5 × 32 cm.
          </p>

          <div className="mt-8">
            <button
              onClick={() => onRequest("3D-Druck Dienstleistung", "service")}
              className="rounded-lg bg-white px-6 py-3 font-medium text-neutral-950 transition hover:bg-neutral-200"
            >
              Anfrage senden
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

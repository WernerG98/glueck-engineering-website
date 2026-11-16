import Reveal from "../Reveal";

// Echte Fotos fertiger Arbeiten – horizontal wischbar, Klick öffnet die Großansicht
const ITEMS = [
  { src: "/3D-Druck_Teelicht_Bluete_80.webp", title: "Teelichthalter Blüte zum 80. Geburtstag", tag: "Geschenk" },
  { src: "/Artwork_Wing_Ergebnis_Full.webp", title: "BMW E46 als 3D-Artwork", tag: "Artwork" },
  { src: "/3D-Druck_Teelicht_Sonne.webp", title: "Teelichthalter Sonne mit Relief", tag: "Deko" },
  { src: "/3D-Druck_Adapterstutzen_Waescheschacht_DN200.webp", title: "Adapterstutzen Wäscheschacht DN200", tag: "Sonderanfertigung" },
  { src: "/Honda_XRV_RD07_Spritzschutz_Schwinge_hinten.webp", title: "Spritzschutz Honda XRV750", tag: "Fertigteil" },
  { src: "/Stellmotor_Klimaturm_T5.webp", title: "Stellmotor Klimaturm VW T5.2", tag: "Fertigteil" },
];

export default function WerkstattGallery({ onPreview }) {
  return (
    <section className="mt-16 sm:mt-20 md:mt-24">
      <Reveal>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Aus der Werkstatt</span>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Gedruckt, montiert, im Einsatz</h2>
          </div>
          <p className="text-sm text-neutral-400">Zum Vergrößern antippen</p>
        </div>

        <ul className="-mx-4 mt-6 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 [scrollbar-color:#3f3f46_transparent] [scrollbar-width:thin] sm:-mx-6 sm:scroll-px-6 sm:px-6">
          {ITEMS.map((item) => (
            <li key={item.src} className="w-64 shrink-0 snap-start sm:w-72">
              <button
                type="button"
                onClick={() => onPreview?.(item.src)}
                className="group block w-full text-left"
              >
                <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
                  <img
                    src={item.src}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <span className="mt-3 block font-mono text-[11px] uppercase tracking-[0.18em] text-accent">{item.tag}</span>
                <span className="mt-1 block text-sm font-medium text-neutral-200 group-hover:text-white">{item.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

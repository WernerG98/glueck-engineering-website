import Reveal from "../Reveal";
import materials from "../../data/materials";
import fertigteile from "../../data/fertigteile";

// Günstigster Fertigteil-Preis aus den Daten, damit die Zahl nie veraltet
const minPrice = Math.min(
  ...fertigteile.map((item) => parseFloat(item.price.replace(/[^\d,]/g, "").replace(",", "."))).filter(Number.isFinite)
);
const minPriceLabel = `${minPrice.toFixed(2).replace(".", ",")} €`;

const FACTS = [
  { value: "bis 33", unit: "cm", label: "Bauteilgröße, max. 33 × 32,5 × 32 cm" },
  { value: String(materials.length), unit: "Werkstoffe", label: "im Material-Guide verglichen" },
  { value: "bis 6", unit: "Farben", label: "pro mehrschichtigem 3D-Artwork" },
  { value: `ab ${minPriceLabel}`, unit: "", label: "Fertigteile direkt bestellbar" },
];

export default function FactsBar() {
  return (
    <section aria-label="Eckdaten" className="mt-16 sm:mt-20">
      <Reveal>
        <dl className="grid grid-cols-2 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-800 [gap:1px] md:grid-cols-4">
          {FACTS.map((fact) => (
            <div key={fact.label} className="flex flex-col justify-between gap-3 bg-neutral-950/90 p-5 backdrop-blur-md sm:p-6">
              <dt className="order-2 text-sm leading-snug text-neutral-400">{fact.label}</dt>
              <dd className="order-1 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {fact.value}
                {fact.unit && <span className="ml-1.5 text-base font-medium text-accent sm:text-lg">{fact.unit}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}

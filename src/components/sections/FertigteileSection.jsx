import { useState } from "react";
import Reveal from "../Reveal";
import { SHIPPING_COST_LABEL } from "../../data/siteStatus";

function FertigteilCard({ item, onRequest }) {
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const handleBuyNow = async () => {
    setLoadingCheckout(true);

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.url) {
        throw new Error(data?.error || "Beim Start der Bezahlung ist ein Fehler aufgetreten.");
      }

      window.location.href = data.url;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Beim Start der Bezahlung ist ein Fehler aufgetreten.");
      setLoadingCheckout(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 transition hover:-translate-y-1 hover:border-neutral-700 sm:p-6">
      <div className="group aspect-square overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-950">
            <span className="text-base font-semibold uppercase tracking-[0.2em] text-neutral-500 sm:text-lg">
              Coming soon
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="text-base text-neutral-200 sm:text-lg">{item.name}</h3>
        <p className="mt-2 text-lg font-semibold text-white">{item.price}</p>
        <p className="text-xs text-neutral-500">zzgl. {SHIPPING_COST_LABEL} Versand</p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">{item.text}</p>

        <div className="mt-auto flex flex-col gap-2 pt-6">
          <button
            onClick={handleBuyNow}
            disabled={loadingCheckout}
            className="w-full rounded-lg bg-accent py-3 text-center text-sm font-medium text-neutral-950 transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingCheckout ? "Wird geladen..." : "Jetzt kaufen"}
          </button>
          <button
            onClick={() => onRequest(item.name, "product")}
            className="w-full rounded-lg border border-neutral-700 py-3 text-center text-sm font-medium transition hover:border-neutral-500 hover:bg-neutral-800"
          >
            Andere Wunschfarbe oder Anzahl? Anfragen
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FertigteileSection({ items, onRequest, showHeading = true }) {
  return (
    <section className="mt-16 sm:mt-20 md:mt-24">
      {showHeading && (
        <Reveal>
          <span className="eyebrow">Produkte</span>
          <h2 className="mb-6 mt-2 text-2xl font-semibold tracking-tight sm:mb-8 sm:text-3xl">Fertigteile</h2>
        </Reveal>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={item.id || `${item.name}-${index}`} delay={index * 100} className="h-full">
            <FertigteilCard item={item} onRequest={onRequest} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

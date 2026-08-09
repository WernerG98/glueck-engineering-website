function FertigteilCard({ item, onRequest }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 transition hover:border-neutral-700 sm:p-6">
      <div className="aspect-square overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
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
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">{item.text}</p>

        <div className="mt-auto pt-6">
          <button
            onClick={() => onRequest(item.name, "product")}
            className="w-full rounded-lg border border-neutral-700 py-3 text-center text-sm font-medium transition hover:border-neutral-500 hover:bg-neutral-800"
          >
            Anfrage senden
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FertigteileSection({ items, onRequest }) {
  return (
    <section className="mt-16 sm:mt-20 md:mt-24">
      <span className="eyebrow">Produkte</span>
      <h2 className="mb-6 mt-2 text-2xl font-semibold tracking-tight sm:mb-8 sm:text-3xl">Fertigteile</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <FertigteilCard
            key={`${item.name}-${index}`}
            item={item}
            onRequest={onRequest}
          />
        ))}
      </div>
    </section>
  );
}

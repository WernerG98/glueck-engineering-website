export default function ProcessStations({ steps, activeStep, onSelect }) {
  const n = steps.length;
  const edgeInset = 100 / (n * 2);

  return (
    <div className="relative px-6 pb-3 pt-7 sm:px-8">
      <div
        className="absolute top-[2.6rem] h-px bg-neutral-800 sm:top-[2.85rem]"
        style={{ left: `${edgeInset}%`, right: `${edgeInset}%` }}
      >
        <div
          className="h-full bg-accent transition-all duration-500 ease-out"
          style={{ width: n > 1 ? `${(activeStep / (n - 1)) * 100}%` : "0%" }}
        />
      </div>

      <div className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => {
          const state = index < activeStep ? "done" : index === activeStep ? "active" : "upcoming";
          return (
            <button
              key={step.title}
              onClick={() => onSelect(index)}
              className="flex flex-col items-center gap-2 bg-transparent px-1 pb-1 text-center"
            >
              <span
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded border font-mono text-xs transition",
                  state === "active" && "border-accent bg-accent text-neutral-950",
                  state === "done" && "border-accent/60 bg-neutral-900 text-accent",
                  state === "upcoming" && "border-neutral-700 bg-neutral-900 text-neutral-500",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {state === "done" ? "✓" : String(index + 1).padStart(2, "0")}
              </span>
              <span
                className={[
                  "hidden font-mono text-[10.5px] uppercase leading-tight tracking-wide sm:block",
                  state === "upcoming" ? "text-neutral-500" : "text-neutral-300",
                ].join(" ")}
              >
                {step.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

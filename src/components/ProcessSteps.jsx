import BeforeAfterSlider from "./BeforeAfterSlider";

export default function ProcessSteps({ steps }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 bg-neutral-950/40 px-6 py-3 sm:px-8">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-neutral-500">
          Fertigungsbegleitschein
        </span>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-neutral-500">
          {steps.length} Stationen
        </span>
      </div>

      <ol className="px-6 py-6 sm:px-8 sm:py-8">
        {steps.map((step, index) => (
          <li key={step.title} className="relative flex gap-4 pb-8 last:pb-0 sm:gap-6">
            {index < steps.length - 1 && (
              <span aria-hidden="true" className="absolute bottom-0 left-[17px] top-9 w-px bg-accent/40" />
            )}

            <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded border border-accent/50 bg-neutral-900 font-mono text-xs text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="min-w-0 flex-1 pt-1">
              <h3 className="text-lg font-semibold sm:text-xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400 sm:text-base">{step.description}</p>

              {step.bullets && (
                <ul className="mt-4 space-y-2 text-sm text-neutral-300 sm:text-base">
                  {step.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2.5">
                      <span
                        className="mt-1 h-3.5 w-3.5 shrink-0 rounded-[2px] border border-neutral-600"
                        aria-hidden="true"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}

              {step.image && (
                <div className="group mt-4 aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-neutral-800">
                  <img
                    src={step.image}
                    alt={step.imageAlt}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                  />
                </div>
              )}

              {step.beforeAfter && (
                <div className="mt-4 w-full max-w-sm">
                  <BeforeAfterSlider
                    beforeSrc={step.beforeAfter.beforeSrc}
                    afterSrc={step.beforeAfter.afterSrc}
                    beforeLabel={step.beforeAfter.beforeLabel}
                    afterLabel={step.beforeAfter.afterLabel}
                  />
                  <p className="mt-3 text-xs text-neutral-500">Zum Vergleichen ziehen</p>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

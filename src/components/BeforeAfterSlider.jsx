import { useState } from "react";

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Vorher",
  afterLabel = "Nachher",
  className = "",
}) {
  const [position, setPosition] = useState(50);

  return (
    <div
      className={`relative aspect-square w-full select-none overflow-hidden rounded-2xl border border-neutral-800 ${className}`}
    >
      <img
        src={afterSrc}
        alt={afterLabel}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={beforeSrc} alt={beforeLabel} className="h-full w-full object-cover" draggable={false} />
      </div>

      <div className="pointer-events-none absolute inset-y-0" style={{ left: `calc(${position}% - 1px)` }}>
        <div className="h-full w-0.5 bg-white/80" />
        <div className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-neutral-950/80 text-white backdrop-blur-sm">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
          </svg>
        </div>
      </div>

      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-neutral-950/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-neutral-950/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
        {afterLabel}
      </span>

      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label={`Vergleich ${beforeLabel} / ${afterLabel}`}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

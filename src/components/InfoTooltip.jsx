import { useEffect, useRef, useState } from "react";

export default function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Erklärung anzeigen"
        aria-expanded={open}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-neutral-600 text-[10px] font-semibold leading-none text-neutral-400 transition hover:border-accent hover:text-accent"
      >
        i
      </button>

      {open && (
        <span className="absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-left text-xs font-normal normal-case leading-relaxed text-neutral-300 shadow-xl">
          {text}
        </span>
      )}
    </span>
  );
}

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useMerkzettel } from "../context/MerkzettelContext";

function buildNotes(items) {
  const lines = items.map((item) => `${item.qty}x ${item.name}${item.price ? ` (${item.price} / Stück)` : ""}`);
  return `Anfrage zu folgenden Teilen vom Merkzettel:\n\n${lines.join("\n")}`;
}

export default function MerkzettelDrawer({ open, onClose, onOpenContactModal }) {
  const { items, removeItem, setQty, clear } = useMerkzettel();

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSend = () => {
    onOpenContactModal("Anfrage über Merkzettel", "general", { notes: buildNotes(items) });
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-neutral-800 bg-neutral-900 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-neutral-800 px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight">Merkzettel</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="text-sm leading-relaxed text-neutral-400">
              Noch keine Teile gemerkt. Über das Lesezeichen-Symbol auf einer Fertigteile-Karte kannst du
              Teile hier sammeln und gemeinsam anfragen.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-lg bg-neutral-800" />
                  )}

                  <div className="flex flex-1 flex-col">
                    <p className="text-sm text-neutral-200">{item.name}</p>
                    {item.price && <p className="mt-1 text-sm font-medium text-white">{item.price}</p>}

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQty(item.id, item.qty - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-700 text-neutral-300 transition hover:border-neutral-500 hover:text-white"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(item.id, item.qty + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-700 text-neutral-300 transition hover:border-neutral-500 hover:text-white"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-xs text-neutral-500 underline transition hover:text-neutral-300"
                      >
                        Entfernen
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-neutral-800 px-5 py-4">
            <button
              onClick={handleSend}
              className="rounded-lg bg-accent px-6 py-3 text-center font-medium text-neutral-950 transition hover:bg-accent-light"
            >
              Anfrage mit {items.length} {items.length === 1 ? "Teil" : "Teilen"} senden
            </button>
            <button
              onClick={clear}
              className="text-center text-xs text-neutral-500 underline transition hover:text-neutral-300"
            >
              Merkzettel leeren
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

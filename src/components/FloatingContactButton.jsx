export default function FloatingContactButton({ onOpen }) {
  return (
    <button
      onClick={() => onOpen("Allgemeine Anfrage", "general")}
      aria-label="Kontakt aufnehmen"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-white px-5 py-3 font-medium text-neutral-950 shadow-lg shadow-black/40 transition hover:bg-neutral-200 sm:bottom-6 sm:right-6"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        />
      </svg>
      <span className="hidden sm:inline">Kontakt</span>
    </button>
  );
}

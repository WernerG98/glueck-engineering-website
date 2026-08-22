import { ACCEPTING_REQUESTS, LEAD_TIME } from "../data/siteStatus";

export default function StatusBanner() {
  if (!ACCEPTING_REQUESTS) {
    return (
      <div className="border-b border-neutral-800 bg-neutral-900 px-4 py-2 text-center text-xs text-neutral-100 sm:text-sm">
        <span className="font-semibold">Aktuell pausiert:</span> Wir nehmen momentan keine neuen Anfragen an. Schau bald wieder vorbei.
      </div>
    );
  }

  return (
    <div className="border-b border-neutral-800 bg-neutral-900/60 px-4 py-2 text-center text-xs text-neutral-400 sm:text-sm">
      Aktuelle Lieferzeit: ca. {LEAD_TIME}
    </div>
  );
}

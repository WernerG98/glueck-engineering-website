import { useEffect } from "react";

export default function useJsonLd(id, data) {
  useEffect(() => {
    // Die vorgerenderte Seite enthält dieselben Daten bereits statisch (gleiche id): ersetzen statt doppelt
    document.getElementById(id)?.remove();

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [id, data]);
}

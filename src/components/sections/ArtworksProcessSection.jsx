import Reveal from "../Reveal";
import ProcessSteps from "../ProcessSteps";

const steps = [
  {
    title: "Übermittlung von Bild und Wünschen",
    description: "Das Motiv wird als JPG, PNG, WEBP oder SVG übermittelt, zusammen mit folgenden Angaben:",
    bullets: ["Schwarz-Weiß oder Farbe", "Gewünschte Abmessungen", "Rahmen gewünscht oder nicht", "Rahmenfarbe", "Anzahl"],
  },
  {
    title: "Prüfung der Angaben und Vorabentwurf",
    description:
      "Auf Basis der Angaben wird die Umsetzbarkeit geprüft; vor dem Druck wird ein Vorabentwurf inklusive Preis zugesendet. So ist bereits vorab erkennbar, wie das spätere Artwork aussehen wird.",
    image: "/Artwork_Stanced_E46_6.png",
    imageAlt: "Vorabentwurf des Artworks",
  },
  {
    title: "Freigabe des Angebots",
    description: "Erst nach Zustimmung zu Entwurf und Preis wird das Angebot bestätigt. Vorher wird nichts produziert.",
  },
  {
    title: "Fertigung und Versand",
    description:
      "Nach erfolgter Freigabe wird das Produkt gefertigt und anschließend sorgfältig verpackt versendet. So wird aus dem Entwurf ein echtes Artwork:",
    beforeAfter: {
      beforeSrc: "/Artwork_Stanced_E46_6.png",
      afterSrc: "/Artwork_E46_Ergebnis_Cropped.jpg",
      beforeLabel: "Entwurf",
      afterLabel: "Fertig gedruckt",
    },
  },
];

export default function ArtworksProcessSection() {
  return (
    <section id="ablauf-artworks" className="mt-16 sm:mt-20 md:mt-24">
      <Reveal>
        <span className="eyebrow">Fertigungsbegleitschein</span>
        <h2 className="mb-6 mt-2 text-2xl font-semibold tracking-tight sm:mb-8 sm:text-3xl">
          Ablauf für individuelle 3D-Artworks
        </h2>
      </Reveal>

      <Reveal>
        <ProcessSteps steps={steps} />
      </Reveal>
    </section>
  );
}

import Reveal from "../Reveal";
import ProcessSteps from "../ProcessSteps";

const steps = [
  {
    title: "Datei einreichen oder Idee schildern",
    description:
      "Bei einer bereits fertigen Datei genügt die Übermittlung des Modells. Sonst reicht eine Beschreibung der Idee, von der Konstruktion bis zur Optimierung wird gemeinsam erarbeitet, was gebraucht wird.",
  },
  {
    title: "Technische Beratung & Angebot",
    description:
      "Prüfung der Machbarkeit sowie Auswahl des passenden Werkstoffs hinsichtlich mechanischer Belastung, Temperaturbeständigkeit und Umgebungsbedingungen wie UV-Einwirkung oder Feuchtigkeit. Anschließend gibt es ein Angebot mit Materialempfehlung.",
  },
  {
    title: "Freigabe des Angebots",
    description: "Erst nach Zustimmung zu Angebot und Preis wird produziert. Vorher wird nichts gefertigt.",
  },
  {
    title: "Fertigung & Versand",
    description: "Nach der Freigabe wird das Bauteil gedruckt, geprüft, sorgfältig verpackt und versendet.",
  },
];

export default function ServiceProcessSection() {
  return (
    <section id="ablauf-service" className="mt-16 sm:mt-20 md:mt-24">
      <Reveal>
        <span className="eyebrow">Fertigungsbegleitschein</span>
        <h2 className="mb-6 mt-2 text-2xl font-semibold tracking-tight sm:mb-8 sm:text-3xl">
          Ablauf der 3D-Druck Dienstleistung
        </h2>
      </Reveal>

      <Reveal>
        <ProcessSteps steps={steps} />
      </Reveal>
    </section>
  );
}

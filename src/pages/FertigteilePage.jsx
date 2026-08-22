import { useMemo, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactModal from "../components/ContactModal";
import Reveal from "../components/Reveal";
import FertigteileSection from "../components/sections/FertigteileSection";
import useContactForm from "../hooks/useContactForm";
import fertigteile from "../data/fertigteile";

export default function FertigteilePage() {
  const [activeVehicle, setActiveVehicle] = useState("alle");

  const {
    contactModalOpen,
    requestSubject,
    requestType,
    formData,
    attachment,
    isSending,
    openContactModal,
    closeContactModal,
    handleInputChange,
    handleFileChange,
    submitContactForm,
  } = useContactForm();

  const vehicleOptions = useMemo(() => {
    const unique = new Set();
    fertigteile.forEach((item) => item.vehicles.forEach((vehicle) => unique.add(vehicle)));
    return ["alle", ...Array.from(unique).sort()];
  }, []);

  const filteredFertigteile = useMemo(() => {
    if (activeVehicle === "alle") return fertigteile;
    return fertigteile.filter((item) => item.vehicles.includes(activeVehicle));
  }, [activeVehicle]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Header onOpenContactModal={openContactModal} />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:py-24">
        <section>
          <Reveal>
            <span className="eyebrow">Produkte</span>

            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              Fertigteile
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">
              Passgenaue Ersatz- und Zubehörteile für ausgewählte Fahrzeuge, direkt ab Lager fertigbar.
              Bei Bedarf an anderen Farben oder Stückzahlen einfach in der Anfrage angeben.
            </p>

            <div className="mt-8">
              <button
                onClick={() => openContactModal("Allgemeine Anfrage", "general")}
                className="inline-block rounded-lg bg-white px-6 py-3 font-medium text-neutral-950 transition hover:bg-neutral-200"
              >
                Allgemeine Anfrage senden
              </button>
            </div>
          </Reveal>
        </section>

        <section className="mt-10 sm:mt-12">
          <Reveal className="flex flex-wrap gap-2">
            {vehicleOptions.map((vehicle) => (
              <button
                key={vehicle}
                onClick={() => setActiveVehicle(vehicle)}
                className={[
                  "rounded-lg border px-4 py-2 text-sm font-medium transition",
                  activeVehicle === vehicle
                    ? "border-neutral-700 bg-neutral-800/80 text-white"
                    : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white",
                ].join(" ")}
              >
                {vehicle === "alle" ? "Alle Fahrzeuge" : vehicle}
              </button>
            ))}
          </Reveal>
        </section>

        <FertigteileSection items={filteredFertigteile} onRequest={openContactModal} showHeading={false} />
      </main>

      <Footer />

      <ContactModal
        contactModalOpen={contactModalOpen}
        requestSubject={requestSubject}
        requestType={requestType}
        formData={formData}
        handleInputChange={handleInputChange}
        handleFileChange={handleFileChange}
        attachment={attachment}
        closeContactModal={closeContactModal}
        submitContactForm={submitContactForm}
        isSending={isSending}
      />
    </div>
  );
}

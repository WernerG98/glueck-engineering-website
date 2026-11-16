import { useMemo, useState } from "react";
import PageMeta from "../components/PageMeta";
import Header from "../components/Header";
import PageBackdrop from "../components/PageBackdrop";
import Footer from "../components/Footer";
import ContactModal from "../components/ContactModal";
import FloatingContactButton from "../components/FloatingContactButton";
import Reveal from "../components/Reveal";
import FertigteileSection from "../components/sections/FertigteileSection";
import useContactForm from "../hooks/useContactForm";
import useJsonLd from "../hooks/useJsonLd";
import fertigteile from "../data/fertigteile";
import { fertigteileStructuredData } from "../data/structuredData";

export default function FertigteilePage() {
  const [activeVehicle, setActiveVehicle] = useState("alle");

  useJsonLd("fertigteile-structured-data", fertigteileStructuredData);

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
    formError,
    isSubmitted,
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
    <div className="relative min-h-screen bg-neutral-950 text-white">
      <PageBackdrop />
      <PageMeta
        title="Fertigteile"
        description="Passgenaue Ersatz- und Zubehörteile für VW Bus (T3/T4/T5/T6) und weitere Fahrzeuge, direkt ab Lager fertigbar."
      />
      <Header onOpenContactModal={openContactModal} />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:py-24">
        <section>
          <Reveal>
            <span className="eyebrow">Produkte</span>

            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              Fertigteile
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-neutral-300">
              Passgenaue Ersatz- und Zubehörteile für ausgewählte Fahrzeuge, direkt ab Lager fertigbar.
              Bei Bedarf an anderen Farben oder Stückzahlen einfach in der Anfrage angeben.
            </p>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-300">
              {["Direkt ab Lager fertigbar", "Andere Farben auf Anfrage", "Jedes Teil in 3D drehbar"].map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-accent" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L19 7" />
                    </svg>
                  </span>
                  {point}
                </li>
              ))}
            </ul>
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
                    ? "border-accent bg-neutral-800/80 text-white"
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

      <FloatingContactButton onOpen={openContactModal} />

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
        formError={formError}
        isSubmitted={isSubmitted}
        isSending={isSending}
      />
    </div>
  );
}

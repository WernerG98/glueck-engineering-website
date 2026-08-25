import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactModal from "../components/ContactModal";
import FloatingContactButton from "../components/FloatingContactButton";
import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import FertigteileSection from "../components/sections/FertigteileSection";
import useContactForm from "../hooks/useContactForm";
import fertigteile from "../data/fertigteile";

export default function FertigteilePage() {
  const [activeVehicle, setActiveVehicle] = useState("alle");
  const [searchParams] = useSearchParams();
  const checkoutStatus = searchParams.get("checkout");

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
        {checkoutStatus === "success" && (
          <Reveal className="mb-8 rounded-2xl border border-accent/60 bg-accent/10 p-5 sm:p-6">
            <p className="font-medium text-white">Danke für deine Bestellung!</p>
            <p className="mt-1 text-sm text-neutral-300">
              Die Bestellbestätigung ist unterwegs zu deiner E-Mail-Adresse.
            </p>
          </Reveal>
        )}

        {checkoutStatus === "cancelled" && (
          <Reveal className="mb-8 rounded-2xl border border-neutral-700 bg-neutral-900/60 p-5 sm:p-6">
            <p className="font-medium text-white">Bezahlung abgebrochen</p>
            <p className="mt-1 text-sm text-neutral-400">
              Es wurde nichts berechnet. Du kannst es jederzeit erneut versuchen.
            </p>
          </Reveal>
        )}

        <section>
          <Reveal>
            <span className="eyebrow">Produkte</span>

            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              Fertigteile
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">
              Passgenaue Ersatz- und Zubehörteile für ausgewählte Fahrzeuge, direkt ab Lager fertigbar und
              direkt kaufbar. Bei Bedarf an anderen Farben oder größeren Stückzahlen einfach anfragen.
            </p>

            <div className="mt-8">
              <button
                onClick={() => openContactModal("Allgemeine Anfrage", "general")}
                className="inline-block rounded-lg bg-accent px-6 py-3 font-medium text-neutral-950 transition hover:bg-accent-light"
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

        <p className="mt-10 text-xs text-neutral-600">
          Beim Direktkauf gelten unsere{" "}
          <Link to="/agb" className="text-accent underline hover:text-accent-light">
            AGB &amp; Widerrufsbelehrung
          </Link>
          . Die Bezahlung läuft über Stripe.
        </p>
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
        isSending={isSending}
      />
    </div>
  );
}

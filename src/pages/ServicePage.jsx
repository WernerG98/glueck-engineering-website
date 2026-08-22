import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactModal from "../components/ContactModal";
import FloatingContactButton from "../components/FloatingContactButton";
import Reveal from "../components/Reveal";
import ServiceProcessSection from "../components/sections/ServiceProcessSection";
import useContactForm from "../hooks/useContactForm";

export default function ServicePage() {
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

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Header onOpenContactModal={openContactModal} />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:py-24">
        <section className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
          <Reveal>
            <span className="eyebrow">Dienstleistung</span>

            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              3D-Druck Dienstleistung
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-neutral-200">
              Datei einreichen. Bauteil erhalten. Den Rest übernehmen wir.
            </p>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">
              Individuelle 3D-Drucklösungen für funktionale Bauteile, Prototypen und Kleinserien, vom fertigen
              Modell bis zur Idee, die erst gemeinsam zum druckbaren Bauteil wird.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                onClick={() => openContactModal("3D-Druck Dienstleistung", "service")}
                className="inline-block rounded-lg bg-white px-6 py-3 text-center font-medium text-neutral-950 transition hover:bg-neutral-200"
              >
                Datei hochladen &amp; Angebot erhalten
              </button>

              <a
                href="#ablauf-service"
                className="inline-block rounded-lg border border-neutral-700 px-6 py-3 text-center transition hover:border-neutral-500 hover:bg-neutral-900"
              >
                Zum Ablauf
              </a>
            </div>
          </Reveal>

          <Reveal delay={150} className="group overflow-hidden rounded-2xl border border-neutral-800">
            <img
              src="/3D-Druck_S54_Ergebnis.jpg"
              alt="3D-Druck Dienstleistung"
              className="h-72 w-full object-cover transition duration-700 ease-out group-hover:scale-105 sm:h-96 md:h-[30rem]"
            />
          </Reveal>
        </section>

        <section className="mt-16 sm:mt-20 md:mt-24">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Was möglich ist</h2>
          </Reveal>

          <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-3">
            <Reveal className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
              <h3 className="text-lg font-semibold">Von der Idee zum Produkt</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                Technische Beratung, Konstruktion und Optimierung, auch ohne fertige Datei.
              </p>
            </Reveal>

            <Reveal delay={100} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
              <h3 className="text-lg font-semibold">Passender Werkstoff</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                Auswahl nach mechanischer Belastung, Temperatur und Umgebung wie UV oder Feuchtigkeit.
              </p>
              <Link
                to="/materialien"
                className="mt-3 inline-block text-sm text-neutral-300 underline hover:text-white"
              >
                Materialübersicht ansehen
              </Link>
            </Reveal>

            <Reveal delay={200} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
              <h3 className="text-lg font-semibold">Bauteilgröße</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                Maximale Bauteilgröße 33 × 32,5 × 32 cm. Größere Teile bei Bedarf auf Anfrage in Segmenten.
              </p>
            </Reveal>
          </div>
        </section>

        <ServiceProcessSection />

        <Reveal className="mt-16 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 text-center sm:mt-20 sm:p-10 md:mt-24">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Bereit für dein Projekt?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-neutral-400 sm:text-base">
            Datei einreichen oder Idee schildern. Der Rest wird gemeinsam geklärt.
          </p>
          <div className="mt-6">
            <button
              onClick={() => openContactModal("3D-Druck Dienstleistung", "service")}
              className="inline-block rounded-lg bg-white px-6 py-3 font-medium text-neutral-950 transition hover:bg-neutral-200"
            >
              Jetzt anfragen
            </button>
          </div>
        </Reveal>
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

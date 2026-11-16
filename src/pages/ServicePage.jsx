import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PageMeta from "../components/PageMeta";
import Header from "../components/Header";
import PageBackdrop from "../components/PageBackdrop";
import Footer from "../components/Footer";
import ContactModal from "../components/ContactModal";
import FloatingContactButton from "../components/FloatingContactButton";
import ImageModal from "../components/ImageModal";
import Reveal from "../components/Reveal";
import ServiceProcessSection from "../components/sections/ServiceProcessSection";
import useContactForm from "../hooks/useContactForm";

const galleryImages = [
  {
    src: "/3D-Druck_Adapterstutzen_Waescheschacht_DN250.webp",
    label: "Wäscheschacht DIN 250",
    alt: "Eingebauter weißer 3D-gedruckter Adapterstutzen vor dem Rohr eines Wäscheschachts DIN 250",
  },
  {
    src: "/3D-Druck_Adapterstutzen_Waescheschacht_DN200.webp",
    label: "Wäscheschacht DIN 200",
    alt: "Eingebauter weißer 3D-gedruckter Adapterstutzen vor dem Rohr eines Wäscheschachts DIN 200",
  },
  {
    src: "/3D-Druck_Teelicht_Bluete_quer.webp",
    label: "Teelichthalter Blüte",
    alt: "3D-gedruckter Teelichthalter in Blütenform aus mehreren Blattlagen mit Teelicht",
  },
  {
    src: "/3D-Druck_Teelicht_Sonne_quer.webp",
    label: "Teelichthalter Sonnenblume in Holz-Optik",
    alt: "3D-gedruckter Teelichthalter in Sonnenblumenform in Holz-Optik mit Teelicht",
  },
];

export default function ServicePage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const galleryRef = useRef(null);
  // Pfeile nur zeigen, wenn die Bildleiste breiter ist als der Bildschirm
  const [galleryScrollable, setGalleryScrollable] = useState(false);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const check = () => setGalleryScrollable(el.scrollWidth > el.clientWidth + 4);
    const observer = new ResizeObserver(check);
    observer.observe(el);
    check();
    return () => observer.disconnect();
  }, []);

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

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white">
      <PageBackdrop />
      <PageMeta
        title="3D-Druck Dienstleistung"
        description="Individuelle 3D-Drucklösungen für funktionale Bauteile, Prototypen und Kleinserien – von der Beratung bis zur fertigen Bauteilproduktion."
      />
      <Header onOpenContactModal={openContactModal} />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:py-24">
        <section className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
          <Reveal>
            <span className="eyebrow">Dienstleistung</span>

            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              3D-Druck Dienstleistung
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-neutral-200">
              Datei einreichen. Bauteil erhalten. Den Rest übernehmen wir.
            </p>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-300">
              Individuelle 3D-Drucklösungen für funktionale Bauteile, Prototypen und Kleinserien, vom fertigen
              Modell bis zur Idee, die erst gemeinsam zum druckbaren Bauteil wird. Nicht nur für Technik-Profis:
              genauso gefragt sind Ersatzteile für Haushaltsgeräte, individuelle Halterungen oder ausgefallene
              Geschenke.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                onClick={() => openContactModal("3D-Druck Dienstleistung", "service")}
                className="inline-block rounded-lg bg-accent px-6 py-3 text-center font-medium text-neutral-950 transition hover:bg-accent-light"
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
              src="/3D-Druck_S54_Ergebnis.webp"
              alt="3D-Druck Dienstleistung"
              fetchpriority="high"
              className="w-full cursor-pointer object-cover transition duration-700 ease-out group-hover:scale-105"
              style={{ aspectRatio: "1 / 1" }}
              onClick={() => setSelectedImage("/3D-Druck_S54_Ergebnis.webp")}
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
              <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                Technische Beratung, Konstruktion und Optimierung, auch ohne fertige Datei. Egal ob defektes
                Haushaltsteil, spontane Geschenkidee oder technisches Bauteil.
              </p>
            </Reveal>

            <Reveal delay={100} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
              <h3 className="text-lg font-semibold">Passender Werkstoff</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                Auswahl nach mechanischer Belastung, Temperatur und Umgebung wie UV oder Feuchtigkeit.
              </p>
              <Link
                to="/materialien"
                className="mt-3 inline-block text-sm text-accent underline hover:text-accent-light"
              >
                Materialübersicht ansehen
              </Link>
            </Reveal>

            <Reveal delay={200} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
              <h3 className="text-lg font-semibold">Bauteilgröße</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                Maximale Bauteilgröße 33 × 32,5 × 32 cm. Größere Teile bei Bedarf auf Anfrage in Segmenten.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="mt-16 sm:mt-20 md:mt-24">
          <Reveal>
            <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
              <div>
                <span className="eyebrow">Beispiele</span>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Galerie</h2>
              </div>
              <div className={`flex gap-2 ${galleryScrollable ? "" : "hidden"}`}>
                {[
                  { dir: -1, label: "Vorherige Bilder", d: "M15 18l-6-6 6-6" },
                  { dir: 1, label: "Weitere Bilder", d: "M9 6l6 6-6 6" },
                ].map((btn) => (
                  <button
                    key={btn.dir}
                    type="button"
                    aria-label={btn.label}
                    onClick={() => galleryRef.current?.scrollBy({ left: btn.dir * 320, behavior: "smooth" })}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 text-neutral-300 transition hover:border-accent hover:text-accent"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d={btn.d} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Horizontal wischbar, Pfeile scrollen um ein Bild weiter */}
          <ul
            ref={galleryRef}
            className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 [scrollbar-color:#3f3f46_transparent] [scrollbar-width:thin] sm:-mx-6 sm:scroll-px-6 sm:px-6"
          >
            {galleryImages.map((image) => (
              <li key={image.src} className="w-64 shrink-0 snap-start sm:w-72">
                <figure className="group overflow-hidden rounded-2xl border border-neutral-800">
                  <div className="overflow-hidden">
                    <img
                      src={image.src}
                      alt={image.alt}
                      loading="lazy"
                      className="w-full cursor-pointer object-cover transition duration-700 ease-out group-hover:scale-105"
                      style={{ aspectRatio: "800 / 667" }}
                      onClick={() => setSelectedImage(image.src)}
                    />
                  </div>
                  <figcaption className="border-t border-neutral-800 bg-neutral-900/60 px-4 py-2 font-mono text-xs uppercase tracking-wide text-neutral-400">
                    {image.label}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>

        <ServiceProcessSection />

        <Reveal className="mt-16 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 text-center sm:mt-20 sm:p-10 md:mt-24">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Bereit für dein Projekt?</h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-neutral-300">
            Datei einreichen oder Idee schildern. Der Rest wird gemeinsam geklärt.
          </p>
          <div className="mt-6">
            <button
              onClick={() => openContactModal("3D-Druck Dienstleistung", "service")}
              className="inline-block rounded-lg bg-accent px-6 py-3 font-medium text-neutral-950 transition hover:bg-accent-light"
            >
              Jetzt anfragen
            </button>
          </div>
        </Reveal>
      </main>

      <Footer />

      <ImageModal selectedImage={selectedImage} onClose={() => setSelectedImage(null)} />

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

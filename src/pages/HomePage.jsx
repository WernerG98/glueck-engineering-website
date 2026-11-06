import { lazy, Suspense, useCallback, useRef, useState } from "react";
import PageMeta from "../components/PageMeta";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactModal from "../components/ContactModal";
import FloatingContactButton from "../components/FloatingContactButton";
import ImageModal from "../components/ImageModal";
import Reveal from "../components/Reveal";
import HeroGear3D from "../components/HeroGear3D";
import FertigteileTeaserSection from "../components/sections/FertigteileTeaserSection";
import ServiceTeaserSection from "../components/sections/ServiceTeaserSection";
import ArtworksTeaserSection from "../components/sections/ArtworksTeaserSection";
import useContactForm from "../hooks/useContactForm";
import usePrinterScene from "../hooks/usePrinterScene";

const PrinterScrollBackground = lazy(() => import("../components/PrinterScrollBackground"));

// Textstationen im Druck-Abschnitt: [einblenden ab, ausblenden ab] im Scroll-Fortschritt 0..1
const STEPS = [
  {
    range: [0.18, 0.4],
    no: "01",
    title: "Datei rein, Werkstoff raus.",
    text: "STL, STEP oder nur eine Skizze: Ich prüfe die Datei und wähle den Werkstoff passend zu Belastung, Temperatur und Einsatzort.",
  },
  {
    range: [0.44, 0.66],
    no: "02",
    title: "Schicht für Schicht.",
    text: "Das Bauteil entsteht Lage für Lage, maßhaltig und belastbar. Auch komplexe Geometrien wie diese Pfeilverzahnung.",
  },
  {
    range: [0.7, 1.01],
    no: "03",
    title: "Fertig zum Einbau.",
    text: "Abgekühlt, nachbearbeitet und geprüft – direkt bereit für den Einsatz.",
    cta: true,
  },
];

function fade(p, [a, b]) {
  const edge = 0.05;
  const fin = Math.min(1, Math.max(0, (p - a) / edge));
  const fout = b > 1 ? 1 : Math.min(1, Math.max(0, (b - p) / edge));
  return Math.min(fin, fout);
}

function HeroCopy({ onCta }) {
  return (
    <Reveal>
      <div className="flex items-center gap-4">
        <HeroGear3D className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" />
        <span className="eyebrow">Fertigteile · 3D-Druck · Artworks</span>
      </div>

      <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
        Teile, die funktionieren.
        <br />
        <span className="text-neutral-400">Designs, die auffallen.</span>
      </h1>

      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">
        Individuelle Fertigteile, technische 3D-Drucklösungen und mehrschichtige 3D-Artworks aus einer Hand.
      </p>

      <div className="mt-8">
        <button
          onClick={onCta}
          className="rounded-lg bg-accent px-6 py-3 font-medium text-neutral-950 transition hover:bg-accent-light"
        >
          Datei hochladen &amp; Angebot erhalten
        </button>
      </div>
    </Reveal>
  );
}

// Standbild des Druckers für Geräte, auf denen die 3D-Szene nicht läuft
function StaticPoster() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-neutral-950">
      <img
        src="/printer-poster.webp"
        alt=""
        decoding="async"
        className="h-full w-full object-cover object-[70%_center] opacity-90"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 60% 45%, transparent 0%, rgba(9,9,10,0.55) 70%, rgba(9,9,10,0.9) 100%)",
        }}
      />
      <div className="absolute inset-0 bg-neutral-950/30" />
    </div>
  );
}

export default function HomePage() {
  const scene = usePrinterScene();
  const stageRef = useRef(null);
  const heroRef = useRef(null);
  const stepRefs = useRef([]);
  const scrollHintRef = useRef(null);

  const handleProgress = useCallback((p) => {
    const apply = (el, o, dir = 1) => {
      if (!el) return;
      el.style.opacity = String(o);
      el.style.transform = `translateY(${(1 - o) * 24 * dir}px)`;
      el.style.pointerEvents = o > 0.5 ? "auto" : "none";
      el.style.visibility = o < 0.01 ? "hidden" : "visible";
    };
    apply(heroRef.current, 1 - Math.min(1, Math.max(0, (p - 0.04) / 0.08)), -1);
    if (scrollHintRef.current) scrollHintRef.current.style.opacity = String(p < 0.9 ? 1 : 0);
    STEPS.forEach((step, i) => apply(stepRefs.current[i], fade(p, step.range)));
  }, []);

  const [selectedImage, setSelectedImage] = useState(null);

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

  const openServiceRequest = () => openContactModal("3D-Druck Dienstleistung", "service");

  return (
    <div className="min-h-screen text-white">
      <PageMeta description="Individuelle Fertigteile, technische 3D-Drucklösungen und mehrschichtige 3D-Artworks aus einer Hand." />
      {scene.enabled && scene.ready && (
        <Suspense fallback={null}>
          <PrinterScrollBackground stageRef={stageRef} onProgress={handleProgress} />
        </Suspense>
      )}
      {!scene.enabled && <StaticPoster />}
      <Header onOpenContactModal={openContactModal} />

      {scene.enabled ? (
        /* Druck-Abschnitt: 400vh Scrollweg, Inhalt bleibt kleben */
        <section ref={stageRef} className="relative z-10 -mt-16 h-[400vh] md:-mt-[69px]">
          <div className="sticky top-0 h-[100svh] overflow-hidden">
            <div className="relative mx-auto flex h-full max-w-7xl items-end px-4 pb-10 pt-20 md:items-center md:pb-0 sm:px-6 md:pt-24">
              <div ref={heroRef} className="absolute inset-x-4 max-w-xl rounded-2xl bg-neutral-950/70 p-5 backdrop-blur-md sm:inset-x-6 md:bg-transparent md:p-0 md:backdrop-blur-none">
                <HeroCopy onCta={openServiceRequest} />
              </div>

              {STEPS.map((step, i) => (
                <div
                  key={step.no}
                  ref={(el) => (stepRefs.current[i] = el)}
                  className="absolute inset-x-4 max-w-md rounded-2xl bg-neutral-950/70 p-5 backdrop-blur-md sm:inset-x-6 md:bg-transparent md:p-0 md:backdrop-blur-none"
                  style={{ opacity: 0, visibility: "hidden" }}
                >
                  <span className="font-mono text-sm text-accent">{step.no} / 03</span>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">{step.title}</h2>
                  <p className="mt-5 text-sm leading-relaxed text-neutral-300 sm:text-base">{step.text}</p>
                  {step.cta && (
                    <button
                      onClick={openServiceRequest}
                      className="mt-8 rounded-lg bg-accent px-6 py-3 font-medium text-neutral-950 transition hover:bg-accent-light"
                    >
                      Projekt anfragen
                    </button>
                  )}
                </div>
              ))}

              <p
                ref={scrollHintRef}
                className="absolute bottom-8 right-4 hidden items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-450 transition-opacity duration-500 sm:right-6 md:flex"
              >
                Scrollen druckt weiter
                <span className="inline-block h-8 w-px animate-pulse bg-accent" />
              </p>
            </div>
          </div>
        </section>
      ) : (
        /* Standbild-Variante: normales Layout ohne Scroll-Animation */
        <section className="relative z-10 -mt-16 md:-mt-[69px]">
          <div className="mx-auto max-w-7xl px-4 pb-4 pt-32 sm:px-6 md:pt-44">
            <div className="max-w-xl rounded-2xl bg-neutral-950/70 p-5 backdrop-blur-md md:bg-transparent md:p-0 md:backdrop-blur-none">
              <HeroCopy onCta={openServiceRequest} />
            </div>

            <ol className="mt-16 grid gap-4 md:grid-cols-3">
              {STEPS.map((step) => (
                <li
                  key={step.no}
                  className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 backdrop-blur-sm"
                >
                  <span className="font-mono text-sm text-accent">{step.no} / 03</span>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight">{step.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-300">{step.text}</p>
                  {step.cta && (
                    <button
                      onClick={openServiceRequest}
                      className="mt-6 self-start rounded-lg bg-accent px-6 py-3 font-medium text-neutral-950 transition hover:bg-accent-light"
                    >
                      Projekt anfragen
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 md:pb-24">

        <ServiceTeaserSection onRequest={openContactModal} onPreview={setSelectedImage} />
        <FertigteileTeaserSection />
        <ArtworksTeaserSection onRequest={openContactModal} onPreview={setSelectedImage} />
      </main>

      <div className="relative z-10">
        <Footer />
      </div>

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

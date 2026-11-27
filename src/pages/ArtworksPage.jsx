import { useEffect, useRef, useState } from "react";
import PageMeta from "../components/PageMeta";
import Header from "../components/Header";
import PageBackdrop from "../components/PageBackdrop";
import Footer from "../components/Footer";
import ContactModal from "../components/ContactModal";
import FloatingContactButton from "../components/FloatingContactButton";
import ImageModal from "../components/ImageModal";
import Reveal from "../components/Reveal";
import ArtworksProcessSection from "../components/sections/ArtworksProcessSection";
import ArtworkPreviewTool from "../components/sections/ArtworkPreviewTool";
import BeforeAfterSlider from "../components/BeforeAfterSlider";
import useContactForm from "../hooks/useContactForm";
import { artworkInfos, artworkIntroText } from "../data/artworks";

// Stummes Schleifenvideo, das nur läuft, solange es sichtbar ist
function AutoplayVideo({ src, poster, label, className }) {
  const ref = useRef(null);
  useEffect(() => {
    const video = ref.current;
    if (!video || typeof IntersectionObserver === "undefined") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? video.play().catch(() => {}) : video.pause()),
      { threshold: 0.35 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);
  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="none" aria-label={label} className={className} />;
}

export default function ArtworksPage() {
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

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white">
      <PageBackdrop />
      <PageMeta
        title="3D-Artworks"
        description="Individuelle, mehrschichtige 3D-Artworks mit ausgeprägter Tiefenwirkung, schwarz-weiß oder mehrfarbig nach deinem Motiv."
      />
      <Header onOpenContactModal={openContactModal} />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:py-24">
        <section className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
          <Reveal>
            <span className="eyebrow">3D-Artworks</span>

            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              Individuelle 3D-Artworks
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-relaxed text-neutral-300">
              {artworkIntroText}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                onClick={() => openContactModal("Individuelles 3D-Artwork", "custom")}
                className="inline-block rounded-lg bg-accent px-6 py-3 text-center font-medium text-neutral-950 transition hover:bg-accent-light"
              >
                Anfrage senden
              </button>

              <a
                href="#vorschau"
                className="inline-block rounded-lg border border-neutral-700 px-6 py-3 text-center transition hover:border-neutral-500 hover:bg-neutral-900"
              >
                Vorschau ausprobieren
              </a>
            </div>
          </Reveal>

          <Reveal delay={150} className="group overflow-hidden rounded-2xl border border-neutral-800">
            <img
              src="/Artwork_Praesentation_Wand.webp"
              alt="Drei fertige 3D-Artworks gerahmt an der Wand"
              fetchpriority="high"
              className="w-full cursor-pointer object-cover transition duration-700 ease-out group-hover:scale-105"
              style={{ aspectRatio: "1254 / 970" }}
              onClick={() => setSelectedImage("/Artwork_Praesentation_Wand.webp")}
            />
          </Reveal>
        </section>

        <ArtworksProcessSection />

        <section className="mt-16 sm:mt-20">
          <Reveal className="grid gap-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:gap-8 sm:p-8 md:grid-cols-2 md:items-center md:p-10">
            <div className="text-left">
              <h2 className="text-2xl font-semibold tracking-tight">Wichtige Informationen</h2>

              <dl className="mt-5 space-y-4">
                {artworkInfos.map((info) => (
                  <div key={info.label}>
                    <dt className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-accent">{info.label}</dt>
                    <dd className="mt-1 text-base leading-relaxed text-neutral-300">{info.text}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mx-auto w-full max-w-md">
              <BeforeAfterSlider
                beforeSrc="/Artwork_Stanced_E46_6.webp"
                afterSrc="/Artwork_E46_Ergebnis_Cropped.webp"
                beforeLabel="Entwurf"
                afterLabel="Fertig gedruckt"
              />
              <p className="mt-3 text-xs text-neutral-450">Entwurf und fertiges Artwork – zum Vergleichen ziehen</p>
            </div>
          </Reveal>
        </section>

        {/* Gerenderte Wandvorschau (blender/artwork_wand.py aus dem HueForge-Export des E46-Artworks) */}
        <section className="mt-16 sm:mt-20">
          <Reveal>
            <span className="eyebrow">Im Licht</span>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Ein Relief, das mit dem Licht spielt</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-300">
              Frontal beleuchtet wirkt das Artwork wie ein Foto. Fällt das Licht von der Seite, werden die einzelnen
              Höhenstufen sichtbar – je nach Tageszeit und Blickwinkel sieht es an der Wand immer ein wenig anders aus.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Reveal className="overflow-hidden rounded-2xl border border-neutral-800">
              <AutoplayVideo
                src="/artworks/e46_licht.mp4"
                poster="/artworks/e46_detail.webp"
                label="Video: Licht wandert über das Relief eines 3D-Artworks"
                className="aspect-square w-full object-cover"
              />
            </Reveal>
              <Reveal delay={100} className="group overflow-hidden rounded-2xl border border-neutral-800">
                <img
                  src="/artworks/e46_wand.webp"
                  alt="3D-Artwork im Schattenfugenrahmen an der Wand über einem Sideboard, beleuchtet von einer Bilderleuchte"
                  loading="lazy"
                  className="aspect-square w-full cursor-pointer object-cover transition duration-700 ease-out group-hover:scale-105"
                  onClick={() => setSelectedImage("/artworks/e46_wand.webp")}
                />
              </Reveal>
              <Reveal delay={200} className="group overflow-hidden rounded-2xl border border-neutral-800">
                <img
                  src="/artworks/e46_detail.webp"
                  alt="Nahaufnahme im Streiflicht: die Höhenstufen des Reliefs werden sichtbar"
                  loading="lazy"
                  className="aspect-square w-full cursor-pointer object-cover transition duration-700 ease-out group-hover:scale-105"
                  onClick={() => setSelectedImage("/artworks/e46_detail.webp")}
                />
              </Reveal>
          </div>
        </section>

        <ArtworkPreviewTool onRequest={openContactModal} />
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

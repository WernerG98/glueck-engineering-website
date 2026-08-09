import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactModal from "../components/ContactModal";
import ImageModal from "../components/ImageModal";
import Reveal from "../components/Reveal";
import GallerySection from "../components/sections/GallerySection";
import ArtworksProcessSection from "../components/sections/ArtworksProcessSection";
import useContactForm from "../hooks/useContactForm";
import {
  artworkGalleryImages,
  artworkInfoText,
  artworkIntroText,
} from "../data/artworks";

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
  } = useContactForm();

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Header onOpenContactModal={openContactModal} />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:py-24">
        <section className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
          <Reveal>
            <span className="eyebrow">3D-Artworks</span>

            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              Individuelle 3D-Artworks
            </h1>

            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-neutral-400 sm:text-base">
              {artworkIntroText}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                onClick={() => openContactModal("Individuelles 3D-Artwork", "custom")}
                className="inline-block rounded-lg bg-white px-6 py-3 text-center font-medium text-neutral-950 transition hover:bg-neutral-200"
              >
                Anfrage senden
              </button>

              <a
                href="#galerie"
                className="inline-block rounded-lg border border-neutral-700 px-6 py-3 text-center transition hover:border-neutral-500 hover:bg-neutral-900"
              >
                Zur Galerie
              </a>

              <a
                href="#ablauf-artworks"
                className="inline-block rounded-lg border border-neutral-700 px-6 py-3 text-center transition hover:border-neutral-500 hover:bg-neutral-900"
              >
                Zum Ablauf
              </a>
            </div>
          </Reveal>

          <Reveal delay={150} className="group overflow-hidden rounded-2xl border border-neutral-800">
            <img
              src="/Artwork_Foggy_Mountains.png"
              alt="3D Artwork Foggy Mountains"
              className="h-72 w-full cursor-pointer object-cover transition duration-700 ease-out group-hover:scale-105 sm:h-96 md:h-[30rem]"
              onClick={() => setSelectedImage("/Artwork_Foggy_Mountains.png")}
            />
          </Reveal>
        </section>

        <section className="mt-16 sm:mt-20">
          <Reveal className="grid gap-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:gap-8 sm:p-8 md:grid-cols-2 md:items-center md:p-10">
            <div className="text-left">
              <h2 className="text-2xl font-semibold tracking-tight">Wichtige Informationen</h2>

              <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-neutral-400 sm:text-base">
                {artworkInfoText}
              </div>
            </div>

            <div className="group overflow-hidden rounded-2xl border border-neutral-800">
              <img
                src="/Artwork_Stanced_E46.png"
                alt="3D Artwork BMW E46"
                className="h-64 w-full cursor-pointer object-cover transition duration-700 ease-out group-hover:scale-105 sm:h-80 md:h-full"
                onClick={() => setSelectedImage("/Artwork_Stanced_E46.png")}
              />
            </div>
          </Reveal>
        </section>

        <GallerySection images={artworkGalleryImages} onPreview={setSelectedImage} />
        <ArtworksProcessSection />
      </main>

      <Footer />

      <ImageModal selectedImage={selectedImage} onClose={() => setSelectedImage(null)} />

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

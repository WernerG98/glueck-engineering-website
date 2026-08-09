import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactModal from "../components/ContactModal";
import ImageModal from "../components/ImageModal";
import FertigteileSection from "../components/sections/FertigteileSection";
import ServiceSection from "../components/sections/ServiceSection";
import ArtworksTeaserSection from "../components/sections/ArtworksTeaserSection";
import useContactForm from "../hooks/useContactForm";
import fertigteile from "../data/fertigteile";

export default function HomePage() {
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
        <section>
          <span className="eyebrow">Fertigteile · 3D-Druck · Artworks</span>

          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            Teile, die funktionieren.
            <br />
            <span className="text-neutral-400">Designs, die auffallen.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">
            Individuelle Fertigteile, technische 3D-Drucklösungen und mehrschichtige 3D-Artworks aus einer Hand.
          </p>
        </section>

        <FertigteileSection items={fertigteile} onRequest={openContactModal} />
        <ServiceSection onRequest={openContactModal} />
        <ArtworksTeaserSection onRequest={openContactModal} onPreview={setSelectedImage} />
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

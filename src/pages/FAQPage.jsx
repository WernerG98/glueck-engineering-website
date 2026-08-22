import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactModal from "../components/ContactModal";
import FloatingContactButton from "../components/FloatingContactButton";
import Reveal from "../components/Reveal";
import useContactForm from "../hooks/useContactForm";
import faq from "../data/faq";

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-neutral-900 sm:px-6 sm:py-5"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-white">{item.question}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 shrink-0 text-neutral-400 transition-transform duration-300 ${
            isOpen ? "rotate-45" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 text-sm leading-relaxed text-neutral-400 sm:px-6 sm:pb-6 sm:text-base">
          <p>{item.answer}</p>
          {item.linkTo && (
            <Link to={item.linkTo} className="mt-2 inline-block text-neutral-300 underline hover:text-white">
              {item.linkLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(0);

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

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 md:py-24">
        <Reveal>
          <span className="eyebrow">Support</span>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Häufig gestellte Fragen
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-neutral-400 sm:text-base">
            Antworten auf die wichtigsten Fragen rund um Anfrage, Material und Lieferung. Etwas fehlt? Einfach
            direkt anfragen.
          </p>
        </Reveal>

        <div className="mt-10 space-y-3 sm:mt-12">
          {faq.map((item, index) => (
            <Reveal key={item.question} delay={index * 60}>
              <FAQItem
                item={item}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
              />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 text-center sm:mt-12 sm:p-8">
          <h2 className="text-lg font-semibold sm:text-xl">Frage nicht dabei?</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400 sm:text-base">
            Einfach direkt melden, die Antwort kommt persönlich.
          </p>
          <div className="mt-5">
            <button
              onClick={() => openContactModal("Allgemeine Anfrage", "general")}
              className="inline-block rounded-lg bg-white px-6 py-3 font-medium text-neutral-950 transition hover:bg-neutral-200"
            >
              Frage stellen
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

import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactModal from "../components/ContactModal";
import useContactForm from "../hooks/useContactForm";

export default function NotFoundPage() {
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
    <div className="flex min-h-screen flex-col bg-neutral-950 text-white">
      <Header onOpenContactModal={openContactModal} />

      <main className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <span className="eyebrow">Fehler 404</span>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Seite nicht gefunden</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-400 sm:text-base">
          Die aufgerufene Seite existiert nicht oder wurde verschoben.
        </p>

        <div className="mt-8">
          <Link
            to="/"
            className="inline-block rounded-lg bg-white px-6 py-3 text-center font-medium text-neutral-950 transition hover:bg-neutral-200"
          >
            Zur Startseite
          </Link>
        </div>
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

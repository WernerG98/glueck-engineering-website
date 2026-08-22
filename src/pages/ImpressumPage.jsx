import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactModal from "../components/ContactModal";
import FloatingContactButton from "../components/FloatingContactButton";
import useContactForm from "../hooks/useContactForm";

export default function ImpressumPage() {
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

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Impressum</h1>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-neutral-400 sm:text-base">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">Angaben gemäß § 5 DDG</h2>
            <p>
              M.Eng. Werner Glück
              <br />
              Glück Engineering
              <br />
              Rebenstr. 16
              <br />
              94424 Arnstorf
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">Kontakt</h2>
            <p>
              E-Mail:{" "}
              <a href="mailto:info@glueckengineering.com" className="text-neutral-300 hover:text-white">
                info@glueckengineering.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">Umsatzsteuer-ID</h2>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:
              <br />
              DE461370222
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h2>
            <p>
              M.Eng. Werner Glück
              <br />
              Rebenstr. 16
              <br />
              94424 Arnstorf
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">Streitschlichtung</h2>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den
              allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht
              verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen
              zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">Haftung für Links</h2>
            <p>
              Unser Angebot enthält gegebenenfalls Links zu externen Websites Dritter, auf deren Inhalte wir
              keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
              Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten
              verantwortlich.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">Urheberrecht</h2>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
              deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet. Die Vervielfältigung,
              Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
              bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>
        </div>
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

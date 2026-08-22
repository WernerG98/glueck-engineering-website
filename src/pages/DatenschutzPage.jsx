import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactModal from "../components/ContactModal";
import FloatingContactButton from "../components/FloatingContactButton";
import useContactForm from "../hooks/useContactForm";

export default function DatenschutzPage() {
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
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Datenschutzerklärung</h1>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-neutral-400 sm:text-base">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">1. Verantwortlicher</h2>
            <p>
              M.Eng. Werner Glück
              <br />
              Glück Engineering
              <br />
              Rebenstr. 16
              <br />
              94424 Arnstorf
              <br />
              E-Mail:{" "}
              <a href="mailto:info@glueckengineering.com" className="text-neutral-300 hover:text-white">
                info@glueckengineering.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">2. Hosting</h2>
            <p>
              Diese Website wird bei Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA, gehostet.
              Beim Aufruf der Website verarbeitet Vercel automatisch technische Daten (u. a. IP-Adresse,
              Datum und Uhrzeit des Zugriffs, aufgerufene Seite, verwendeter Browser) in sogenannten
              Server-Logfiles. Diese Verarbeitung dient der technischen Bereitstellung und Absicherung der
              Website (Art. 6 Abs. 1 lit. f DSGVO, berechtigtes Interesse) und ist für den Betrieb einer
              Website technisch notwendig. Da Vercel Inc. in den USA ansässig ist, kann es dabei zu einer
              Datenübermittlung in ein Drittland kommen; Vercel verpflichtet sich hierfür auf die
              EU-Standardvertragsklauseln. Weitere Informationen:{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="text-neutral-300 hover:text-white"
              >
                vercel.com/legal/privacy-policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">3. Kontaktformular</h2>
            <p>
              Bei einer Anfrage über das Kontaktformular werden die eingegebenen Daten (Name,
              E-Mail-Adresse, optional Telefonnummer, Nachricht bzw. Angaben zur Anfrage sowie eine
              optional hochgeladene Datei) ausschließlich zur Bearbeitung der Anfrage und für den Fall von
              Anschlussfragen verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO
              (Vertragsanbahnung) bzw. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der
              Beantwortung von Anfragen), sofern kein Vertrag zustande kommt.
            </p>
            <p className="mt-3">
              Kommt aus einer Anfrage ein Auftrag zustande, werden die Daten zusätzlich zur
              Vertragserfüllung verarbeitet und gespeichert, und zwar so lange, wie es handels- und
              steuerrechtliche Aufbewahrungspflichten verlangen (insbesondere Rechnungen: 10 Jahre gemäß
              § 147 AO, § 257 HGB).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">4. Versand der Anfragen und Rechnungen per E-Mail</h2>
            <p>
              Für den Versand von Anfrage- und Bestätigungs-E-Mails nutzen wir den Dienst Resend
              (Resend Inc., USA). Dabei werden die im Kontaktformular angegebenen Daten sowie eine
              optional hochgeladene Datei an Resend übermittelt, um die E-Mail zuzustellen. Auch hier kann
              es zu einer Datenübermittlung in ein Drittland (USA) kommen; Resend verpflichtet sich hierfür
              auf die EU-Standardvertragsklauseln. Weitere Informationen:{" "}
              <a
                href="https://resend.com/legal/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="text-neutral-300 hover:text-white"
              >
                resend.com/legal/privacy-policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">5. Keine Cookies, kein Tracking</h2>
            <p>
              Diese Website setzt keine Cookies zu Analyse- oder Marketingzwecken ein und verwendet keine
              Tracking- oder Analyse-Tools (z. B. Google Analytics). Es findet keine Auswertung des
              Nutzungsverhaltens statt.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">6. Betroffenenrechte</h2>
            <p>Es besteht jederzeit ein Recht auf:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Auskunft über die gespeicherten personenbezogenen Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung der Daten, soweit keine Aufbewahrungspflicht entgegensteht (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
            </ul>
            <p className="mt-3">
              Anfragen dazu können gerichtet werden an{" "}
              <a href="mailto:info@glueckengineering.com" className="text-neutral-300 hover:text-white">
                info@glueckengineering.com
              </a>
              . Außerdem besteht das Recht auf Beschwerde bei einer Datenschutzaufsichtsbehörde, z. B. beim
              Bayerischen Landesamt für Datenschutzaufsicht (BayLDA).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">7. Datensicherheit</h2>
            <p>
              Diese Website nutzt aus Sicherheitsgründen eine SSL-/TLS-Verschlüsselung für die Übertragung
              vertraulicher Inhalte, erkennbar am „https://“ in der Adresszeile.
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

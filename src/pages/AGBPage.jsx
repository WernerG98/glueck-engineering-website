import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactModal from "../components/ContactModal";
import useContactForm from "../hooks/useContactForm";

export default function AGBPage() {
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
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          AGB &amp; Widerrufsbelehrung
        </h1>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-neutral-400 sm:text-base">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">1. Geltungsbereich</h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen gelten für alle Bestellungen, die als Verbraucher über
              glueck-engineering.com bei M.Eng. Werner Glück, Glück Engineering, Rebenstr. 16, 94424
              Arnstorf (nachfolgend „Verkäufer“) aufgegeben werden.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">2. Vertragsschluss</h2>
            <p>
              Die Darstellung von Produkten auf der Website stellt kein bindendes Angebot des Verkäufers
              dar. Eine über das Kontaktformular gesendete Anfrage ist unverbindlich. Der Verkäufer sendet
              daraufhin ein individuelles Angebot inklusive Preis. Der Vertrag kommt erst zustande, sobald
              dieses Angebot ausdrücklich (per E-Mail oder auf sonstigem Wege) bestätigt wird.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">3. Preise und Versandkosten</h2>
            <p>
              Alle angegebenen Preise sind Endpreise inklusive der gesetzlichen Umsatzsteuer. Zusätzlich
              anfallende Versandkosten werden im Angebot separat ausgewiesen und vor Vertragsschluss
              mitgeteilt.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">4. Zahlung</h2>
            <p>
              Die Zahlung erfolgt per Überweisung auf Rechnung, zahlbar innerhalb von 14 Tagen ohne Abzug
              nach Rechnungsstellung, sofern im Einzelfall nichts anderes vereinbart ist.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">5. Lieferung und Eigentumsvorbehalt</h2>
            <p>
              Die Lieferung erfolgt nach vollständiger Fertigung an die angegebene Lieferadresse. Die Ware
              bleibt bis zur vollständigen Bezahlung Eigentum des Verkäufers.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">6. Gewährleistung</h2>
            <p>
              Es gilt das gesetzliche Mängelhaftungsrecht. Bei Feststellung eines Mangels genügt eine
              Nachricht an{" "}
              <a href="mailto:info@glueckengineering.com" className="text-neutral-300 hover:text-white">
                info@glueckengineering.com
              </a>
              .
            </p>
          </section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
            <h2 className="mb-3 text-xl font-semibold text-white">Widerrufsbelehrung</h2>

            <h3 className="mt-4 text-base font-semibold text-white">Widerrufsrecht</h3>
            <p className="mt-2">
              Verbraucher haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu
              widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem der Verbraucher oder
              ein von ihm benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen hat.
            </p>
            <p className="mt-2">
              Um das Widerrufsrecht auszuüben, ist der Verkäufer (M.Eng. Werner Glück, Glück Engineering,
              Rebenstr. 16, 94424 Arnstorf, E-Mail: info@glueckengineering.com) mittels einer eindeutigen
              Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über den Entschluss,
              diesen Vertrag zu widerrufen, zu informieren. Dafür kann das unten stehende
              Muster-Widerrufsformular verwendet werden, vorgeschrieben ist das aber nicht.
            </p>
            <p className="mt-2">
              Zur Wahrung der Widerrufsfrist reicht es aus, dass die Mitteilung über die Ausübung des
              Widerrufsrechts vor Ablauf der Widerrufsfrist abgesendet wird.
            </p>

            <h3 className="mt-5 text-base font-semibold text-white">Folgen des Widerrufs</h3>
            <p className="mt-2">
              Im Falle eines wirksamen Widerrufs sind alle Zahlungen, die vom Verbraucher eingegangen sind,
              einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus
              ergeben, dass eine andere Art der Lieferung als die angebotene, günstigste Standardlieferung
              gewählt wurde), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen,
              an dem die Mitteilung über den Widerruf dieses Vertrags eingegangen ist. Für diese
              Rückzahlung wird dasselbe Zahlungsmittel verwendet, das bei der ursprünglichen Transaktion
              eingesetzt wurde, es sei denn, es wurde ausdrücklich etwas anderes vereinbart; in keinem Fall
              werden für diese Rückzahlung Entgelte berechnet.
            </p>
            <p className="mt-2">
              Die Rückzahlung kann verweigert werden, bis die Waren wieder zurückerhalten wurden oder bis
              der Nachweis erbracht wurde, dass die Waren zurückgesandt wurden, je nachdem, welches der
              frühere Zeitpunkt ist.
            </p>
            <p className="mt-2">
              Die Waren sind unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an
              dem der Verkäufer über den Widerruf dieses Vertrags unterrichtet wird, an den Verkäufer
              zurückzusenden. Die Frist ist gewahrt, wenn die Waren vor Ablauf der Frist von vierzehn Tagen
              abgesendet werden. Die unmittelbaren Kosten der Rücksendung der Waren trägt der Verbraucher.
            </p>
            <p className="mt-2">
              Für einen etwaigen Wertverlust der Waren muss nur aufgekommen werden, wenn dieser
              Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der
              Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.
            </p>

            <h3 className="mt-5 text-base font-semibold text-white">Ausschluss des Widerrufsrechts</h3>
            <p className="mt-2">
              Das Widerrufsrecht besteht nicht bzw. erlischt vorzeitig bei Verträgen zur Lieferung von Waren,
              die nicht vorgefertigt sind und für deren Herstellung eine individuelle Auswahl oder
              Bestimmung durch den Verbraucher maßgeblich ist oder die eindeutig auf die persönlichen
              Bedürfnisse des Verbrauchers zugeschnitten sind (§ 312g Abs. 2 Nr. 1 BGB). Dies betrifft
              insbesondere individuell nach Motiv, Maßen und Farbwünschen des Bestellers angefertigte
              3D-Artworks sowie nach dessen Vorgaben konstruierte oder gedruckte Sonderbauteile.
            </p>
          </section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
            <h2 className="mb-3 text-lg font-semibold text-white">Muster-Widerrufsformular</h2>
            <p>
              (Zum Widerruf des Vertrags kann dieses Formular ausgefüllt und an
              info@glueckengineering.com zurückgesendet werden.)
            </p>
            <div className="mt-4 space-y-2">
              <p>An: M.Eng. Werner Glück, Glück Engineering, Rebenstr. 16, 94424 Arnstorf, info@glueckengineering.com</p>
              <p>
                Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf
                der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*):
              </p>
              <p>Bestellt am (*)/erhalten am (*):</p>
              <p>Name des/der Verbraucher(s):</p>
              <p>Anschrift des/der Verbraucher(s):</p>
              <p>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):</p>
              <p>Datum:</p>
              <p className="text-xs text-neutral-500">(*) Unzutreffendes streichen.</p>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">7. Streitschlichtung</h2>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">8. Schlussbestimmungen</h2>
            <p>Es gilt das Recht der Bundesrepublik Deutschland.</p>
          </section>
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

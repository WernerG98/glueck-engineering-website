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
              Diese Allgemeinen Geschäftsbedingungen gelten für alle Bestellungen, die du als Verbraucher
              über glueck-engineering.com bei M.Eng. Werner Glück, Glück Engineering, Rebenstr. 16, 94424
              Arnstorf (nachfolgend „Verkäufer“) aufgibst.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">2. Vertragsschluss</h2>
            <p>
              Die Darstellung von Produkten auf der Website stellt kein bindendes Angebot des Verkäufers
              dar. Eine über das Kontaktformular gesendete Anfrage ist unverbindlich. Der Verkäufer sendet
              dir daraufhin ein individuelles Angebot inklusive Preis. Der Vertrag kommt erst zustande,
              wenn du dieses Angebot ausdrücklich (per E-Mail oder auf sonstigem Wege) bestätigst.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">3. Preise und Versandkosten</h2>
            <p>
              Alle angegebenen Preise sind Endpreise inklusive der gesetzlichen Umsatzsteuer. Zusätzlich
              anfallende Versandkosten werden im Angebot separat ausgewiesen und dir vor Vertragsschluss
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
              Die Lieferung erfolgt nach vollständiger Fertigung an die von dir angegebene Lieferadresse.
              Die Ware bleibt bis zur vollständigen Bezahlung Eigentum des Verkäufers.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">6. Gewährleistung</h2>
            <p>
              Es gilt das gesetzliche Mängelhaftungsrecht. Solltest du einen Mangel feststellen, kontaktiere
              uns bitte unter{" "}
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
              Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu
              widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem du oder ein von dir
              benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen hast bzw. hat.
            </p>
            <p className="mt-2">
              Um dein Widerrufsrecht auszuüben, musst du uns (M.Eng. Werner Glück, Glück Engineering,
              Rebenstr. 16, 94424 Arnstorf, E-Mail: info@glueckengineering.com) mittels einer eindeutigen
              Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über deinen Entschluss,
              diesen Vertrag zu widerrufen, informieren. Du kannst dafür das unten stehende
              Muster-Widerrufsformular verwenden, das ist aber nicht vorgeschrieben.
            </p>
            <p className="mt-2">
              Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung über die Ausübung des
              Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.
            </p>

            <h3 className="mt-5 text-base font-semibold text-white">Folgen des Widerrufs</h3>
            <p className="mt-2">
              Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die wir von dir erhalten
              haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus
              ergeben, dass du eine andere Art der Lieferung als die von uns angebotene, günstigste
              Standardlieferung gewählt hast), unverzüglich und spätestens binnen vierzehn Tagen ab dem
              Tag zurückzuzahlen, an dem die Mitteilung über deinen Widerruf dieses Vertrags bei uns
              eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du bei der
              ursprünglichen Transaktion eingesetzt hast, es sei denn, mit dir wurde ausdrücklich etwas
              anderes vereinbart; in keinem Fall werden dir wegen dieser Rückzahlung Entgelte berechnet.
            </p>
            <p className="mt-2">
              Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis
              du den Nachweis erbracht hast, dass du die Waren zurückgesandt hast, je nachdem, welches der
              frühere Zeitpunkt ist.
            </p>
            <p className="mt-2">
              Du hast die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag,
              an dem du uns über den Widerruf dieses Vertrags unterrichtest, an uns zurückzusenden. Die
              Frist ist gewahrt, wenn du die Waren vor Ablauf der Frist von vierzehn Tagen absendest. Du
              trägst die unmittelbaren Kosten der Rücksendung der Waren.
            </p>
            <p className="mt-2">
              Du musst für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf
              einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht
              notwendigen Umgang mit ihnen zurückzuführen ist.
            </p>

            <h3 className="mt-5 text-base font-semibold text-white">Ausschluss des Widerrufsrechts</h3>
            <p className="mt-2">
              Das Widerrufsrecht besteht nicht bzw. erlischt vorzeitig bei Verträgen zur Lieferung von Waren,
              die nicht vorgefertigt sind und für deren Herstellung eine individuelle Auswahl oder
              Bestimmung durch dich maßgeblich ist oder die eindeutig auf deine persönlichen Bedürfnisse
              zugeschnitten sind (§ 312g Abs. 2 Nr. 1 BGB). Dies betrifft insbesondere individuell nach
              deinem Motiv, deinen Maßen und Farbwünschen angefertigte 3D-Artworks sowie nach deinen
              Vorgaben konstruierte oder gedruckte Sonderbauteile.
            </p>
          </section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
            <h2 className="mb-3 text-lg font-semibold text-white">Muster-Widerrufsformular</h2>
            <p>
              (Wenn du den Vertrag widerrufen willst, fülle bitte dieses Formular aus und sende es an
              info@glueckengineering.com zurück.)
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

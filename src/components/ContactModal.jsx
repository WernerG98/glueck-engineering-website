import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ACCEPTING_REQUESTS } from "../data/siteStatus";

export default function ContactModal({
  contactModalOpen,
  requestSubject,
  requestType,
  formData,
  handleInputChange,
  handleFileChange,
  attachment,
  closeContactModal,
  submitContactForm,
  isSending,
}) {
  useEffect(() => {
    if (!contactModalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeContactModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [contactModalOpen, closeContactModal]);

  if (!contactModalOpen) return null;

  if (!ACCEPTING_REQUESTS) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-6 backdrop-blur-sm sm:items-center sm:py-8"
        onClick={closeContactModal}
      >
        <div
          className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl shadow-black/50"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-semibold tracking-tight">Anfragen pausiert</h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            Wir nehmen aktuell keine neuen Anfragen an, weil wir gerade die vorhandenen abarbeiten.
            Schau in Kürze wieder vorbei oder schreib uns direkt eine E-Mail.
          </p>
          <button
            onClick={closeContactModal}
            className="mt-6 rounded-lg bg-white px-6 py-3 font-medium text-neutral-950 transition hover:bg-neutral-200"
          >
            Verstanden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-6 backdrop-blur-sm sm:items-center sm:py-8"
      onClick={closeContactModal}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 p-4 shadow-2xl shadow-black/50 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{requestSubject}</h2>
          <button
            onClick={closeContactModal}
            className="rounded-lg px-3 py-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
            disabled={isSending}
          >
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Name *"
            className="rounded-xl border border-neutral-700 bg-neutral-950 transition focus:border-neutral-500 px-4 py-3 outline-none placeholder:text-neutral-500"
          />

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="E-Mail *"
            className="rounded-xl border border-neutral-700 bg-neutral-950 transition focus:border-neutral-500 px-4 py-3 outline-none placeholder:text-neutral-500"
          />

          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Telefon (optional)"
            className="rounded-xl border border-neutral-700 bg-neutral-950 transition focus:border-neutral-500 px-4 py-3 outline-none placeholder:text-neutral-500"
          />

          {requestType === "general" && (
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={6}
              placeholder="Deine Nachricht *"
              className="rounded-xl border border-neutral-700 bg-neutral-950 transition focus:border-neutral-500 px-4 py-3 outline-none placeholder:text-neutral-500"
            />
          )}

          {requestType === "product" && (
            <>
              <div>
                <label className="mb-2 block text-sm text-neutral-300">
                  Anzahl der benötigten Teile *
                </label>
                <input
                  type="number"
                  min="1"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="z. B. 1"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 transition focus:border-neutral-500 px-4 py-3 outline-none placeholder:text-neutral-500"
                />
              </div>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={6}
                placeholder="Weitere Informationen"
                className="rounded-xl border border-neutral-700 bg-neutral-950 transition focus:border-neutral-500 px-4 py-3 outline-none placeholder:text-neutral-500"
              />
            </>
          )}

          {requestType === "custom" && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-neutral-300">Ausführung *</label>
                  <select
                    name="artworkColorMode"
                    value={formData.artworkColorMode}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 transition focus:border-neutral-500 px-4 py-3 outline-none"
                  >
                    <option value="">Bitte auswählen</option>
                    <option value="Schwarz-Weiß">Schwarz-Weiß</option>
                    <option value="Farbe">Farbe</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-neutral-300">Anzahl *</label>
                  <input
                    type="number"
                    min="1"
                    name="artworkQuantity"
                    value={formData.artworkQuantity}
                    onChange={handleInputChange}
                    placeholder="z. B. 1"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 transition focus:border-neutral-500 px-4 py-3 outline-none placeholder:text-neutral-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-neutral-300">Abmessungen in cm *</label>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    name="artworkWidth"
                    value={formData.artworkWidth}
                    onChange={handleInputChange}
                    placeholder="Breite"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 transition focus:border-neutral-500 px-4 py-3 outline-none placeholder:text-neutral-500"
                  />
                  <span className="text-neutral-400">×</span>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    name="artworkHeight"
                    value={formData.artworkHeight}
                    onChange={handleInputChange}
                    placeholder="Höhe"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 transition focus:border-neutral-500 px-4 py-3 outline-none placeholder:text-neutral-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-neutral-300">Rahmen gewünscht *</label>
                  <select
                    name="artworkFrame"
                    value={formData.artworkFrame}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 transition focus:border-neutral-500 px-4 py-3 outline-none"
                  >
                    <option value="">Bitte auswählen</option>
                    <option value="Ja">Ja</option>
                    <option value="Nein">Nein</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-neutral-300">
                    Rahmenfarbe {formData.artworkFrame === "Ja" ? "*" : ""}
                  </label>
                  <select
                    name="artworkFrameColor"
                    value={formData.artworkFrameColor}
                    onChange={handleInputChange}
                    disabled={formData.artworkFrame !== "Ja"}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 transition focus:border-neutral-500 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Bitte auswählen</option>
                    <option value="Schwarz">Schwarz</option>
                    <option value="Weiß">Weiß</option>
                  </select>
                </div>
              </div>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={6}
                placeholder="Motiv / Hinweise"
                className="rounded-xl border border-neutral-700 bg-neutral-950 transition focus:border-neutral-500 px-4 py-3 outline-none placeholder:text-neutral-500"
              />
            </>
          )}

          {requestType === "service" && (
            <>
              <div>
                <label className="mb-2 block text-sm text-neutral-300">Gewünschtes Material *</label>
                <input
                  type="text"
                  name="serviceMaterial"
                  value={formData.serviceMaterial}
                  onChange={handleInputChange}
                  placeholder="Nach Empfehlung"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 transition focus:border-neutral-500 px-4 py-3 outline-none placeholder:text-neutral-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-neutral-300">Einsatzbereich *</label>
                <input
                  type="text"
                  name="serviceApplication"
                  value={formData.serviceApplication}
                  onChange={handleInputChange}
                  placeholder="z. B. Innenraum, Motorraum, Prototyp, Dekoration"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 transition focus:border-neutral-500 px-4 py-3 outline-none placeholder:text-neutral-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-neutral-300">Anzahl *</label>
                <input
                  type="number"
                  min="1"
                  name="serviceQuantity"
                  value={formData.serviceQuantity}
                  onChange={handleInputChange}
                  placeholder="z. B. 1"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 transition focus:border-neutral-500 px-4 py-3 outline-none placeholder:text-neutral-500"
                />
              </div>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={6}
                placeholder="Weitere Informationen"
                className="rounded-xl border border-neutral-700 bg-neutral-950 transition focus:border-neutral-500 px-4 py-3 outline-none placeholder:text-neutral-500"
              />
            </>
          )}

          {requestType !== "product" && requestType !== "general" && (
            <div className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3">
              <label className="mb-2 block text-sm text-neutral-300">
                Datei anhängen {requestType === "custom" ? "(empfohlen)" : "(optional)"}
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-neutral-400 file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-700 file:px-4 file:py-2 file:text-white hover:file:bg-neutral-600"
                accept=".jpg,.jpeg,.png,.webp,.svg,.pdf,.step,.stp,.stl,.3mf,.zip"
              />
              {attachment && (
                <p className="mt-2 text-sm text-neutral-400">Ausgewählt: {attachment.name}</p>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-xs text-neutral-500">
          Mit dem Absenden stimmst du der Verarbeitung deiner Daten zur Bearbeitung dieser Anfrage zu.
          Mehr dazu in unserer{" "}
          <Link to="/datenschutz" className="text-neutral-300 underline hover:text-white">
            Datenschutzerklärung
          </Link>
          .
        </p>

        <div className="mt-4 flex flex-col-reverse gap-3 border-t border-neutral-800 pt-6 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            onClick={closeContactModal}
            className="rounded-lg border border-neutral-700 px-6 py-3 transition hover:border-neutral-500 hover:bg-neutral-800"
            disabled={isSending}
          >
            Abbrechen
          </button>

          <button
            onClick={submitContactForm}
            className="rounded-lg bg-white px-6 py-3 font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:opacity-50"
            disabled={isSending}
          >
            {isSending ? "Wird gesendet..." : "Anfrage senden"}
          </button>
        </div>
      </div>
    </div>
  );
}

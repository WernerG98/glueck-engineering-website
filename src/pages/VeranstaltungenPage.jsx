import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactModal from "../components/ContactModal";
import FloatingContactButton from "../components/FloatingContactButton";
import useContactForm from "../hooks/useContactForm";
import {
  BUS_OPTIONS,
  EVENT_TITLE,
  MAX_PARTICIPANTS,
  PAYPAL_LINK,
  PRICE_PER_PERSON_LABEL,
  REGISTRATION_DEADLINE,
} from "../data/veranstaltung";

const STORAGE_KEY = "veranstaltung_password";

function formatDeadline(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChecking(true);
    setError("");

    try {
      const response = await fetch(`/api/veranstaltung?password=${encodeURIComponent(password)}`);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(response.status === 401 ? "Falsches Passwort." : data?.error || "Fehler beim Prüfen des Passworts.");
      }

      sessionStorage.setItem(STORAGE_KEY, password);
      onUnlock(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Prüfen des Passworts.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-white">Passwortgeschützt</h1>
      <p className="mt-2 text-sm text-neutral-400">Diese Seite ist nur für eingeladene Teilnehmer zugänglich.</p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none transition placeholder:text-neutral-500 focus:border-accent"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={checking || !password}
          className="rounded-lg bg-accent px-6 py-3 font-medium text-neutral-950 transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {checking ? "Wird geprüft..." : "Anmelden"}
        </button>
      </form>
    </div>
  );
}

function EventContent({ password }) {
  const [signups, setSignups] = useState([]);
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", bus: "" });
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/veranstaltung?password=${encodeURIComponent(password)}`);
      const data = await response.json();
      setSignups(data.signups || []);
      setCounts(data.counts || {});
      setTotal(data.total || 0);
    } catch {
      // Zähler bleibt auf letztem bekannten Stand
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/veranstaltung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Anmeldung fehlgeschlagen.");
      }

      setSignups(data.signups || []);
      setCounts(data.counts || {});
      setTotal(data.total || 0);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Anmeldung fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePaid = async (id, paid) => {
    try {
      const response = await fetch("/api/veranstaltung", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, paid, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setSignups(data.signups || []);
        setCounts(data.counts || {});
        setTotal(data.total || 0);
      }
    } catch {
      // still, kein Reload nötig
    }
  };

  const deadlinePassed = new Date() > new Date(`${REGISTRATION_DEADLINE}T23:59:59`);

  return (
    <div>
      <span className="eyebrow">Veranstaltung</span>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{EVENT_TITLE}</h1>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-400">
        <span>Preis: {PRICE_PER_PERSON_LABEL} pro Person</span>
        <span>Anmeldefrist: {formatDeadline(REGISTRATION_DEADLINE)}</span>
        <span>
          Plätze: {loading ? "..." : total} / {MAX_PARTICIPANTS}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {BUS_OPTIONS.map((bus) => {
          const count = counts[bus.id] ?? 0;
          const full = count >= bus.capacity;
          return (
            <div key={bus.id} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
              <p className="font-medium text-white">{bus.label}</p>
              <p className="mt-1 text-sm text-neutral-400">
                {loading ? "..." : count} / {bus.capacity} Plätze belegt
                {full && !loading && <span className="ml-2 text-accent">voll</span>}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
        {submitted ? (
          <div>
            <h2 className="text-lg font-semibold text-white">Danke für deine Anmeldung!</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              Bitte überweise {PRICE_PER_PERSON_LABEL} pro Person per PayPal.
            </p>
            {PAYPAL_LINK ? (
              <a
                href={PAYPAL_LINK}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block rounded-lg bg-accent px-6 py-3 font-medium text-neutral-950 transition hover:bg-accent-light"
              >
                Jetzt bei PayPal bezahlen
              </a>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">Der PayPal-Link folgt in Kürze.</p>
            )}
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-white">Jetzt anmelden</h2>

            {deadlinePassed ? (
              <p className="mt-3 text-sm text-neutral-400">Die Anmeldefrist ist bereits abgelaufen.</p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Vorname *"
                    className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none transition placeholder:text-neutral-500 focus:border-accent"
                  />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Nachname *"
                    className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none transition placeholder:text-neutral-500 focus:border-accent"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {BUS_OPTIONS.map((bus) => {
                    const count = counts[bus.id] ?? 0;
                    const full = count >= bus.capacity;
                    return (
                      <label
                        key={bus.id}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition ${
                          full
                            ? "cursor-not-allowed border-neutral-800 text-neutral-600"
                            : "cursor-pointer border-neutral-700 text-neutral-200 hover:border-accent"
                        }`}
                      >
                        <input
                          type="radio"
                          name="bus"
                          value={bus.id}
                          disabled={full}
                          checked={formData.bus === bus.id}
                          onChange={(e) => setFormData({ ...formData, bus: e.target.value })}
                        />
                        {bus.label} ({count}/{bus.capacity})
                      </label>
                    );
                  })}
                </div>

                {submitError && <p className="text-sm text-red-400">{submitError}</p>}

                <button
                  type="submit"
                  disabled={submitting || !formData.firstName || !formData.lastName || !formData.bus}
                  className="mt-2 rounded-lg bg-accent px-6 py-3 font-medium text-neutral-950 transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Wird gesendet..." : "Anmelden"}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      <div className="mt-8">
        <button
          onClick={() => setShowAdmin((v) => !v)}
          className="text-sm text-neutral-500 underline hover:text-neutral-300"
        >
          {showAdmin ? "Admin-Ansicht ausblenden" : "Admin-Ansicht anzeigen"}
        </button>
      </div>

      {showAdmin && (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-6">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-500">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Bus</th>
                <th className="pb-2">Bezahlt</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((entry) => (
                <tr key={entry.id} className="border-b border-neutral-900">
                  <td className="py-2 pr-4 text-neutral-200">
                    {entry.firstName} {entry.lastName}
                  </td>
                  <td className="py-2 pr-4 text-neutral-400">
                    {BUS_OPTIONS.find((b) => b.id === entry.bus)?.label || entry.bus}
                  </td>
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={entry.paid}
                      onChange={(e) => togglePaid(entry.id, e.target.checked)}
                      className="h-4 w-4 accent-accent"
                    />
                  </td>
                </tr>
              ))}
              {signups.length === 0 && !loading && (
                <tr>
                  <td colSpan={3} className="py-4 text-neutral-500">
                    Noch keine Anmeldungen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function VeranstaltungenPage() {
  const [password, setPassword] = useState(null);
  const [checkedStorage, setCheckedStorage] = useState(false);

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

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) setPassword(stored);
    setCheckedStorage(true);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Header onOpenContactModal={openContactModal} />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 md:py-24">
        {checkedStorage && (password ? <EventContent password={password} /> : <PasswordGate onUnlock={setPassword} />)}
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

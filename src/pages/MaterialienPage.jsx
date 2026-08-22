import { useMemo, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactModal from "../components/ContactModal";
import FloatingContactButton from "../components/FloatingContactButton";
import Reveal from "../components/Reveal";
import useContactForm from "../hooks/useContactForm";
import materials, { materialCategories, materialFilters } from "../data/materials";

function PropertyRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-xs uppercase tracking-wide text-neutral-500">{label}</span>
      <span className="text-right text-sm text-neutral-200">{value.label}</span>
    </div>
  );
}

function MaterialCard({ material, onRequest }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 transition hover:-translate-y-1 hover:border-neutral-700 sm:p-6">
      <div>
        <h3 className="text-xl font-semibold text-white sm:text-2xl">{material.name}</h3>
        <p className="mt-1 text-sm text-neutral-400">{material.tagline}</p>
      </div>

      <div className="mt-4 divide-y divide-neutral-800 border-y border-neutral-800">
        <PropertyRow label="Hitzebeständigkeit" value={material.heat} />
        <PropertyRow label="Festigkeit" value={material.strength} />
        <PropertyRow label="Flexibilität" value={material.flex} />
        <PropertyRow label="UV-Beständigkeit" value={material.uv} />
        <PropertyRow label="Außentauglichkeit" value={material.weather} />
        <PropertyRow label="Druckschwierigkeit" value={material.difficulty} />
      </div>

      <div className="mt-4 flex-1">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Gut geeignet für</span>
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-neutral-300">
          {material.goodFor.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-neutral-600">–</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <button
          onClick={() => onRequest(`3D-Druck Dienstleistung: ${material.name}`, "service")}
          className="w-full rounded-lg border border-neutral-700 py-3 text-center text-sm font-medium transition hover:border-neutral-500 hover:bg-neutral-800"
        >
          Anfrage mit {material.name}
        </button>
      </div>
    </div>
  );
}

export default function MaterialienPage() {
  const [activeFilter, setActiveFilter] = useState("alle");

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

  const groupedMaterials = useMemo(() => {
    const list =
      activeFilter === "alle" ? materials : materials.filter((material) => material.tags.includes(activeFilter));

    return materialCategories
      .map((category) => ({
        ...category,
        items: list.filter((material) => material.category === category.id),
      }))
      .filter((category) => category.items.length > 0);
  }, [activeFilter]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Header onOpenContactModal={openContactModal} />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:py-24">
        <section>
          <Reveal>
            <span className="eyebrow">Material-Guide</span>

            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              Welches Material passt zu deinem Projekt?
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">
              Wir drucken ausschließlich mit Filamenten von Bambu Lab. Die technischen Werte hier stammen direkt
              von den Herstellerangaben und helfen dir bei der Einschätzung, welches Material zu deinem Vorhaben
              passt. Unsicher? Wir beraten dich gerne bei der Anfrage.
            </p>
          </Reveal>
        </section>

        <section className="mt-10 sm:mt-12">
          <Reveal className="flex flex-wrap gap-2">
            {materialFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={[
                  "rounded-lg border px-4 py-2 text-sm font-medium transition",
                  activeFilter === filter.id
                    ? "border-accent bg-neutral-800/80 text-white"
                    : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white",
                ].join(" ")}
              >
                {filter.label}
              </button>
            ))}
          </Reveal>

          {groupedMaterials.map((category) => (
            <div key={category.id} className="mt-10 first:mt-6">
              <Reveal>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
                  {category.label}
                </h2>
              </Reveal>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.items.map((material, index) => (
                  <Reveal key={material.id} delay={index * 80} className="h-full">
                    <MaterialCard material={material} onRequest={openContactModal} />
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </section>

        <Reveal>
          <p className="mt-10 text-xs leading-relaxed text-neutral-600">
            Werte für Hitzebeständigkeit (HDT bei 0,45 MPa) und Festigkeit (Biegefestigkeit XY) laut{" "}
            <a
              href="https://bambulab.com/en-us/filament/guide"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-neutral-400"
            >
              Herstellerangaben von Bambu Lab
            </a>
            . Die UV-Beständigkeit wird dort nicht als Kennzahl veröffentlicht und basiert auf allgemein
            anerkannten materialwissenschaftlichen Einschätzungen des jeweiligen Kunststofftyps. Alle Angaben ohne
            Gewähr und abhängig von Bauteilgeometrie, Druckausrichtung und Einsatzbedingungen. Bei besonderen
            Anforderungen sprich uns direkt an.
          </p>
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

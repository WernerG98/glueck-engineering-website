import { useRef, useState } from "react";
import BeforeAfterSlider from "../BeforeAfterSlider";
import Reveal from "../Reveal";

const MAX_DIMENSION = 900;

function posterize(canvas, mode) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const levels = mode === "bw" ? 5 : 3;
  const step = 255 / (levels - 1);

  for (let i = 0; i < data.length; i += 4) {
    if (mode === "bw") {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const value = Math.round(Math.round(gray / step) * step);
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
    } else {
      data[i] = Math.round(Math.round(data[i] / step) * step);
      data[i + 1] = Math.round(Math.round(data[i + 1] / step) * step);
      data[i + 2] = Math.round(Math.round(data[i + 2] / step) * step);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export default function ArtworkPreviewTool({ onRequest }) {
  const [originalSrc, setOriginalSrc] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [mode, setMode] = useState("bw");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const imageRef = useRef(null);

  const runPreview = (img, selectedMode) => {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    setPreviewSrc(posterize(canvas, selectedMode));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Bitte eine Bilddatei auswählen.");
      return;
    }

    setError("");
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setOriginalSrc(reader.result);
        runPreview(img, mode);
        setIsProcessing(false);
      };
      img.onerror = () => {
        setError("Das Bild konnte nicht geladen werden.");
        setIsProcessing(false);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    if (imageRef.current) {
      setIsProcessing(true);
      setTimeout(() => {
        runPreview(imageRef.current, nextMode);
        setIsProcessing(false);
      }, 0);
    }
  };

  return (
    <section id="vorschau" className="mt-16 sm:mt-20 md:mt-24">
      <Reveal className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8 md:p-10">
        <span className="eyebrow">Vorschau</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          So könnte dein Motiv aussehen
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">
          Foto hochladen und direkt im Browser eine vereinfachte Simulation des Schicht-Looks sehen,
          ganz ohne Anfrage. Das Bild wird nicht hochgeladen oder gespeichert, alles läuft lokal auf
          diesem Gerät.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label className="inline-block cursor-pointer rounded-lg bg-accent px-6 py-3 text-center text-sm font-medium text-neutral-950 transition hover:bg-accent-light">
            {originalSrc ? "Anderes Foto wählen" : "Foto hochladen"}
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>

          {originalSrc && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleModeChange("bw")}
                className={[
                  "rounded-lg border px-4 py-2 text-sm font-medium transition",
                  mode === "bw"
                    ? "border-accent bg-neutral-800/80 text-white"
                    : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white",
                ].join(" ")}
              >
                Schwarz-Weiß
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("color")}
                className={[
                  "rounded-lg border px-4 py-2 text-sm font-medium transition",
                  mode === "color"
                    ? "border-accent bg-neutral-800/80 text-white"
                    : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white",
                ].join(" ")}
              >
                Mehrfarbig
              </button>
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {originalSrc && previewSrc && (
          <div className="mt-8">
            <div className="mx-auto max-w-xl">
              <BeforeAfterSlider
                beforeSrc={originalSrc}
                afterSrc={previewSrc}
                beforeLabel="Original"
                afterLabel="Simulation"
                className={isProcessing ? "opacity-60 transition-opacity" : "transition-opacity"}
              />
            </div>

            <p className="mt-4 text-xs leading-relaxed text-neutral-600">
              Vereinfachte Simulation zur groben Orientierung, kein exaktes Abbild des gedruckten
              Ergebnisses. Das tatsächliche Artwork wird individuell für den 3D-Druck aufbereitet.
            </p>

            <div className="mt-6">
              <button
                onClick={() => onRequest("Individuelles 3D-Artwork", "custom")}
                className="inline-block rounded-lg bg-accent px-6 py-3 text-center font-medium text-neutral-950 transition hover:bg-accent-light"
              >
                Jetzt mit diesem Motiv anfragen
              </button>
            </div>
          </div>
        )}
      </Reveal>
    </section>
  );
}

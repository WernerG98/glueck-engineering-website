import { useEffect, useRef } from "react";
import Reveal from "../Reveal";

const steps = [
  { title: "Foto senden", text: "Motiv hochladen und Wünsche im Anfrageformular angeben." },
  { title: "Entwurf & Angebot", text: "Per E-Mail kommt ein Vorabentwurf mit individuellem Angebot." },
  { title: "Freigabe", text: "Gedruckt wird erst nach Zustimmung – vorher wird nichts produziert." },
  { title: "Fertigung & Versand", text: "Das Artwork wird gefertigt, sorgfältig verpackt und versendet." },
];

// Spielt das Video stumm ab, sobald es zur Hälfte sichtbar ist, und pausiert beim Wegscrollen.
// Hat jemand selbst pausiert, startet es nicht wieder von allein.
function useAutoplayInView(ref) {
  useEffect(() => {
    const video = ref.current;
    if (!video || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let autoPaused = false;
    let userPaused = false;
    const onPause = () => {
      if (!autoPaused && !video.ended) userPaused = true;
      autoPaused = false;
    };
    const onPlay = () => {
      userPaused = false;
    };
    video.addEventListener("pause", onPause);
    video.addEventListener("play", onPlay);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!userPaused && video.paused && !video.ended) video.play().catch(() => {});
        } else if (!video.paused) {
          autoPaused = true;
          video.pause();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(video);

    return () => {
      observer.disconnect();
      video.removeEventListener("pause", onPause);
      video.removeEventListener("play", onPlay);
    };
  }, [ref]);
}

export default function ArtworksProcessSection() {
  const videoRef = useRef(null);
  useAutoplayInView(videoRef);

  return (
    <section id="ablauf-artworks" className="mt-16 sm:mt-20 md:mt-24">
      <Reveal>
        <span className="eyebrow">Ablauf</span>
        <h2 className="mb-6 mt-2 text-2xl font-semibold tracking-tight sm:mb-8 sm:text-3xl">
          Ablauf für individuelle 3D-Artworks
        </h2>
      </Reveal>

      <Reveal>
        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60">
          <video
            ref={videoRef}
            src="/Artwork_Ablauf_Video.mp4"
            poster="/Artwork_Ablauf_Video_Poster.webp"
            controls
            muted
            preload="none"
            playsInline
            aria-label="Video: Ablauf vom Foto-Upload bis zum Versand des 3D-Artworks"
            className="block w-full bg-neutral-950"
            style={{ aspectRatio: "16 / 9" }}
          />

          <ol className="grid gap-px border-t border-neutral-800 bg-neutral-800 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-3 bg-neutral-900 p-5 sm:p-6">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-accent/50 font-mono text-xs text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-300">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    </section>
  );
}

// Dezenter technischer Hintergrund für Unterseiten: goldener Lichtschein oben
// plus feines Konstruktionsraster, das nach unten ausläuft. Rein CSS, kein JS.
export default function PageBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[85vh] overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 60% at 50% -20%, rgba(212,175,55,0.14), transparent 65%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(212,175,55,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.5) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          opacity: 0.045,
          maskImage: "radial-gradient(ellipse 90% 80% at 50% 0%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 0%, black 30%, transparent 75%)",
        }}
      />
    </div>
  );
}

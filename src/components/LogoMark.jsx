// GE-Zeichen als Maske: die Form kommt aus logo.webp (transparenter Hintergrund),
// die Farbe aus Tailwind – so bleibt das Logo auf dunklem Grund gut sichtbar.
const maskStyle = {
  WebkitMaskImage: "url(/logo.webp)",
  maskImage: "url(/logo.webp)",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
  WebkitMaskSize: "contain",
  maskSize: "contain",
};

export default function LogoMark({ className = "" }) {
  return (
    <span
      role="img"
      aria-label="Glück Engineering Logo"
      className={`inline-block shrink-0 bg-accent ${className}`}
      style={maskStyle}
    />
  );
}

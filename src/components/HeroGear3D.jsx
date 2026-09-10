function GearSvg({ className = "", teeth = 14 }) {
  const outerRadius = 44;
  const innerRadius = 18;
  const toothDepth = 6;
  const steps = teeth * 2;
  const angleStep = (Math.PI * 2) / steps;
  const cx = 50;
  const cy = 50;

  let d = "";
  for (let i = 0; i <= steps; i++) {
    const angle = i * angleStep;
    const radius = i % 2 === 0 ? outerRadius : outerRadius - toothDepth;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)} `;
  }
  d += "Z";

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d={d} fill="currentColor" fillRule="evenodd" />
      <circle cx={cx} cy={cy} r={innerRadius} fill="#09090a" />
    </svg>
  );
}

export default function HeroGear3D({ className = "" }) {
  return (
    <div className={`${className} text-neutral-500`} style={{ animation: "spin 16s linear infinite" }}>
      <GearSvg className="h-full w-full drop-shadow-[0_0_10px_rgba(212,175,55,0.25)]" />
    </div>
  );
}

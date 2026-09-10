import { useEffect, useRef } from "react";

export default function TiltCard({ children, className = "", maxTilt = 6, disabled = false, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    if (disabled && ref.current) {
      ref.current.style.transform = "";
    }
  }, [disabled]);

  function handleMouseMove(e) {
    if (disabled) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateX(${(-y * maxTilt).toFixed(2)}deg) rotateY(${(x * maxTilt).toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;
  }

  function handleMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`${className} transition-transform duration-200 ease-out will-change-transform`}
      {...rest}
    >
      {children}
    </div>
  );
}

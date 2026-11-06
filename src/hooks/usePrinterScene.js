import { useEffect, useState } from "react";

function isWeakDevice() {
  const connection = navigator.connection || {};
  const cores = navigator.hardwareConcurrency || 8;
  const memory = navigator.deviceMemory || 8;
  const touch = window.matchMedia("(pointer: coarse)").matches;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  if (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || "")) return true;
  if (touch && (cores <= 4 || memory <= 2)) return true;
  if (!touch && (cores <= 2 || memory <= 2)) return true;

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return true;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    return true;
  }

  return false;
}

/**
 * enabled: darf die 3D-Szene auf diesem Gerät laufen (sonst Standbild)
 * ready:   erst true, wenn die Seite fertig geladen ist und der Browser Luft hat
 */
export default function usePrinterScene() {
  const [enabled] = useState(() => typeof window !== "undefined" && !isWeakDevice());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;
    let idleId = null;
    let timeoutId = null;

    const run = () => {
      if (!cancelled) setReady(true);
    };

    const schedule = () => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(run, { timeout: 2500 });
      } else {
        timeoutId = window.setTimeout(run, 800);
      }
    };

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      if (idleId !== null) window.cancelIdleCallback(idleId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [enabled]);

  return { enabled, ready };
}

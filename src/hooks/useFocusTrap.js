import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function useFocusTrap(active, panelRef) {
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!active || !panelRef.current) return undefined;

    previouslyFocused.current = document.activeElement;

    const panel = panelRef.current;
    const focusable = panel.querySelectorAll(FOCUSABLE_SELECTOR);
    (focusable[0] || panel).focus();

    const handleKeyDown = (event) => {
      if (event.key !== "Tab") return;

      const items = panel.querySelectorAll(FOCUSABLE_SELECTOR);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener("keydown", handleKeyDown);

    return () => {
      panel.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [active, panelRef]);
}

import { useEffect, useRef } from "react";
import useBodyScrollLock from "../hooks/useBodyScrollLock";
import useFocusTrap from "../hooks/useFocusTrap";

export default function ImageModal({ selectedImage, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!selectedImage) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, onClose]);

  useBodyScrollLock(Boolean(selectedImage));
  useFocusTrap(Boolean(selectedImage), panelRef);

  if (!selectedImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <img
        ref={panelRef}
        src={selectedImage}
        alt="Vollansicht"
        role="dialog"
        aria-modal="true"
        aria-label="Bildvorschau"
        tabIndex={-1}
        className="max-h-[85vh] max-w-full rounded-2xl object-contain outline-none"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

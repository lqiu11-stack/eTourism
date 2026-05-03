import { useEffect } from "react";
import "./PhotoLightbox.css";

export const PhotoLightbox = ({ url, onClose }) => {
  useEffect(() => {
    if (!url) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [url, onClose]);

  if (!url) return null;

  return (
    <div className="photo-lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <button
        type="button"
        className="photo-lightbox-close"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close preview"
      >
        ✕
      </button>
      <img
        src={url}
        alt="Photo preview"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

import "./AlertCard.css";

const TONE_TITLES = {
  success: "Done",
  error: "Something went wrong",
  info: "Heads up",
};

export const AlertCard = ({ state, onConfirm, onCancel }) => {
  if (!state.open) return null;
  const tone = state.tone || "info";
  const isConfirm = state.kind === "confirm";
  return (
    <div className="alert-card-overlay" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className={`alert-card alert-card--${tone}`} onClick={(e) => e.stopPropagation()}>
        <h3 className="alert-card-title">{state.title || TONE_TITLES[tone]}</h3>
        <p className="alert-card-message">{state.message}</p>
        <div className="alert-card-actions">
          {isConfirm && (
            <button
              type="button"
              className="alert-card-btn alert-card-btn--ghost"
              onClick={onCancel}
            >
              {state.cancelLabel || "Cancel"}
            </button>
          )}
          <button type="button" className="alert-card-btn" onClick={onConfirm}>
            {state.confirmLabel || (isConfirm ? "Confirm" : "OK")}
          </button>
        </div>
      </div>
    </div>
  );
};

export const RejectionModal = ({ title, reason, onClose }) => {
  return (
    <div className="eh-modal-overlay" onClick={onClose}>
      <div className="eh-modal-panel" onClick={(e) => e.stopPropagation()}>
        <h3 className="eh-modal-title">{title}</h3>
        <p className="eh-modal-label">Review message</p>
        <div className="eh-modal-body">
          {reason
            ? reason
            : "Your submission did not meet our current requirements. Please revise your activity details and try submitting again."}
        </div>
        <div className="eh-modal-actions">
          <button className="eh-modal-close" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import "./InfoTooltip.css";

export const InfoTooltip = ({ children, label = "More info" }) => (
  <span className="info-tooltip" tabIndex={0} role="img" aria-label={label}>
    <span className="info-tooltip-icon" aria-hidden="true">i</span>
    <span className="info-tooltip-bubble" role="tooltip">{children}</span>
  </span>
);

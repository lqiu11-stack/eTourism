import "../EhostRegistrate/Step.css";

export const StepProgress = ({ step }) => {
  const steps = [
    "Personal detail",
    "Experience",
    "Tell us more",
    "Contract"
  ];

  return (
    <div className="progress-container">

      {steps.map((label, index) => (
        <div
          key={index}
          className={`progress-step ${index + 1 === step ? "active" : ""}`}
        >
          <div className="progress-dot"></div>
          <span>{label}</span>
        </div>
      ))}

    </div>
  );
};
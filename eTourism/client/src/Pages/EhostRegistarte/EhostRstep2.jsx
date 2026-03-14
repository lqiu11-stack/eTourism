import { useState } from "react";
import arrowRight from "../icon/arrow-right.png";
import backIcon from "../icon/back.png";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { StepProgress } from "../EhostRegistarte/Step.jsx";

export const Eregistrate2 = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ hasExperience: "", yearsOfExperience: "", preferredCountry: "", pastJourneyInfo: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleNext = (e) => {
    e.preventDefault();
    if (form.hasExperience === "" || !form.preferredCountry) {
      setError("Please fill in all required fields.");
      return;
    }
    sessionStorage.setItem("ehost_step2", JSON.stringify({
      hasExperience: form.hasExperience === "yes",
      yearsOfExperience: Number(form.yearsOfExperience) || 0,
      preferredCountry: form.preferredCountry,
      pastJourneyInfo: form.pastJourneyInfo,
    }));
    navigate("/Eregistrate3");
  };

  return (
    <div className="join-e-host-page">
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate("/Eregistrate1")}
        aria-label="Back"
      >
        <img src={backIcon} alt="Back" className="back-icon" />
      </button>

      <div className="join-e-host-step">
        <form className="join-box" onSubmit={handleNext}>
          <h1 className="text-wrapper">Ready to become &nbsp;e-host?</h1>

          <StepProgress step={2} />

          <label className="p">Have you ever have any tourism experience?*</label>
          <div className="checkbox-group">
            <label className="checkbox-item">
              <input type="radio" name="hasExperience" value="yes" checked={form.hasExperience === "yes"} onChange={handleChange} />
              Yes, I have working experience
            </label>
            <label className="checkbox-item">
              <input type="radio" name="hasExperience" value="no" checked={form.hasExperience === "no"} onChange={handleChange} />
              No, I don&apos;t have relative working experience
            </label>
          </div>

          <label className="text-wrapper-3">How long have you been working as a tour guide?</label>
          <div className="input-with-text">
            <input className="rectangle-5" type="number" min="0" name="yearsOfExperience" value={form.yearsOfExperience} onChange={handleChange} />
            <span className="suffix-text">year</span>
          </div>

          <label className="text-wrapper-5">Which country will you prefer to work in?*</label>
          <input className="rectangle-3" type="text" name="preferredCountry" placeholder="Enter country name" value={form.preferredCountry} onChange={handleChange} />

          <label className="text-wrapper-4">Tell us your past journey</label>
          {error && <div className="error-text">{error}</div>}
          <div className="email-wrapper">
            <input className="rectangle-4" type="text" name="pastJourneyInfo" placeholder="Tell us more" value={form.pastJourneyInfo} onChange={handleChange} />
            <button type="submit" className="next-btn">
              <img src={arrowRight} alt="Next" className="next-icon" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

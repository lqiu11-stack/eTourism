import { useState } from "react";
import arrowRight from "../icon/arrow-right.png";
import backIcon from "../icon/back.png";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { StepProgress } from "../EhostRegistarte/Step.jsx";

export const Eregistrate1 = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", birthday: "", nationality: "", email: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleNext = (e) => {
    e.preventDefault();
    if (!form.name || !form.birthday || !form.nationality || !form.email) {
      setError("Please fill in all required fields.");
      return;
    }
    sessionStorage.setItem("ehost_step1", JSON.stringify(form));
    navigate("/Eregistrate2");
  };

  return (
    <div className="join-e-host-page">
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate("/login")}
        aria-label="Back"
      >
        <img src={backIcon} alt="Back" className="back-icon" />
      </button>

      <div className="join-e-host-step">
        <form className="join-box" onSubmit={handleNext}>
          <h1 className="text-wrapper">Ready to become &nbsp;e-host?</h1>

          <StepProgress step={1} />

          <label className="p">Please tell us your name*</label>
          <input className="div" type="text" name="name" placeholder="Enter your name" value={form.name} onChange={handleChange} />

          <label className="text-wrapper-3">Please tell us your birthday*</label>
          <input className="rectangle-2" type="date" name="birthday" value={form.birthday} onChange={handleChange} />

          <label className="text-wrapper-4">Please tell us your nationality*</label>
          <input className="rectangle-3" type="text" name="nationality" placeholder="Enter nationality" value={form.nationality} onChange={handleChange} />

          <label className="text-wrapper-5">Please tell us your E-mail*</label>
          {error && <div className="error-text">{error}</div>}
          <div className="email-wrapper">
            <input className="rectangle-4" type="email" name="email" placeholder="Enter email" value={form.email} onChange={handleChange} />
            <button type="submit" className="next-btn">
              <img src={arrowRight} alt="Next" className="next-icon" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

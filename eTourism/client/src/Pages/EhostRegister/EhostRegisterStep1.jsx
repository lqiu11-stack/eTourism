import { useState } from "react";
import arrowRight from "../icon/arrow-right.png";
import backIcon from "../icon/back.png";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { StepProgress } from "./Step.jsx";
import { COUNTRIES } from "../../utils/countries";

export const EhostRegisterStep1 = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => {
    const saved = JSON.parse(sessionStorage.getItem("ehost_step1") || "{}");
    return {
      name: saved.name || "",
      birthday: saved.birthday || "",
      country: saved.country || "",
      email: saved.email || "",
    };
  });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleNext = (e) => {
    e.preventDefault();
    if (!form.name || !form.birthday || !form.country || !form.email) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!COUNTRIES.includes(form.country)) {
      setError("Please select a country from the list.");
      return;
    }
    sessionStorage.setItem("ehost_step1", JSON.stringify(form));
    navigate("/register/ehost/step2");
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

          <label className="text-wrapper-4">Please tell us your country*</label>
          <input
            className="rectangle-3"
            type="text"
            name="country"
            list="country-options"
            placeholder="Start typing your country..."
            autoComplete="off"
            value={form.country}
            onChange={handleChange}
          />
          <datalist id="country-options">
            {COUNTRIES.map((c) => <option key={c} value={c} />)}
          </datalist>

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

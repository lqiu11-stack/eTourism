import { useRef, useState } from "react";
import axios from "axios";
import arrowRight from "../icon/arrow-right.png";
import backIcon from "../icon/back.png";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { StepProgress } from "./Step.jsx";
import { COUNTRIES } from "../../utils/countries";

const API_BASE = import.meta.env.VITE_API_URL;

export const EhostRegisterStep1 = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => {
    const saved = JSON.parse(sessionStorage.getItem("ehost_step1") || "{}");
    return {
      name: saved.name || "",
      displayName: saved.displayName || "",
      birthday: saved.birthday || "",
      country: saved.country || "",
      gender: saved.gender || "",
      email: saved.email || "",
      password: saved.password || "",
    };
  });
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const emailCheckSeq = useRef(0);
  const [usernameError, setUsernameError] = useState("");
  const [usernameStatus, setUsernameStatus] = useState("");
  const usernameCheckSeq = useRef(0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "email") {
      setEmailError("");
      setEmailStatus("");
    }
    if (e.target.name === "displayName") {
      setUsernameError("");
      setUsernameStatus("");
    }
  };

  const handleEmailBlur = async () => {
    const email = form.email.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    const seq = ++emailCheckSeq.current;
    setEmailStatus("Checking…");
    try {
      const { data } = await axios.get(`${API_BASE}/auth/check-email`, {
        params: { email },
      });
      if (seq !== emailCheckSeq.current) return;
      setEmailStatus("");
      setEmailError(data.available ? "" : "Email already registered.");
    } catch (err) {
      if (seq !== emailCheckSeq.current) return;
      setEmailStatus("");
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Could not verify email. Please try again.";
      setEmailError(msg);
      console.error("[ehost step1 check-email]", err);
    }
  };

  const handleUsernameBlur = async () => {
    const username = form.displayName.trim();
    if (!username) return;
    if (username.length < 3 || username.length > 30) {
      setUsernameError("Username must be 3 to 30 characters.");
      return;
    }
    if (!/^[A-Za-z0-9_.]+$/.test(username)) {
      setUsernameError("Username can only contain letters, numbers, underscores, and dots.");
      return;
    }
    const seq = ++usernameCheckSeq.current;
    setUsernameStatus("Checking…");
    try {
      const { data } = await axios.get(`${API_BASE}/auth/check-username`, {
        params: { username },
      });
      if (seq !== usernameCheckSeq.current) return;
      setUsernameStatus("");
      setUsernameError(data.available ? "" : "Username is already taken.");
    } catch (err) {
      if (seq !== usernameCheckSeq.current) return;
      setUsernameStatus("");
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Could not verify username. Please try again.";
      setUsernameError(msg);
      console.error("[ehost step1 check-username]", err);
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!form.name || !form.displayName || !form.birthday || !form.country || !form.gender || !form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }
    const username = form.displayName.trim();
    if (username.length < 3 || username.length > 30) {
      setError("Username must be 3 to 30 characters.");
      return;
    }
    if (!/^[A-Za-z0-9_.]+$/.test(username)) {
      setError("Username can only contain letters, numbers, underscores, and dots.");
      return;
    }
    if (!COUNTRIES.includes(form.country)) {
      setError("Please select a country from the list.");
      return;
    }
    if (!["female", "male", "non_binary", "prefer_not_to_say"].includes(form.gender)) {
      setError("Please select your gender.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (usernameError) {
      setError(usernameError);
      return;
    }
    if (emailError) {
      setError(emailError);
      return;
    }
    sessionStorage.setItem("ehost_step1", JSON.stringify({ ...form, displayName: username }));
    navigate("/register/ehost/step2");
  };

  return (
    <div className="join-e-host-page">
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate(-1)}
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

          <label className="text-wrapper-3">Choose a username*</label>
          <input
            className="rectangle-3"
            type="text"
            name="displayName"
            placeholder="3–30 chars: letters, numbers, _ or ."
            autoComplete="off"
            value={form.displayName}
            onChange={handleChange}
            onBlur={handleUsernameBlur}
          />
          {usernameStatus && <div className="info-text">{usernameStatus}</div>}
          {usernameError && <div className="error-text">{usernameError}</div>}

          <label className="text-wrapper-3">Please tell us your birthday*</label>
          <input className="rectangle-2" type="date" name="birthday" value={form.birthday} onChange={handleChange} required />

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

          <label className="text-wrapper-4">Please tell us your gender*</label>
          <select
            className="rectangle-3"
            name="gender"
            value={form.gender}
            onChange={handleChange}
          >
            <option value="">Select your gender...</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="non_binary">Non-binary</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>

          <label className="text-wrapper-5">Please tell us your E-mail*</label>
          <input className="rectangle-3" type="email" name="email" placeholder="Enter email" value={form.email} onChange={handleChange} onBlur={handleEmailBlur} />
          {emailStatus && <div className="info-text">{emailStatus}</div>}
          {emailError && <div className="error-text">{emailError}</div>}

          <label className="text-wrapper-5">Choose a password*</label>
          {error && <div className="error-text">{error}</div>}
          <div className="email-wrapper">
            <input className="rectangle-4" type="password" name="password" placeholder="At least 8 characters" value={form.password} onChange={handleChange} />
            <button type="submit" className="next-btn">
              <img src={arrowRight} alt="Next" className="next-icon" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

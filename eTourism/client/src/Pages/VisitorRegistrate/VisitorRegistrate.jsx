import "./VisitorRegistrate.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import backIcon from "../icon/back.png";

export const VisitorRegistrate = () => {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL;
    const [searchDate, setSearchDate] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    country: "",
    language: "",
    bio: "",
    profile_image: ""
  });
  const [agreements, setAgreements] = useState({
    is_over_18: false,
    payment_method_on_file: false,
    accepted_terms: false,
    accepted_behaviour: false,
    accepted_recording: false,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAgreementChange = (e) => {
    setAgreements({ ...agreements, [e.target.name]: e.target.checked });
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
    return age;
  };

  const allAgreementsChecked =
    agreements.is_over_18 &&
    agreements.payment_method_on_file &&
    agreements.accepted_terms &&
    agreements.accepted_behaviour &&
    agreements.accepted_recording;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const age = calculateAge(form.date_of_birth);
    if (age === null || age < 18) {
      setError("You must be at least 18 years old to register.");
      return;
    }
    if (!allAgreementsChecked) {
      setError("Please confirm all eligibility and agreement items.");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        ...form,
        accepted_terms: agreements.accepted_terms,
        accepted_behaviour: agreements.accepted_behaviour,
        accepted_recording: agreements.accepted_recording,
        payment_method_on_file: agreements.payment_method_on_file,
      });
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Registration failed. Please try again.";
      setError(message);
      setSubmitting(false);
    }
  };

const formatDate = (dt) => {
  if (!dt) return 'DD/MM/YYYY';
  const d = new Date(dt);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

  return (
    <div className="join-e-host-page">
      {/* back button */}
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate("/login")}
      >
        <img src={backIcon} alt="Back" className="back-icon" />
      </button>

      <form className="visitor-register-form" onSubmit={handleSubmit}>
      <div className="join-e-host-step">
        <div className="join-box">

          <h1 className="vtext-wrapper">Create Account</h1>

          {/* Email */}
          <label className="vp">Email*</label>
          <input
            className="vdiv"
            name="email"
            type="email"
            placeholder="Enter email"
            onChange={handleChange}
            required
          />

          {/* Password */}
          <label className="vtext-wrapper-3">Password*</label>
          <input
            className="vrectangle-2"
            name="password"
            type="password"
            placeholder="Enter password"
            onChange={handleChange}
            required
          />

          {/* First Name */}
          <label className="vtext-wrapper-4">First Name*</label>
          <input
            className="vrectangle-3"
            name="first_name"
            placeholder="Enter first name"
            onChange={handleChange}
            required
          />

          {/* Last Name */}
          <label className="vtext-wrapper-3">Last Name*</label>
          <input
            className="vrectangle-2"
            name="last_name"
            placeholder="Enter last name"
            onChange={handleChange}
            required
          />

          {/* Birthday */}
          <label className="vtext-wrapper-3">Date of Birth*</label>

            <div className="date-field">
            <input
                type="text"
                className="vrectangle-2"
                value={formatDate(searchDate)}
                readOnly
            />

            <input
                type="date"
                className="real-date-input"
                value={searchDate}
                onChange={(e) => {
                setSearchDate(e.target.value);
                setForm({ ...form, date_of_birth: e.target.value });
                }}
                required
            />
            </div>
        
          {/* Country */}
          <label className="vtext-wrapper-3">Country*</label>
          <input
            className="vrectangle-2"
            name="country"
            placeholder="Enter country"
            onChange={handleChange}
            required
          />
        </div>
      </div>
      <div className="join-e-host-step-right">
        <div className="join-box">
          {/* Language */}
          <label className="vtext-wrapper-3">Language*</label>
          <input
            className="vrectangle-2"
            name="language"
            placeholder="Enter language"
            onChange={handleChange}
            required
          />

          {/* Bio */}
          <label className="vtext-wrapper-3">Bio</label>
          <textarea
            className="vrectangle-4"
            name="bio"
            placeholder="Tell us about yourself"
            onChange={handleChange}
          />

          {/* Profile Image */}
          <label className="vtext-wrapper-3">Profile Image URL</label>
          <input
            className="vrectangle-2"
            name="profile_image"
            placeholder="Paste image URL"
            onChange={handleChange}
          />

          {/* Eligibility & agreements */}
          <div className="visitor-agreements">
            <label className="agreement-row">
              <input
                type="checkbox"
                name="is_over_18"
                checked={agreements.is_over_18}
                onChange={handleAgreementChange}
              />
              <span>I confirm I am at least 18 years old.</span>
            </label>

            <label className="agreement-row">
              <input
                type="checkbox"
                name="payment_method_on_file"
                checked={agreements.payment_method_on_file}
                onChange={handleAgreementChange}
              />
              <span>
                I have a valid payment method (e.g. credit/debit card or supported
                provider) ready for bookings.
              </span>
            </label>

            <label className="agreement-row">
              <input
                type="checkbox"
                name="accepted_terms"
                checked={agreements.accepted_terms}
                onChange={handleAgreementChange}
              />
              <span>
                I have read and agree to the{" "}
                <a href="/terms.txt" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </a>
                .
              </span>
            </label>

            <label className="agreement-row">
              <input
                type="checkbox"
                name="accepted_behaviour"
                checked={agreements.accepted_behaviour}
                onChange={handleAgreementChange}
              />
              <span>
                I agree to behave appropriately during live experiences and to follow
                the host's reasonable instructions.
              </span>
            </label>

            <label className="agreement-row">
              <input
                type="checkbox"
                name="accepted_recording"
                checked={agreements.accepted_recording}
                onChange={handleAgreementChange}
              />
              <span>
                I consent to experiences being recorded for safety, quality, and
                dispute resolution.
              </span>
            </label>
          </div>

          {error && (
            <p className="visitor-register-error" role="alert">
              {error}
            </p>
          )}

          {/* Submit button */}
          <button type="submit" className="visitor-submit" disabled={submitting}>
            {submitting ? "Registering..." : "Register →"}
          </button>

        </div>
      </div>
      </form>
    </div>
  );
};
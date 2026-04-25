import "./VisitorRegister.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import backIcon from "../icon/back.png";
import { COUNTRIES } from "../../utils/countries";
import { storage } from "../../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { convertToWebp } from "../../utils/imageConvert";

export const VisitorRegister = () => {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL;

  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    country: "",
    bio: "",
    profile_image: "",
  });
  const [agreements, setAgreements] = useState({
    is_over_18: false,
    payment_method_on_file: false,
    accepted_terms: false,
    accepted_behaviour: false,
    accepted_recording: false,
  });
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showTerms, setShowTerms] = useState(false);
  const [termsText, setTermsText] = useState("");
  const emailCheckSeq = useRef(0);

  useEffect(() => {
    fetch("/terms.txt")
      .then((r) => (r.ok ? r.text() : ""))
      .then(setTermsText)
      .catch(() => setTermsText(""));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "email") setEmailError("");
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

  const handleEmailBlur = async () => {
    const email = form.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    const seq = ++emailCheckSeq.current;
    try {
      const { data } = await axios.get(`${API_BASE}/auth/check-email`, {
        params: { email },
      });
      if (seq !== emailCheckSeq.current) return;
      setEmailError(data.available ? "" : "Email already registered.");
    } catch {
      // network/server hiccup — submit-time 409 acts as the safety net
    }
  };

  const handleProfileImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setError("");
    let uploadFile;
    try {
      uploadFile = await convertToWebp(file);
    } catch {
      setError("Failed to process image. Please try a different file.");
      setUploading(false);
      return;
    }
    const storageRef = ref(storage, `profile_images/${Date.now()}_${uploadFile.name}`);
    const task = uploadBytesResumable(storageRef, uploadFile);
    task.on(
      "state_changed",
      (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      () => {
        setError("Profile image upload failed. Please try again.");
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setForm((prev) => ({ ...prev, profile_image: url }));
        setUploading(false);
      }
    );
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
    if (!COUNTRIES.includes(form.country)) {
      setError("Please select a country from the list.");
      return;
    }
    if (!allAgreementsChecked) {
      setError("Please confirm all eligibility and agreement items.");
      return;
    }
    if (emailError) {
      setError(emailError);
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

  return (
    <div className="join-e-host-page">
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

            <label className="vp">Email*</label>
            <input
              className="vdiv"
              name="email"
              type="email"
              placeholder="Enter email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              required
            />
            {emailError && (
              <p className="visitor-inline-error" role="alert">{emailError}</p>
            )}

            <label className="vtext-wrapper-3">Password*</label>
            <input
              className="vrectangle-2"
              name="password"
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <label className="vtext-wrapper-4">First Name*</label>
            <input
              className="vrectangle-3"
              name="first_name"
              placeholder="Enter first name"
              value={form.first_name}
              onChange={handleChange}
              required
            />

            <label className="vtext-wrapper-3">Last Name*</label>
            <input
              className="vrectangle-2"
              name="last_name"
              placeholder="Enter last name"
              value={form.last_name}
              onChange={handleChange}
              required
            />

            <label className="vtext-wrapper-3">Date of Birth*</label>
            <input
              className="vrectangle-2"
              type="date"
              name="date_of_birth"
              value={form.date_of_birth}
              onChange={handleChange}
              required
            />

            <label className="vtext-wrapper-3">Country*</label>
            <input
              className="vrectangle-2"
              name="country"
              list="country-options"
              placeholder="Start typing your country..."
              autoComplete="off"
              value={form.country}
              onChange={handleChange}
              required
            />
            <datalist id="country-options">
              {COUNTRIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="join-e-host-step-right">
          <div className="join-box">
            <label className="vtext-wrapper-3">Bio</label>
            <textarea
              className="vrectangle-4"
              name="bio"
              placeholder="Tell us about yourself"
              value={form.bio}
              onChange={handleChange}
            />

            <label className="vtext-wrapper-3">Profile Image</label>
            <input
              className="visitor-file-input"
              type="file"
              accept="image/*"
              onChange={(e) => handleProfileImageUpload(e.target.files?.[0])}
            />
            {uploading && (
              <progress className="visitor-upload-progress" value={uploadProgress} max="100" />
            )}
            {form.profile_image && !uploading && (
              <img
                src={form.profile_image}
                alt="Profile preview"
                className="visitor-profile-preview"
              />
            )}

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
                  <button
                    type="button"
                    className="terms-link-btn"
                    onClick={() => setShowTerms(true)}
                  >
                    Terms of Service
                  </button>
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

            <button
              type="submit"
              className="visitor-submit"
              disabled={submitting || uploading || Boolean(emailError)}
            >
              {submitting ? "Registering..." : "Register →"}
            </button>
          </div>
        </div>
      </form>

      {showTerms && (
        <div className="modal-overlay" onClick={() => setShowTerms(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              type="button"
              onClick={() => setShowTerms(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2>Terms of Service</h2>
            <div className="modal-content">
              {(termsText || "Loading…").split("\n\n").map((para, i) => (
                <p key={i} style={{ whiteSpace: "pre-wrap" }}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

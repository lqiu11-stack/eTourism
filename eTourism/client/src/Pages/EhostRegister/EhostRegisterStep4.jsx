import { useState } from "react";
import arrowRight from "../icon/arrow-right.png";
import backIcon from "../icon/back.png";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { StepProgress } from "./Step.jsx";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

export const EhostRegisterStep4 = () => {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setError("You must agree to the Privacy and Data Use Agreement.");
      return;
    }

    const step1 = JSON.parse(sessionStorage.getItem("ehost_step1") || "{}");
    const step2 = JSON.parse(sessionStorage.getItem("ehost_step2") || "{}");
    const step3 = JSON.parse(sessionStorage.getItem("ehost_step3") || "{}");

    const payload = {
      ...step1,
      ...step2,
      ...step3,
      isContractAgreed: true,
    };

    setSubmitting(true);
    setError("");
    try {
      await axios.post(`${API_BASE}/ehost/apply`, payload);
      sessionStorage.removeItem("ehost_step1");
      sessionStorage.removeItem("ehost_step2");
      sessionStorage.removeItem("ehost_step3");
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Submission failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="join-e-host-page">
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate("/register/ehost/step3")}
        aria-label="Back"
      >
        <img src={backIcon} alt="Back" className="back-icon" />
      </button>

      <div className="join-e-host-step">
        <form className="join-box" onSubmit={handleSubmit}>
          <h1 className="text-wrapper">Ready to become &nbsp;e-host?</h1>

          <StepProgress step={4} />

          <label className="text-wrapper-3">
            Privacy Contract
          </label>
          <div className="contract-box">
            <p>
              By registering as an e-host on this platform, you agree to provide accurate
              and truthful information during the registration process. The personal
              information you provide, including but not limited to your name, contact
              details, nationality, work experience, and other relevant information, may
              be collected and processed for the purpose of verifying your identity,
              assessing your eligibility as an e-host, and managing your account on the
              platform.

              <br /><br />

              Your information may be used by the platform administrators to review your
              qualifications, confirm the authenticity of the information provided, and
              ensure compliance with our community guidelines and service policies. In
              certain cases, your information may also be used to conduct background
              checks or verification procedures to maintain the safety and reliability of
              the platform.

              <br /><br />

              The platform will take reasonable measures to protect your personal data and
              will only use your information for legitimate operational purposes,
              including service improvement, platform security, and user support. Your
              information will not be sold to third parties. However, it may be shared
              with trusted service providers or regulatory authorities when required for
              verification, legal compliance, or fraud prevention.

              <br /><br />

              By continuing with the registration process, you acknowledge that the
              information you provide may be reviewed and verified by the platform. You
              also agree that incomplete, false, or misleading information may result in
              the rejection of your application or the suspension of your account.

              <br /><br />

              If you have questions regarding the collection or use of your personal
              data, please contact the platform support team.
            </p>
          </div>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            I have read and agree to the Privacy and Data Use Agreement.
          </label>

          {error && <div className="error-text">{error}</div>}

          <div className="email-wrapper">
            <span className="space">After submitting the application form, your information will be checked by our admin. A confirmation email will be sent to your email within 2-3 working days.</span>
            <button type="submit" className="next-btn" disabled={submitting}>
              <img src={arrowRight} alt="Submit" className="next-icon" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

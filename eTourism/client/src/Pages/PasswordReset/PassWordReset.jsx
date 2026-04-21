import { useState } from "react";
import axios from "axios";
import "./style.css";
import backIcon from "../icon/back.png";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

export const PassWordReset = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleReset = async () => {
    setError("");
    setSuccess("");
    if (!email || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await axios.post(`${API_BASE}/auth/reset-password`, { email, newPassword, confirmPassword });
      setSuccess("Password reset successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Password reset failed.");
    }
  };

  return (
    <div className="password-reset">

      {/* Back Button */}
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate("/")}
      >
        <img src={backIcon} alt="Back" className="back-icon" />
      </button>

      <div className="reset-box">

        <h1 className="reset-title">Password reset</h1>

        <p className="reset-subtitle">
          Enter your registered email and add a new password.
        </p>

        <label className="reset-label">Email</label>
        <input
          type="email"
          placeholder="Your registered email"
          className="reset-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="reset-label">New password</label>
        <input
          type="password"
          placeholder="New password"
          className="reset-input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <label className="reset-label">Please type it again</label>
        <input
          type="password"
          placeholder="Enter new password again"
          className="reset-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p style={{ color: "#ff6b6b", fontSize: "14px", margin: 0 }}>{error}</p>}
        {success && <p style={{ color: "#6bffb8", fontSize: "14px", margin: 0 }}>{success}</p>}

        <button className="reset-btn" onClick={handleReset}>Reset</button>

      </div>
    </div>
  );
};
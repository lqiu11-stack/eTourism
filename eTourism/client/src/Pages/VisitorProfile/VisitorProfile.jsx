import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../EhostProfile/EhostProfile.css";

const API_BASE = import.meta.env.VITE_API_URL;
const EDITABLE = ["first_name", "last_name", "display_name"];

export const VisitorProfile = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    display_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!token || user.role !== "visitor") navigate("/login");
  }, [token, user.role, navigate]);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_BASE}/visitor/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          display_name: data.display_name || "",
        });
      } catch {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("First name and last name are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {};
      for (const k of EDITABLE) payload[k] = form[k];
      const { data } = await axios.patch(`${API_BASE}/visitor/me`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nextUser = { ...user, ...data };
      localStorage.setItem("user", JSON.stringify(nextUser));
      setNotice("Profile updated successfully.");
      setTimeout(() => navigate("/MyBooking"), 700);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ep-page">
      <header className="ep-navbar">
        <button className="ep-back" type="button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="ep-title">My profile</h1>
        <span />
      </header>

      <form className="ep-form" onSubmit={handleSubmit}>
        {loading ? (
          <div className="ep-hint">Loading profile…</div>
        ) : (
          <>
            <div className="ep-grid">
              <div>
                <label className="ep-label">First name*</label>
                <input className="ep-input" name="first_name" value={form.first_name} onChange={handleChange} />
              </div>
              <div>
                <label className="ep-label">Last name*</label>
                <input className="ep-input" name="last_name" value={form.last_name} onChange={handleChange} />
              </div>
            </div>

            <label className="ep-label">Public display name (optional)</label>
            <input
              className="ep-input"
              name="display_name"
              value={form.display_name}
              onChange={handleChange}
              placeholder="Leave blank to use your first name"
            />
            <div className="ep-hint">
              This is the name you should use in the meeting — the e-host uses it to recognise you.
            </div>

            {error && <div className="ep-error">{error}</div>}
            {notice && <div className="ep-notice">{notice}</div>}

            <button className="ep-submit" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

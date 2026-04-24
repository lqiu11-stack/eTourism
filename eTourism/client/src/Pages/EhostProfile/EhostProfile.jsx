import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import { LANGUAGES } from "../../constants/enums";
import "./EhostProfile.css";

const API_BASE = import.meta.env.VITE_API_URL;

const EDITABLE = ["first_name", "last_name", "display_name", "bio", "profile_image", "country", "language", "date_of_birth"];

const toDateInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

export const EhostProfile = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    display_name: "",
    bio: "",
    profile_image: "",
    country: "",
    language: "English",
    date_of_birth: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!token || user.role !== "ehost") navigate("/login");
  }, [token, user.role, navigate]);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_BASE}/ehost/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const me = data?.data || {};
        setForm({
          first_name: me.first_name || "",
          last_name: me.last_name || "",
          display_name: me.display_name || "",
          bio: me.bio || "",
          profile_image: me.profile_image || "",
          country: me.country || "",
          language: me.language || "English",
          date_of_birth: toDateInput(me.date_of_birth),
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

  const handleProfileImageUpload = (file) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setError("");
    const storageRef = ref(storage, `profile_images/${Date.now()}_${file.name}`);
    const task = uploadBytesResumable(storageRef, file);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return;
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const payload = {};
      for (const k of EDITABLE) payload[k] = form[k];
      const { data } = await axios.patch(`${API_BASE}/ehost/me`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = data?.data || {};
      const nextUser = { ...user, ...updated };
      localStorage.setItem("user", JSON.stringify(nextUser));
      setNotice("Profile updated successfully.");
      setTimeout(() => navigate("/EhostDashboard"), 700);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ep-page">
      <header className="ep-navbar">
        <button className="ep-back" type="button" onClick={() => navigate("/EhostDashboard")}>
          ← Back
        </button>
        <h1 className="ep-title">Update profile</h1>
        <span />
      </header>

      <form className="ep-form" onSubmit={handleSubmit}>
        {loading ? (
          <div className="ep-hint">Loading profile…</div>
        ) : (
          <>
            <div className="ep-avatar-row">
              {form.profile_image ? (
                <img src={form.profile_image} alt="profile" className="ep-avatar" />
              ) : (
                <div className="ep-avatar ep-avatar-placeholder">No photo</div>
              )}
              <div>
                <label className="ep-label">Profile photo</label>
                <input type="file" accept="image/*" onChange={(e) => handleProfileImageUpload(e.target.files[0])} disabled={uploading} />
                {uploading && <div className="ep-hint">Uploading… {uploadProgress}%</div>}
              </div>
            </div>

            <div className="ep-grid">
              <div>
                <label className="ep-label">First name</label>
                <input className="ep-input" name="first_name" value={form.first_name} onChange={handleChange} />
              </div>
              <div>
                <label className="ep-label">Last name</label>
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
            <div className="ep-hint">Visitors will see this handle on your listings instead of your real first name.</div>

            <div className="ep-grid">
              <div>
                <label className="ep-label">Country</label>
                <input className="ep-input" name="country" value={form.country} onChange={handleChange} />
              </div>
              <div>
                <label className="ep-label">Language</label>
                <select className="ep-input" name="language" value={form.language} onChange={handleChange}>
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="ep-label">Date of birth</label>
            <input className="ep-input" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} />

            <label className="ep-label">Bio</label>
            <textarea className="ep-textarea" name="bio" rows="5" value={form.bio} onChange={handleChange} />

            {error && <div className="ep-error">{error}</div>}
            {notice && <div className="ep-notice">{notice}</div>}

            <button className="ep-submit" type="submit" disabled={saving || uploading}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

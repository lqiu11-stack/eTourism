import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import {
  CATEGORIES,
  LANGUAGES,
  CONTINENTS,
  GENDER_PREFERENCES,
} from "../../constants/enums";
import "./ApplyActivity.css";

const API_BASE = import.meta.env.VITE_API_URL;

export const ApplyActivity = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!token || user.role !== "ehost") navigate("/login");
  }, [token, user.role, navigate]);

  const [form, setForm] = useState({
    title: "",
    location_name: "",
    country: "",
    continent: "",
    category: "",
    language: "English",
    description: "",
    price: "",
    duration_minutes: 60,
    max_visitors: 10,
    gender_preference: "any",
    allows_piggyback: false,
  });
  const [coverImage, setCoverImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleImageUpload = (file) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setError("");
    const storageRef = ref(storage, `cover_images/${Date.now()}_${file.name}`);
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      (snap) => {
        setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      },
      () => {
        setError("Image upload failed. Please try again.");
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setCoverImage(url);
        setUploading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return;
    if (!form.title || !form.location_name || !form.country || !form.price || !form.description) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!coverImage) {
      setError("Please upload a cover image.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE}/ehost/experiences`,
        {
          ...form,
          price: Number(form.price),
          duration_minutes: Number(form.duration_minutes) || 60,
          max_visitors: Number(form.max_visitors) || 10,
          cover_image: coverImage,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/EhostDashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit activity. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="aa-page">
      <header className="aa-navbar">
        <button className="aa-back" type="button" onClick={() => navigate("/EhostDashboard")}>
          ← Back
        </button>
        <h1 className="aa-title">Apply new activity</h1>
        <span />
      </header>

      <form className="aa-form" onSubmit={handleSubmit}>
        <label className="aa-label">Title*</label>
        <input className="aa-input" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Thailand Religious Tourism" />

        <div className="aa-grid">
          <div>
            <label className="aa-label">Location name*</label>
            <input className="aa-input" name="location_name" value={form.location_name} onChange={handleChange} />
          </div>
          <div>
            <label className="aa-label">Country*</label>
            <input className="aa-input" name="country" value={form.country} onChange={handleChange} />
          </div>
        </div>

        <div className="aa-grid">
          <div>
            <label className="aa-label">Continent</label>
            <select className="aa-input" name="continent" value={form.continent} onChange={handleChange}>
              <option value="">— select —</option>
              {CONTINENTS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="aa-label">Category</label>
            <select className="aa-input" name="category" value={form.category} onChange={handleChange}>
              <option value="">— select —</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="aa-grid">
          <div>
            <label className="aa-label">Language</label>
            <select className="aa-input" name="language" value={form.language} onChange={handleChange}>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="aa-label">Price (USD)*</label>
            <input className="aa-input" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} />
          </div>
        </div>

        <div className="aa-grid">
          <div>
            <label className="aa-label">Duration (minutes)</label>
            <input className="aa-input" name="duration_minutes" type="number" min="15" value={form.duration_minutes} onChange={handleChange} />
          </div>
          <div>
            <label className="aa-label">Max visitors</label>
            <input className="aa-input" name="max_visitors" type="number" min="1" value={form.max_visitors} onChange={handleChange} />
          </div>
        </div>

        <div className="aa-grid">
          <div>
            <label className="aa-label">Gender preference</label>
            <select className="aa-input" name="gender_preference" value={form.gender_preference} onChange={handleChange}>
              {GENDER_PREFERENCES.map((g) => (
                <option key={g} value={g}>{g.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div className="aa-checkbox-row">
            <label className="aa-checkbox">
              <input type="checkbox" name="allows_piggyback" checked={form.allows_piggyback} onChange={handleChange} />
              Allow piggyback bookings
            </label>
          </div>
        </div>

        <label className="aa-label">Description*</label>
        <textarea className="aa-textarea" name="description" rows="5" value={form.description} onChange={handleChange} />

        <label className="aa-label">Cover image*</label>
        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0])} disabled={uploading} />
        {uploading && <div className="aa-hint">Uploading… {uploadProgress}%</div>}
        {coverImage && !uploading && (
          <img src={coverImage} alt="cover preview" className="aa-preview" />
        )}

        {error && <div className="aa-error">{error}</div>}

        <button className="aa-submit" type="submit" disabled={uploading || submitting}>
          {submitting ? "Submitting…" : "Submit activity"}
        </button>
      </form>
    </div>
  );
};

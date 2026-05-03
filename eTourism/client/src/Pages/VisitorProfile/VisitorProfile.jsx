import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import { convertToWebp } from "../../utils/imageConvert";
import "../EhostProfile/EhostProfile.css";

const API_BASE = import.meta.env.VITE_API_URL;
const EDITABLE = ["first_name", "last_name", "profile_image"];

export const VisitorProfile = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    profile_image: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const uploadIdRef = useRef(0);

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
          profile_image: data.profile_image || "",
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

  const handleProfileImageUpload = async (file) => {
    if (!file) return;
    const myUploadId = ++uploadIdRef.current;
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
      (snap) => {
        if (myUploadId !== uploadIdRef.current) return;
        setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      },
      () => {
        if (myUploadId !== uploadIdRef.current) return;
        setError("Profile image upload failed. Please try again.");
        setUploading(false);
      },
      async () => {
        if (myUploadId !== uploadIdRef.current) return;
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
            <div className="ep-avatar-row">
              {form.profile_image ? (
                <img src={form.profile_image} alt="profile" className="ep-avatar" />
              ) : (
                <div className="ep-avatar ep-avatar-placeholder">No photo</div>
              )}
              <div>
                <label className="ep-label">Profile photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleProfileImageUpload(e.target.files[0])}
                  disabled={uploading}
                />
                {uploading && <div className="ep-hint">Uploading… {uploadProgress}%</div>}
              </div>
            </div>

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

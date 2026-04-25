import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import {
  CATEGORIES,
  LANGUAGES,
  CONTINENTS,
  GENDER_PREFERENCES,
} from "../../constants/enums";
import { isYouTubeUrl } from "../../utils/youtube";
import { COUNTRIES } from "../../utils/countries";
import { convertToWebp } from "../../utils/imageConvert";
import "./ApplyActivity.css";

const API_BASE = import.meta.env.VITE_API_URL;
const MAP_LIBRARIES = ["places"];
const DEFAULT_MAP_CENTER = { lat: 51.5101, lng: -0.1340 };
const mapContainerStyle = { width: "100%", height: "320px", borderRadius: "10px" };

const toDateTimeLocal = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

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
    sample_video_url: "",
    video_description: "",
    video_highlights: "",
    date_time: "",
    price_discounted: "",
    latitude: "",
    longitude: "",
    meeting_link: "",
  });
  const [coverImage, setCoverImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const minDateTime = toDateTimeLocal(new Date(Date.now() + 60 * 1000));

  const { isLoaded: mapIsLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
  });
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (!mapIsLoaded) return;
    const el = autocompleteRef.current;
    if (!el) return;

    const handler = async (event) => {
      const place = event.placePrediction?.toPlace?.() ?? event.place;
      if (!place) return;
      await place.fetchFields({
        fields: ["location", "displayName", "formattedAddress"],
      });
      if (!place.location) return;
      setForm((prev) => ({
        ...prev,
        latitude: place.location.lat(),
        longitude: place.location.lng(),
        location_name:
          prev.location_name ||
          place.displayName ||
          place.formattedAddress ||
          "",
      }));
    };

    el.addEventListener("gmp-select", handler);
    return () => el.removeEventListener("gmp-select", handler);
  }, [mapIsLoaded]);
  const onMapClick = (e) => {
    if (!e.latLng) return;
    setForm((prev) => ({ ...prev, latitude: e.latLng.lat(), longitude: e.latLng.lng() }));
  };
  const onMarkerDragEnd = (e) => {
    if (!e.latLng) return;
    setForm((prev) => ({ ...prev, latitude: e.latLng.lat(), longitude: e.latLng.lng() }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleImageUpload = async (file) => {
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
    const storageRef = ref(storage, `cover_images/${Date.now()}_${uploadFile.name}`);
    const task = uploadBytesResumable(storageRef, uploadFile);
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
    if (!COUNTRIES.includes(form.country)) {
      setError("Please select a country from the list.");
      return;
    }
    if (!form.date_time) {
      setError("Please pick a date and time for the experience.");
      return;
    }
    if (new Date(form.date_time).getTime() <= Date.now()) {
      setError("Date & time must be in the future.");
      return;
    }
    if (form.latitude === "" || form.longitude === "") {
      setError("Please pin the location on the map.");
      return;
    }
    if (form.price_discounted !== "" && Number(form.price_discounted) >= Number(form.price)) {
      setError("Discounted price must be lower than the regular price.");
      return;
    }
    if (!coverImage) {
      setError("Please upload a cover image.");
      return;
    }
    const trimmedVideoUrl = form.sample_video_url.trim();
    if (trimmedVideoUrl && !isYouTubeUrl(trimmedVideoUrl)) {
      setError("Please paste a valid YouTube link (e.g. https://youtube.com/watch?v=...).");
      return;
    }
    const trimmedMeetingLink = form.meeting_link.trim();
    if (!trimmedMeetingLink) {
      setError("Please add a meeting link for your live experience.");
      return;
    }
    if (!/^https?:\/\//i.test(trimmedMeetingLink)) {
      setError("Meeting link must start with http:// or https://.");
      return;
    }
    const highlightsArray = form.video_highlights
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    setError("");
    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE}/ehost/experiences`,
        {
          ...form,
          price: Number(form.price),
          price_discounted: form.price_discounted === "" ? null : Number(form.price_discounted),
          duration_minutes: Number(form.duration_minutes) || 60,
          max_visitors: Number(form.max_visitors) || 10,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          date_time: new Date(form.date_time).toISOString(),
          cover_image: coverImage,
          sample_video_url: trimmedVideoUrl || null,
          video_description: form.video_description.trim() || null,
          video_highlights: highlightsArray.length ? highlightsArray : null,
          meeting_link: trimmedMeetingLink,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/EhostDashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit experience. Please try again.");
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
        <h1 className="aa-title">Apply for new experience</h1>
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
            <input
              className="aa-input"
              name="country"
              list="aa-country-options"
              autoComplete="off"
              placeholder="Start typing your country..."
              value={form.country}
              onChange={handleChange}
            />
            <datalist id="aa-country-options">
              {COUNTRIES.map((c) => <option key={c} value={c} />)}
            </datalist>
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
            <label className="aa-label">Date & time*</label>
            <input className="aa-input" name="date_time" type="datetime-local" min={minDateTime} value={form.date_time} onChange={handleChange} />
          </div>
        </div>

        <div className="aa-grid">
          <div>
            <label className="aa-label">Price (USD)*</label>
            <input className="aa-input" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} />
          </div>
          <div>
            <label className="aa-label">Discounted price (optional)</label>
            <input className="aa-input" name="price_discounted" type="number" min="0" step="0.01" value={form.price_discounted} onChange={handleChange} />
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

        <label className="aa-label">Pin the location on the map*</label>
        {mapIsLoaded ? (
          <>
            <gmp-place-autocomplete
              ref={autocompleteRef}
              class="aa-input"
              placeholder="Search a place (e.g. Eiffel Tower)"
            ></gmp-place-autocomplete>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={
                form.latitude !== "" && form.longitude !== ""
                  ? { lat: Number(form.latitude), lng: Number(form.longitude) }
                  : DEFAULT_MAP_CENTER
              }
              zoom={form.latitude !== "" && form.longitude !== "" ? 14 : 2}
              onClick={onMapClick}
            >
              {form.latitude !== "" && form.longitude !== "" && (
                <Marker
                  position={{ lat: Number(form.latitude), lng: Number(form.longitude) }}
                  draggable
                  onDragEnd={onMarkerDragEnd}
                />
              )}
            </GoogleMap>
            {form.latitude !== "" && form.longitude !== "" && (
              <div className="aa-hint">
                Selected: {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}
              </div>
            )}
          </>
        ) : (
          <div className="aa-hint">Loading map…</div>
        )}

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

        <label className="aa-label">Meeting link*</label>
        <input
          className="aa-input"
          type="url"
          name="meeting_link"
          value={form.meeting_link}
          onChange={handleChange}
          placeholder="https://meet.google.com/... or https://zoom.us/j/..."
        />
        <div className="aa-hint">Visitors will join your live experience using this link.</div>

        <label className="aa-label">Cover image*</label>
        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0])} disabled={uploading} />
        {uploading && <div className="aa-hint">Uploading… {uploadProgress}%</div>}
        {coverImage && !uploading && (
          <img src={coverImage} alt="cover preview" className="aa-preview" />
        )}

        <label className="aa-label">Sample video (YouTube link)</label>
        <input
          className="aa-input"
          type="url"
          name="sample_video_url"
          value={form.sample_video_url}
          onChange={handleChange}
          placeholder="https://youtube.com/watch?v=..."
        />

        <label className="aa-label">Video description</label>
        <textarea
          className="aa-textarea"
          name="video_description"
          rows="4"
          value={form.video_description}
          onChange={handleChange}
          placeholder="A short paragraph or two about what visitors will see in the sample video. Separate paragraphs with a blank line."
        />

        <label className="aa-label">Video highlights</label>
        <textarea
          className="aa-textarea"
          name="video_highlights"
          rows="4"
          value={form.video_highlights}
          onChange={handleChange}
          placeholder={"One highlight per line, e.g.\nVisit the oldest temple in the city\nMeet local artisans\nTaste street food"}
        />

        {error && <div className="aa-error">{error}</div>}

        <button className="aa-submit" type="submit" disabled={uploading || submitting}>
          {submitting ? "Submitting…" : "Submit experience"}
        </button>
      </form>
    </div>
  );
};

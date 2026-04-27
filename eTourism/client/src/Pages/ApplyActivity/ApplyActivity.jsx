import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
const MIN_ADDITIONAL_IMAGES = 3;
const MAX_ADDITIONAL_IMAGES = 6;
const MAP_LIBRARIES = ["places"];
const DEFAULT_MAP_CENTER = { lat: 51.5101, lng: -0.1340 };
const mapContainerStyle = { width: "100%", height: "320px", borderRadius: "10px" };

const toDateTimeLocal = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const extractCountryFromComponents = (components) => {
  if (!Array.isArray(components)) return "";
  const match = components.find((c) => (c.types || []).includes("country"));
  if (!match) return "";
  const name = match.longText || match.long_name || "";
  return COUNTRIES.includes(name) ? name : "";
};

const reverseGeocodeCountry = async (lat, lng) => {
  if (!window.google?.maps?.Geocoder) return "";
  try {
    const geocoder = new window.google.maps.Geocoder();
    const { results } = await geocoder.geocode({ location: { lat, lng } });
    for (const result of results || []) {
      const country = extractCountryFromComponents(result.address_components);
      if (country) return country;
    }
  } catch {
    /* fall through to empty result */
  }
  return "";
};

export const ApplyActivity = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEdit = Boolean(editId);
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
  const [additionalImages, setAdditionalImages] = useState([]);
  const [additionalUploading, setAdditionalUploading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [meetingLinkOnly, setMeetingLinkOnly] = useState(false);
  const minDateTime = toDateTimeLocal(new Date(Date.now() + 60 * 1000));

  useEffect(() => {
    if (!isEdit || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/ehost/experiences/${editId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const exp = data?.data;
        if (!exp || cancelled) return;
        if (exp.status !== "pending" && exp.status !== "approved") {
          alert("This experience can no longer be edited.");
          navigate("/EhostDashboard");
          return;
        }
        setMeetingLinkOnly(exp.status === "approved");
        const highlights = Array.isArray(exp.video_highlights)
          ? exp.video_highlights.join("\n")
          : (exp.video_highlights || "");
        setForm({
          title: exp.title || "",
          location_name: exp.location_name || "",
          country: exp.country || "",
          continent: exp.continent || "",
          category: exp.category || "",
          language: exp.language || "English",
          description: exp.description || "",
          price: exp.price ?? "",
          duration_minutes: exp.duration_minutes ?? 60,
          max_visitors: exp.max_visitors ?? 10,
          gender_preference: exp.gender_preference || "any",
          allows_piggyback: Boolean(exp.allows_piggyback),
          sample_video_url: exp.sample_video_url || "",
          video_description: exp.video_description || "",
          video_highlights: highlights,
          date_time: exp.date_time ? toDateTimeLocal(new Date(exp.date_time)) : "",
          price_discounted: exp.price_discounted ?? "",
          latitude: exp.latitude ?? "",
          longitude: exp.longitude ?? "",
          meeting_link: exp.meeting_link || "",
        });
        setCoverImage(exp.cover_image || "");
        setAdditionalImages(Array.isArray(exp.additional_images) ? exp.additional_images : []);
      } catch (err) {
        alert(err.response?.data?.message || "Failed to load experience.");
        navigate("/EhostDashboard");
      }
    })();
    return () => { cancelled = true; };
  }, [isEdit, editId, token, navigate]);

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
        fields: ["location", "displayName", "formattedAddress", "addressComponents"],
      });
      if (!place.location) return;
      const country = extractCountryFromComponents(place.addressComponents);
      setForm((prev) => ({
        ...prev,
        latitude: place.location.lat(),
        longitude: place.location.lng(),
        location_name:
          prev.location_name ||
          place.displayName ||
          place.formattedAddress ||
          "",
        country: country || prev.country,
      }));
    };

    el.addEventListener("gmp-select", handler);
    return () => el.removeEventListener("gmp-select", handler);
  }, [mapIsLoaded]);
  const applyMapPick = async (lat, lng) => {
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    const country = await reverseGeocodeCountry(lat, lng);
    if (country) setForm((prev) => ({ ...prev, country }));
  };
  const onMapClick = (e) => {
    if (!e.latLng) return;
    applyMapPick(e.latLng.lat(), e.latLng.lng());
  };
  const onMarkerDragEnd = (e) => {
    if (!e.latLng) return;
    applyMapPick(e.latLng.lat(), e.latLng.lng());
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

  const uploadOneAdditionalImage = (file) => new Promise((resolve, reject) => {
    (async () => {
      let uploadFile;
      try {
        uploadFile = await convertToWebp(file);
      } catch {
        reject(new Error("Failed to process image. Please try a different file."));
        return;
      }
      const storageRef = ref(storage, `additional_images/${Date.now()}_${uploadFile.name}`);
      const task = uploadBytesResumable(storageRef, uploadFile);
      task.on(
        "state_changed",
        null,
        () => reject(new Error("Image upload failed. Please try again.")),
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            resolve(url);
          } catch (err) {
            reject(err);
          }
        }
      );
    })();
  });

  const handleAdditionalImagesUpload = async (files) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_ADDITIONAL_IMAGES - additionalImages.length;
    if (remaining <= 0) return;
    if (files.length > remaining) {
      setError(`You can upload at most ${MAX_ADDITIONAL_IMAGES} additional photos.`);
      files = files.slice(0, remaining);
      if (files.length === 0) return;
    } else {
      setError("");
    }
    setAdditionalUploading(true);
    try {
      for (const file of files) {
        const url = await uploadOneAdditionalImage(file);
        setAdditionalImages((prev) => [...prev, url]);
      }
    } catch (err) {
      setError(err.message || "Image upload failed. Please try again.");
    } finally {
      setAdditionalUploading(false);
    }
  };

  const removeAdditionalImage = (index) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading || additionalUploading) return;
    if (meetingLinkOnly) {
      const trimmedMeetingLink = form.meeting_link.trim();
      if (!trimmedMeetingLink) {
        setError("Please add a meeting link for your live experience.");
        return;
      }
      if (!/^https?:\/\//i.test(trimmedMeetingLink)) {
        setError("Meeting link must start with http:// or https://.");
        return;
      }
      setError("");
      setSubmitting(true);
      try {
        await axios.put(
          `${API_BASE}/ehost/experiences/${editId}`,
          { meeting_link: trimmedMeetingLink },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        navigate("/EhostDashboard");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to update meeting link. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }
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
    if (additionalImages.length < MIN_ADDITIONAL_IMAGES) {
      setError(`Please upload at least ${MIN_ADDITIONAL_IMAGES} additional photos.`);
      return;
    }
    if (additionalImages.length > MAX_ADDITIONAL_IMAGES) {
      setError(`You can upload at most ${MAX_ADDITIONAL_IMAGES} additional photos.`);
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
      const payload = {
        ...form,
        price: Number(form.price),
        price_discounted: form.price_discounted === "" ? null : Number(form.price_discounted),
        duration_minutes: Number(form.duration_minutes) || 60,
        max_visitors: Number(form.max_visitors) || 10,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        date_time: new Date(form.date_time).toISOString(),
        cover_image: coverImage,
        additional_images: additionalImages,
        sample_video_url: trimmedVideoUrl || null,
        video_description: form.video_description.trim() || null,
        video_highlights: highlightsArray.length ? highlightsArray : null,
        meeting_link: trimmedMeetingLink,
      };
      const cfg = { headers: { Authorization: `Bearer ${token}` } };
      if (isEdit) {
        await axios.put(`${API_BASE}/ehost/experiences/${editId}`, payload, cfg);
      } else {
        await axios.post(`${API_BASE}/ehost/experiences`, payload, cfg);
      }
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
        <h1 className="aa-title">{meetingLinkOnly ? "Edit meeting link" : isEdit ? "Edit experience" : "Apply for new experience"}</h1>
        <span />
      </header>

      <form className="aa-form" onSubmit={handleSubmit}>
        {meetingLinkOnly && (
          <div className="aa-hint">
            This experience has been approved. Only the meeting link can be edited.
          </div>
        )}
        <label className="aa-label">Title*</label>
        <input className="aa-input" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Thailand Religious Tourism" disabled={meetingLinkOnly} />

        <div className="aa-grid">
          <div>
            <label className="aa-label">Location name*</label>
            <input className="aa-input" name="location_name" value={form.location_name} onChange={handleChange} disabled={meetingLinkOnly} />
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
              disabled={meetingLinkOnly}
            />
            <datalist id="aa-country-options">
              {COUNTRIES.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
        </div>

        <div className="aa-grid">
          <div>
            <label className="aa-label">Continent</label>
            <select className="aa-input" name="continent" value={form.continent} onChange={handleChange} disabled={meetingLinkOnly}>
              <option value="">— select —</option>
              {CONTINENTS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="aa-label">Category</label>
            <select className="aa-input" name="category" value={form.category} onChange={handleChange} disabled={meetingLinkOnly}>
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
            <select className="aa-input" name="language" value={form.language} onChange={handleChange} disabled={meetingLinkOnly}>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="aa-label">Date & time*</label>
            <input className="aa-input" name="date_time" type="datetime-local" min={minDateTime} value={form.date_time} onChange={handleChange} disabled={meetingLinkOnly} />
          </div>
        </div>

        <div className="aa-grid">
          <div>
            <label className="aa-label">Price (USD)*</label>
            <input className="aa-input" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} disabled={meetingLinkOnly} />
          </div>
          <div>
            <label className="aa-label">Discounted price (optional)</label>
            <input className="aa-input" name="price_discounted" type="number" min="0" step="0.01" value={form.price_discounted} onChange={handleChange} disabled={meetingLinkOnly} />
          </div>
        </div>

        <div className="aa-grid">
          <div>
            <label className="aa-label">Duration (minutes)</label>
            <input className="aa-input" name="duration_minutes" type="number" min="15" value={form.duration_minutes} onChange={handleChange} disabled={meetingLinkOnly} />
          </div>
          <div>
            <label className="aa-label">Max visitors</label>
            <input className="aa-input" name="max_visitors" type="number" min="1" value={form.max_visitors} onChange={handleChange} disabled={meetingLinkOnly} />
          </div>
        </div>

        <label className="aa-label">Pin the location on the map*</label>
        {mapIsLoaded ? (
          <>
            {!meetingLinkOnly && (
              <gmp-place-autocomplete
                ref={autocompleteRef}
                class="aa-input"
                placeholder="Search a place (e.g. Eiffel Tower)"
              ></gmp-place-autocomplete>
            )}
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={
                form.latitude !== "" && form.longitude !== ""
                  ? { lat: Number(form.latitude), lng: Number(form.longitude) }
                  : DEFAULT_MAP_CENTER
              }
              zoom={form.latitude !== "" && form.longitude !== "" ? 14 : 2}
              onClick={meetingLinkOnly ? undefined : onMapClick}
            >
              {form.latitude !== "" && form.longitude !== "" && (
                <Marker
                  position={{ lat: Number(form.latitude), lng: Number(form.longitude) }}
                  draggable={!meetingLinkOnly}
                  onDragEnd={meetingLinkOnly ? undefined : onMarkerDragEnd}
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
            <select className="aa-input" name="gender_preference" value={form.gender_preference} onChange={handleChange} disabled={meetingLinkOnly}>
              {GENDER_PREFERENCES.map((g) => (
                <option key={g} value={g}>{g.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div className="aa-checkbox-row">
            <label className="aa-checkbox">
              <input type="checkbox" name="allows_piggyback" checked={form.allows_piggyback} onChange={handleChange} disabled={meetingLinkOnly} />
              Allow piggyback bookings
            </label>
          </div>
        </div>

        <label className="aa-label">Description*</label>
        <textarea className="aa-textarea" name="description" rows="5" value={form.description} onChange={handleChange} disabled={meetingLinkOnly} />

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
        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0])} disabled={uploading || meetingLinkOnly} />
        {uploading && <div className="aa-hint">Uploading… {uploadProgress}%</div>}
        {coverImage && !uploading && (
          <img src={coverImage} alt="cover preview" className="aa-preview" />
        )}

        <label className="aa-label">Additional photos* ({MIN_ADDITIONAL_IMAGES}–{MAX_ADDITIONAL_IMAGES})</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            handleAdditionalImagesUpload(Array.from(e.target.files));
            e.target.value = "";
          }}
          disabled={
            additionalUploading ||
            meetingLinkOnly ||
            additionalImages.length >= MAX_ADDITIONAL_IMAGES
          }
        />
        {additionalUploading && <div className="aa-hint">Uploading additional photos…</div>}
        {additionalImages.length > 0 && (
          <div className="aa-additional-grid">
            {additionalImages.map((url, i) => (
              <div key={url} className="aa-additional-thumb">
                <img src={url} alt={`additional ${i + 1}`} className="aa-preview" />
                {!meetingLinkOnly && (
                  <button
                    type="button"
                    className="aa-additional-remove"
                    onClick={() => removeAdditionalImage(i)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="aa-hint">
          {additionalImages.length} of {MAX_ADDITIONAL_IMAGES} uploaded.
          {additionalImages.length < MIN_ADDITIONAL_IMAGES &&
            ` Add at least ${MIN_ADDITIONAL_IMAGES - additionalImages.length} more.`}
        </div>

        <label className="aa-label">Sample video (YouTube link)</label>
        <input
          className="aa-input"
          type="url"
          name="sample_video_url"
          value={form.sample_video_url}
          onChange={handleChange}
          placeholder="https://youtube.com/watch?v=..."
          disabled={meetingLinkOnly}
        />

        <label className="aa-label">Video description</label>
        <textarea
          className="aa-textarea"
          name="video_description"
          rows="4"
          value={form.video_description}
          onChange={handleChange}
          placeholder="A short paragraph or two about what visitors will see in the sample video. Separate paragraphs with a blank line."
          disabled={meetingLinkOnly}
        />

        <label className="aa-label">Video highlights</label>
        <textarea
          className="aa-textarea"
          name="video_highlights"
          rows="4"
          value={form.video_highlights}
          onChange={handleChange}
          placeholder={"One highlight per line, e.g.\nVisit the oldest temple in the city\nMeet local artisans\nTaste street food"}
          disabled={meetingLinkOnly}
        />

        {error && <div className="aa-error">{error}</div>}

        <button className="aa-submit" type="submit" disabled={uploading || additionalUploading || submitting}>
          {submitting ? "Submitting…" : meetingLinkOnly ? "Save meeting link" : isEdit ? "Save changes" : "Submit experience"}
        </button>
      </form>
    </div>
  );
};

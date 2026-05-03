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
import { InfoTooltip } from "../../components/InfoTooltip";
import { PhotoLightbox } from "../../components/PhotoLightbox";
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
    allows_souvenir_addon: false,
    souvenir_price: "",
    allows_video_addon: false,
    video_addon_price: "",
    max_piggyback_visitors: "",
  });
  const [coverImage, setCoverImage] = useState("");
  const [additionalImages, setAdditionalImages] = useState([]);
  const [additionalUploading, setAdditionalUploading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [wasApproved, setWasApproved] = useState(false);
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showGenderWarning, setShowGenderWarning] = useState(false);
  const [genderWarningAcknowledged, setGenderWarningAcknowledged] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const minDateTime = toDateTimeLocal(new Date(Date.now() + 60 * 1000));

  const STEPS = [
    { n: 1, title: "The basics", subtitle: "Tell viewers where they're going and what makes it yours." },
    { n: 2, title: "Cover & schedule", subtitle: "How it'll appear in the catalogue and when it runs." },
    { n: 3, title: "Preferences & extras", subtitle: "Set who can book, piggyback options, and on-the-day add-ons." },
  ];

  const goToStep = (n) => {
    setError("");
    setCurrentStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        setWasApproved(exp.status === "approved");
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
          allows_souvenir_addon: Boolean(exp.allows_souvenir_addon),
          souvenir_price: exp.souvenir_price ?? "",
          allows_video_addon: Boolean(exp.allows_video_addon),
          video_addon_price: exp.video_addon_price ?? "",
          max_piggyback_visitors: exp.max_piggyback_visitors ?? "",
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
    if (name === "gender_preference") setGenderWarningAcknowledged(false);
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
      const storageRef = ref(storage, `detail_page_image/${Date.now()}_${uploadFile.name}`);
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
    if (!form.title || !form.location_name || !form.country || !form.price || !form.description) {
      setError("Please fill in all required fields.");
      return;
    }
    if (
      (form.gender_preference === "female_only" || form.gender_preference === "male_only") &&
      !genderWarningAcknowledged
    ) {
      setShowGenderWarning(true);
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
    if (form.allows_piggyback && (form.price_discounted === "" || Number.isNaN(Number(form.price_discounted)) || Number(form.price_discounted) < 0)) {
      setError("Please set a piggyback price (£0 or more) when piggyback bookings are enabled.");
      return;
    }
    if (form.allows_piggyback) {
      const cap = Number(form.max_piggyback_visitors);
      if (form.max_piggyback_visitors === "" || !Number.isInteger(cap) || cap < 1) {
        setError("Please set a max piggyback tickets (1 or more) when piggyback bookings are enabled.");
        return;
      }
    }
    if (form.price_discounted !== "" && Number(form.price_discounted) >= Number(form.price)) {
      setError("Discounted price must be lower than the regular price.");
      return;
    }
    if (form.allows_souvenir_addon) {
      if (form.souvenir_price === "" || Number(form.souvenir_price) < 0 || Number.isNaN(Number(form.souvenir_price))) {
        setError("Please set a souvenir price (£0 or more) when the souvenir add-on is enabled.");
        return;
      }
    }
    if (form.allows_video_addon) {
      if (form.video_addon_price === "" || Number(form.video_addon_price) < 0 || Number.isNaN(Number(form.video_addon_price))) {
        setError("Please set a video download price (£0 or more) when the video add-on is enabled.");
        return;
      }
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
    if (!trimmedVideoUrl) {
      setError("Please add a sample YouTube video link for your experience.");
      return;
    }
    if (!isYouTubeUrl(trimmedVideoUrl)) {
      setError("Please paste a valid YouTube link (e.g. https://youtube.com/watch?v=...).");
      return;
    }
    const trimmedVideoDescription = form.video_description.trim();
    if (!trimmedVideoDescription) {
      setError("Please add a video description.");
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
        sample_video_url: trimmedVideoUrl,
        video_description: trimmedVideoDescription,
        video_highlights: highlightsArray.length ? highlightsArray : null,
        meeting_link: trimmedMeetingLink,
        allows_souvenir_addon: Boolean(form.allows_souvenir_addon),
        souvenir_price: form.allows_souvenir_addon ? Number(form.souvenir_price) : null,
        allows_video_addon: Boolean(form.allows_video_addon),
        video_addon_price: form.allows_video_addon ? Number(form.video_addon_price) : null,
        max_piggyback_visitors: form.allows_piggyback ? Number(form.max_piggyback_visitors) : null,
      };
      const cfg = { headers: { Authorization: `Bearer ${token}` } };
      if (isEdit) {
        await axios.put(`${API_BASE}/ehost/experiences/${editId}`, payload, cfg);
      } else {
        await axios.post(`${API_BASE}/ehost/experiences`, payload, cfg);
      }
      setShowSubmittedModal(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit experience. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeStep = STEPS[currentStep - 1];
  const previewDate = form.date_time
    ? new Date(form.date_time).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "Date TBC";

  return (
    <div className="aa-page">
      <header className="aa-navbar">
        <nav className="aa-nav-links">
          <button className="aa-nav-link" type="button" onClick={() => navigate("/EhostDashboard")}>
            ‹ Back to dashboard
          </button>
        </nav>
        <h1 className="aa-navbar-title">{isEdit ? "Edit experience" : "Apply for new experience"}</h1>
      </header>

      <div className="aa-stepper-row">
        <nav className="aa-stepper" aria-label="Form progress">
          {STEPS.map((s, i) => {
            const done = currentStep > s.n;
            const active = currentStep === s.n;
            return (
              <div key={s.n} className="aa-stepper-item">
                <button
                  type="button"
                  className={`aa-stepper-step${active ? " is-active" : ""}${done ? " is-done" : ""}`}
                  onClick={() => goToStep(s.n)}
                >
                  <span className="aa-stepper-num">{done ? "✓" : s.n}</span>
                  <span className="aa-stepper-label">{s.title}</span>
                </button>
                {i < STEPS.length - 1 && <span className="aa-stepper-divider" aria-hidden="true" />}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="aa-layout">
        <form className="aa-form" onSubmit={handleSubmit}>
          {wasApproved && (
            <div className="aa-hint">
              Heads up: this experience is currently approved. Saving changes will send it back to the admin for re-approval.
            </div>
          )}

          <div className="aa-step-header">
            <h2 className="aa-step-title">{activeStep.title}</h2>
            <p className="aa-step-subtitle">{activeStep.subtitle}</p>
          </div>

          {currentStep === 1 && (
            <>
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
                <div />
              </div>

              <label className="aa-label">Description*</label>
              <textarea className="aa-textarea" name="description" rows="5" value={form.description} onChange={handleChange} />

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
            </>
          )}

          {currentStep === 2 && (
            <>
              <label className="aa-label">Cover image*</label>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0])} disabled={uploading} />
              {uploading && <div className="aa-hint">Uploading… {uploadProgress}%</div>}
              {coverImage && !uploading && (
                <div className="aa-cover-preview">
                  <button
                    type="button"
                    className="photo-trigger"
                    onClick={() => setPreviewUrl(coverImage)}
                    aria-label="Preview cover image"
                  >
                    <img src={coverImage} alt="cover preview" className="aa-preview" />
                  </button>
                  <button
                    type="button"
                    className="aa-additional-remove"
                    onClick={() => setCoverImage("")}
                  >
                    Remove
                  </button>
                </div>
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
                  additionalImages.length >= MAX_ADDITIONAL_IMAGES
                }
              />
              {additionalUploading && <div className="aa-hint">Uploading additional photos…</div>}
              {additionalImages.length > 0 && (
                <div className="aa-additional-grid">
                  {additionalImages.map((url, i) => (
                    <div key={url} className="aa-additional-thumb">
                      <button
                        type="button"
                        className="photo-trigger"
                        onClick={() => setPreviewUrl(url)}
                        aria-label={`Preview photo ${i + 1}`}
                      >
                        <img src={url} alt={`additional ${i + 1}`} className="aa-preview" />
                      </button>
                      <button
                        type="button"
                        className="aa-additional-remove"
                        onClick={() => removeAdditionalImage(i)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="aa-hint">
                {additionalImages.length} of {MAX_ADDITIONAL_IMAGES} uploaded.
                {additionalImages.length < MIN_ADDITIONAL_IMAGES &&
                  ` Add at least ${MIN_ADDITIONAL_IMAGES - additionalImages.length} more.`}
              </div>

              <div className="aa-grid">
                <div>
                  <label className="aa-label">Date & time*</label>
                  <input className="aa-input" name="date_time" type="datetime-local" min={minDateTime} value={form.date_time} onChange={handleChange} />
                </div>
                <div>
                  <label className="aa-label">Duration (minutes)</label>
                  <input className="aa-input" name="duration_minutes" type="number" min="15" value={form.duration_minutes} onChange={handleChange} />
                </div>
              </div>

              <div className="aa-grid">
                <div>
                  <label className="aa-label">Capacity (max normal tickets)*</label>
                  <input className="aa-input" name="max_visitors" type="number" min="1" value={form.max_visitors} onChange={handleChange} />
                </div>
                <div>
                  <label className="aa-label">Price per viewer (GBP)*</label>
                  <input className="aa-input" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} />
                </div>
              </div>

              <label className="aa-label">Sample video (YouTube link)*</label>
              <input
                className="aa-input"
                type="url"
                name="sample_video_url"
                value={form.sample_video_url}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=..."
              />

              <label className="aa-label">Video description*</label>
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
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="aa-grid">
                <div>
                  <label className="aa-label">Gender preference</label>
                  <select className="aa-input" name="gender_preference" value={form.gender_preference} onChange={handleChange}>
                    {GENDER_PREFERENCES.map((g) => (
                      <option key={g} value={g}>{g.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <div />
              </div>

              <div className="aa-piggyback-toggle">
                <label className="aa-checkbox">
                  <input
                    type="checkbox"
                    name="allows_piggyback"
                    checked={form.allows_piggyback}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((prev) => ({
                        ...prev,
                        allows_piggyback: checked,
                        price_discounted: checked ? prev.price_discounted : "",
                        max_piggyback_visitors: checked ? prev.max_piggyback_visitors : "",
                      }));
                    }}
                  />
                  Allow piggyback bookings
                </label>
                <InfoTooltip label="About piggyback bookings">
                  When enabled, other visitors can buy a discounted &ldquo;watch-only&rdquo;
                  ticket and join the same live session as the main booker. They can watch
                  the stream but can&rsquo;t ask questions or interact.
                </InfoTooltip>
              </div>
              {form.allows_piggyback && (
                <div className="aa-grid">
                  <div>
                    <label className="aa-label">Piggyback price (GBP)*</label>
                    <input
                      className="aa-input"
                      name="price_discounted"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price_discounted}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="aa-label">Max piggyback tickets*</label>
                    <input
                      className="aa-input"
                      name="max_piggyback_visitors"
                      type="number"
                      min="1"
                      value={form.max_piggyback_visitors}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              <div className="aa-grid">
                <div className="aa-checkbox-stack">
                  <div className="aa-checkbox-row">
                    <label className="aa-checkbox">
                      <input type="checkbox" name="allows_souvenir_addon" checked={form.allows_souvenir_addon} onChange={handleChange} />
                      Offer souvenir add-on
                    </label>
                    <InfoTooltip label="About the souvenir add-on">
                      When enabled, visitors can request a souvenir at checkout. You&rsquo;ll
                      email them after booking to arrange shipping details.
                    </InfoTooltip>
                  </div>
                  {form.allows_souvenir_addon && (
                    <div>
                      <label className="aa-label">Souvenir price per unit (£)*</label>
                      <input
                        className="aa-input"
                        type="number"
                        name="souvenir_price"
                        min="0"
                        step="0.01"
                        value={form.souvenir_price}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                </div>

                <div className="aa-checkbox-stack">
                  <div className="aa-checkbox-row">
                    <label className="aa-checkbox">
                      <input type="checkbox" name="allows_video_addon" checked={form.allows_video_addon} onChange={handleChange} />
                      Offer video download add-on
                    </label>
                    <InfoTooltip label="About the video download add-on">
                      When enabled, visitors can pay extra at checkout to download a recording
                      of the live experience after it ends.
                    </InfoTooltip>
                  </div>
                  {form.allows_video_addon && (
                    <div>
                      <label className="aa-label">Video download price (£)*</label>
                      <input
                        className="aa-input"
                        type="number"
                        name="video_addon_price"
                        min="0"
                        step="0.01"
                        value={form.video_addon_price}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {error && <div className="aa-error">{error}</div>}
        </form>

        <aside className="aa-preview-pane">
          <div className="aa-preview-eyebrow">Preview</div>
          <div className="aa-preview-card">
            <div
              className="aa-preview-cover"
              style={coverImage ? { backgroundImage: `url(${coverImage})` } : undefined}
            >
              {form.country && <span className="aa-preview-pill">{form.country}</span>}
            </div>
            <div className="aa-preview-body">
              <h3 className="aa-preview-title">{form.title || "Your listing title"}</h3>
              <div className="aa-preview-meta">
                <span>★ New</span>
                {form.duration_minutes && <span>· {form.duration_minutes} min</span>}
                <span>· You</span>
              </div>
              <p className="aa-preview-desc">
                {form.description || "Your description appears here."}
              </p>
              <div className="aa-preview-footer">
                <span className="aa-preview-price">£{form.price || "—"}</span>
                <span className="aa-preview-date">{previewDate}</span>
              </div>
            </div>
          </div>
          <div className="aa-preview-note">
            <strong>Reviewed before going live.</strong> Our team checks every listing usually within 24 hours. We may ask for clarifications.
          </div>
        </aside>
      </div>

      <footer className="aa-footer">
        <span className="aa-footer-info">
          Step {currentStep} of {STEPS.length}{isEdit ? "" : " · Saved as draft"}
        </span>
        <div className="aa-footer-actions">
          {currentStep > 1 && (
            <button
              type="button"
              className="aa-footer-btn aa-footer-btn--ghost"
              onClick={() => goToStep(currentStep - 1)}
            >
              Back
            </button>
          )}
          <button
            type="button"
            className="aa-footer-btn aa-footer-btn--ghost"
            onClick={() => navigate("/EhostDashboard")}
          >
            Save & exit
          </button>
          {currentStep < STEPS.length ? (
            <button
              type="button"
              className="aa-footer-btn aa-footer-btn--primary"
              onClick={() => goToStep(currentStep + 1)}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              className="aa-footer-btn aa-footer-btn--primary"
              disabled={uploading || additionalUploading || submitting}
              onClick={() => document.querySelector(".aa-form")?.requestSubmit?.()}
            >
              {submitting ? "Submitting…" : isEdit ? "Save changes" : "Submit for review"}
            </button>
          )}
        </div>
      </footer>

      {showGenderWarning && (
        <div className="aa-modal-overlay" role="dialog" aria-modal="true">
          <div className="aa-modal-panel">
            <h3 className="aa-modal-title">Single-gender tour</h3>
            <p className="aa-modal-body">
              You&rsquo;ve set this experience to&nbsp;
              <strong>
                {form.gender_preference === "female_only" ? "female-only" : "male-only"}
              </strong>. Single-gender tours are shown to a smaller audience, so you may
              get fewer bookings. Are you sure you want to continue?
            </p>
            <div className="aa-modal-actions" style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                className="aa-modal-ok"
                style={{ background: "#e5e7eb", color: "#1f2937" }}
                onClick={() => setShowGenderWarning(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="aa-modal-ok"
                onClick={() => {
                  setGenderWarningAcknowledged(true);
                  setShowGenderWarning(false);
                  // Re-trigger submit on next tick now that the flag is set
                  setTimeout(() => {
                    document.querySelector(".aa-form")?.requestSubmit?.();
                  }, 0);
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubmittedModal && (
        <div className="aa-modal-overlay" role="dialog" aria-modal="true">
          <div className="aa-modal-panel">
            <h3 className="aa-modal-title">Submitted for review</h3>
            <p className="aa-modal-body">
              Your request has been submitted. The admin team will take several days
              to review and approve your experience.
            </p>
            <div className="aa-modal-actions">
              <button
                type="button"
                className="aa-modal-ok"
                onClick={() => {
                  setShowSubmittedModal(false);
                  navigate("/EhostDashboard");
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <PhotoLightbox url={previewUrl} onClose={() => setPreviewUrl(null)} />
    </div>
  );
};

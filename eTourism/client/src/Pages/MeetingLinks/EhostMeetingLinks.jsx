import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/apiClient";
import "./style.css";

const PLATFORM_OPTIONS = [
  { value: "Google Meet", label: "Google Meet" },
  { value: "Zoom", label: "Zoom" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Other", label: "Other" },
];

export const EhostMeetingLinks = () => {
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [platform, setPlatform] = useState("Google Meet");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [meetingPassword, setMeetingPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const selectedExperience = useMemo(
    () => experiences.find((e) => String(e.id) === String(selectedId)) || null,
    [experiences, selectedId]
  );

  const loadExperiences = useCallback(async () => {
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const res = await apiClient.get("/ehost/experiences");
      const list = res.data?.data || res.data || [];
      setExperiences(Array.isArray(list) ? list : []);
      if (Array.isArray(list) && list.length > 0) {
        setSelectedId((prev) => prev || String(list[0].id));
      }
    } catch (err) {
      setStatus({ type: "error", message: err?.response?.data?.message || err?.response?.data?.error || "Failed to load experiences" });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMeetingLink = useCallback(async (experienceId) => {
    if (!experienceId) return;
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const res = await apiClient.get(`/ehost/experiences/${experienceId}/meeting-link`);
      const data = res.data?.data || null;
      if (!data) {
        setPlatform("Google Meet");
        setMeetingUrl("");
        setMeetingPassword("");
        return;
      }
      setPlatform(data.platform || "Google Meet");
      setMeetingUrl(data.meeting_url || "");
      setMeetingPassword(data.meeting_password || "");
    } catch (err) {
      setStatus({ type: "error", message: err?.response?.data?.message || err?.response?.data?.error || "Failed to load meeting link configuration" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExperiences();
  }, [loadExperiences]);

  useEffect(() => {
    if (selectedId) {
      loadMeetingLink(selectedId);
    }
  }, [selectedId, loadMeetingLink]);

  const handleSave = async () => {
    if (!selectedId) return;
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      await apiClient.put(`/ehost/experiences/${selectedId}/meeting-link`, {
        platform,
        meeting_url: meetingUrl,
        meeting_password: meetingPassword,
      });
      setStatus({ type: "success", message: "Meeting link configuration saved" });
    } catch (err) {
      setStatus({ type: "error", message: err?.response?.data?.message || err?.response?.data?.error || "Failed to save" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    navigate("/");
  };

  return (
    <div className="ml-page">
      <div className="ml-header">
        <div className="ml-title">Meeting Link Configuration</div>
        <div className="ml-actions">
          <button className="ml-btn secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="ml-card">
        <div className="ml-row">
          <label className="ml-label">Experience</label>
          <select className="ml-select" value={selectedId} onChange={(e) => setSelectedId(e.target.value)} disabled={loading}>
            {experiences.map((e) => (
              <option key={e.id} value={String(e.id)}>
                #{e.id} · {e.location_name || "Experience"} · {e.status || ""}
              </option>
            ))}
          </select>
        </div>

        {selectedExperience && (
          <div className="ml-hint">
            Only upcoming experiences can be configured. If saving fails, confirm the experience start time is in the future.
          </div>
        )}

        <div className="ml-row">
          <label className="ml-label">Platform</label>
          <select className="ml-select" value={platform} onChange={(e) => setPlatform(e.target.value)} disabled={loading}>
            {PLATFORM_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-row">
          <label className="ml-label">Meeting URL</label>
          <input
            className="ml-input"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder="https://..."
            disabled={loading}
          />
        </div>

        <div className="ml-row">
          <label className="ml-label">Password</label>
          <input
            className="ml-input"
            value={meetingPassword}
            onChange={(e) => setMeetingPassword(e.target.value)}
            placeholder="Optional"
            disabled={loading}
          />
        </div>

        {status.message && (
          <div className={`ml-status ${status.type === "error" ? "error" : "success"}`}>{status.message}</div>
        )}

        <div className="ml-footer">
          <button className="ml-btn primary" onClick={handleSave} disabled={loading}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};


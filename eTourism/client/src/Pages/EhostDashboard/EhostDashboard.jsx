import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import applyIcon from "../icon/approve.png";
import profileIcon from "../icon/customer-review.png";
import { RejectionModal } from "./RejectionModal.jsx";
import { getCountryImage } from "../../utils/countryImages";
import "./EhostDashboard.css";

const API_BASE = import.meta.env.VITE_API_URL;

const formatDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hh}:${mm}`;
};

export const EhostDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectionModal, setRejectionModal] = useState({ open: false, reason: "", title: "" });

  useEffect(() => {
    if (!token || user.role !== "ehost") {
      navigate("/login");
    }
  }, [token, user.role, navigate]);

  const fetchExperiences = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/ehost/experiences`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExperiences(Array.isArray(data?.data) ? data.data : []);
    } catch {
      setExperiences([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleJoinStream = async (experienceId) => {
    try {
      const { data } = await axios.get(`${API_BASE}/ehost/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bookings = Array.isArray(data?.data) ? data.data : [];
      const match = bookings.find(
        (b) => Number(b.experience_id) === Number(experienceId) && b.meeting_config?.link
      );
      if (match?.meeting_config?.link) {
        window.open(match.meeting_config.link, "_blank", "noopener,noreferrer");
      } else {
        alert("No meeting link configured yet. Please set one for this experience's booking.");
      }
    } catch {
      alert("Failed to load bookings. Please try again.");
    }
  };

  const handleSeeMessage = (exp) => {
    setRejectionModal({
      open: true,
      reason: exp.rejection_reason || "",
      title: exp.title || exp.location_name || "Your application",
    });
  };

  const handleCheckReview = (experienceId) => {
    navigate(`/DetailPage?id=${experienceId}`, { state: { from: "ehost" } });
  };

  const renderRow = (exp) => {
    const isFuture = exp.date_time && new Date(exp.date_time).getTime() > Date.now();

    let statusNode = null;
    let button = null;

    if (exp.status === "rejected") {
      statusNode = <div className="eh-row-status eh-status-rejected">Your application was not successful.</div>;
      button = (
        <button className="eh-row-btn" onClick={() => handleSeeMessage(exp)}>
          Click to see message
        </button>
      );
    } else if (exp.status === "approved" && isFuture) {
      statusNode = <div className="eh-row-status eh-status-approved">Approve</div>;
      button = (
        <button className="eh-row-btn" onClick={() => handleJoinStream(exp.id)}>
          Join the stream
        </button>
      );
    } else if (exp.status === "approved") {
      statusNode = null;
      button = (
        <button className="eh-row-btn" onClick={() => handleCheckReview(exp.id)}>
          Click to check the review
        </button>
      );
    } else {
      statusNode = <div className="eh-row-status eh-status-pending">Pending approval</div>;
      button = (
        <button className="eh-row-btn" disabled>
          Waiting for review
        </button>
      );
    }

    return (
      <div className="eh-row" key={exp.id}>
        <img src={getCountryImage(exp.country)} alt={exp.title || "experience"} className="eh-row-image" />
        <div className="eh-row-body">
          <div className="eh-row-title-line">
            <span className="eh-row-title">{exp.title || exp.location_name}</span>
            {exp.status === "approved" && isFuture && (
              <span className="eh-row-title-tag">Approve</span>
            )}
          </div>
          <div className="eh-row-datetime">{formatDateTime(exp.date_time) || "Date TBC"}</div>
          {statusNode && exp.status === "rejected" && statusNode}
          {exp.status !== "approved" && exp.status !== "rejected" && statusNode}
        </div>
        <div className="eh-row-action">{button}</div>
      </div>
    );
  };

  return (
    <div className="eh-page">
      <header className="eh-navbar">
        <h1 className="eh-navbar-title">E-host dashboard</h1>
        <nav className="eh-nav-links">
          <button className="eh-nav-link" type="button" onClick={() => alert("Helping centre coming soon.")}>
            Helping centre
          </button>
          <button className="eh-nav-link" type="button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      <section className="eh-section">
        <h2 className="eh-section-title">Dashboard</h2>
        <div className="eh-actions-card">
          <button className="eh-action-tile" type="button" onClick={() => navigate("/ApplyActivity")}>
            <img src={applyIcon} alt="" className="eh-action-icon" />
            <span>Apply new activity</span>
          </button>
          <button className="eh-action-tile" type="button" onClick={() => navigate("/EhostProfile")}>
            <img src={profileIcon} alt="" className="eh-action-icon" />
            <span>Update profile</span>
          </button>
        </div>
      </section>

      <section className="eh-section">
        <h2 className="eh-section-title">Manage the activity</h2>
        {loading ? (
          <div className="eh-empty">Loading…</div>
        ) : experiences.length === 0 ? (
          <div className="eh-empty">You haven't submitted any activity yet.</div>
        ) : (
          <div className="eh-rows">{experiences.map(renderRow)}</div>
        )}
      </section>

      {rejectionModal.open && (
        <RejectionModal
          title={rejectionModal.title}
          reason={rejectionModal.reason}
          onClose={() => setRejectionModal({ open: false, reason: "", title: "" })}
        />
      )}
    </div>
  );
};

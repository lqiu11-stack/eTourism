import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import applyIcon from "../icon/approve.png";
import profileIcon from "../icon/profile.png";
import { RejectionModal } from "./RejectionModal.jsx";
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
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: "" });
  const [networkQuality, setNetworkQuality] = useState(null);

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

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_BASE}/network-logs/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ data }) => setNetworkQuality(data))
      .catch(() => {});
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleJoinStream = (exp) => {
    const link = exp?.meeting_link;
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer");
    } else {
      alert("No meeting link configured yet. Please edit this experience to add one.");
    }
  };

  const requestDelete = (exp) => {
    setDeleteModal({ open: true, id: exp.id, title: exp.title || exp.location_name || "this experience" });
  };

  const confirmDelete = async () => {
    const id = deleteModal.id;
    setDeleteModal({ open: false, id: null, title: "" });
    if (!id) return;
    try {
      await axios.delete(`${API_BASE}/ehost/experiences/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchExperiences();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete.");
    }
  };

  const openReviewModal = (exp) => {
    const title = exp.title || exp.location_name || "Your application";
    if (exp.status === "rejected") {
      setRejectionModal({
        open: true,
        reason: exp.rejection_reason || "",
        title,
      });
    } else {
      setRejectionModal({
        open: true,
        reason: "Your application is still under review. An admin will respond shortly.",
        title,
      });
    }
  };

  const renderRow = (exp) => {
    const isFuture = exp.date_time && new Date(exp.date_time).getTime() > Date.now();

    let statusNode = null;
    let button = null;

    const stop = (fn) => (e) => {
      e.stopPropagation();
      fn();
    };

    if (exp.status === "rejected") {
      statusNode = <div className="eh-row-status eh-status-rejected">Your application was not successful.</div>;
      button = (
        <button className="eh-row-btn" onClick={stop(() => openReviewModal(exp))}>
          Click to check the review
        </button>
      );
    } else if (exp.status === "approved" && isFuture) {
      statusNode = null;
      button = (
        <button className="eh-row-btn" onClick={stop(() => handleJoinStream(exp))}>
          Join the stream
        </button>
      );
    } else if (exp.status === "approved") {
      statusNode = <div className="eh-row-status eh-status-closed">Experience has already taken place.</div>;
      button = null;
    } else {
      statusNode = <div className="eh-row-status eh-status-pending">Waiting for admin to approve</div>;
      button = (
        <button className="eh-row-btn" onClick={stop(() => openReviewModal(exp))}>
          Click to check the review
        </button>
      );
    }

    const goToDetail = () => navigate(`/DetailPage?id=${exp.id}`, { state: { from: "ehost" } });

    return (
      <div
        className="eh-row eh-row-clickable"
        key={exp.id}
        onClick={goToDetail}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goToDetail();
          }
        }}
      >
        <img src={exp.cover_image} alt={exp.title || "experience"} className="eh-row-image" />
        <div className="eh-row-body">
          <div className="eh-row-title-line">
            <span className="eh-row-title">{exp.title || exp.location_name}</span>
            {exp.status === "approved" && isFuture && (
              <span className="eh-row-title-tag">Approved</span>
            )}
          </div>
          <div className="eh-row-datetime">{formatDateTime(exp.date_time) || "Date TBC"}</div>
          {statusNode}
        </div>
        <div className="eh-row-action">
          {(exp.status === "pending" || (exp.status === "approved" && isFuture)) && (
            <button
              className="eh-row-btn"
              onClick={stop(() => navigate(`/EditActivity/${exp.id}`))}
            >
              Edit
            </button>
          )}
          {button}
          {exp.status !== "approved" && (
            <button
              type="button"
              className="eh-row-btn eh-row-btn-danger"
              onClick={stop(() => requestDelete(exp))}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="eh-page">
      <header className="eh-navbar">
        <h1 className="eh-navbar-title">E-host dashboard</h1>
        <nav className="eh-nav-links">
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
            <span>Apply for new experience</span>
          </button>
          <button className="eh-action-tile" type="button" onClick={() => navigate("/EhostProfile")}>
            <img src={profileIcon} alt="" className="eh-action-icon" />
            <span>Update profile</span>
          </button>
        </div>
        {networkQuality && networkQuality.total > 0 && (
          <div
            className={`eh-network-tile${networkQuality.is_poor ? " eh-network-tile--warn" : ""}`}
          >
            <div className="eh-network-tile-title">Connection quality (last 7 days)</div>
            <div className="eh-network-tile-stats">
              {networkQuality.poor_count} issue{networkQuality.poor_count === 1 ? "" : "s"}
              {" out of "}
              {networkQuality.total} request{networkQuality.total === 1 ? "" : "s"}
              {" ("}
              {Math.round(networkQuality.poor_ratio * 100)}%{")"}
            </div>
            {networkQuality.is_poor && (
              <div className="eh-network-tile-hint">
                Your sessions have been unstable. Consider switching to a wired
                connection or moving closer to your router before going live.
              </div>
            )}
          </div>
        )}
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

      {deleteModal.open && (
        <div className="eh-modal-overlay" role="dialog" aria-modal="true">
          <div className="eh-modal-panel">
            <h3 className="eh-modal-title">Delete experience?</h3>
            <div className="eh-modal-body">
              Are you sure you want to delete &quot;{deleteModal.title}&quot;? This cannot be undone.
            </div>
            <div className="eh-modal-actions" style={{ gap: 10 }}>
              <button
                type="button"
                className="eh-row-btn"
                onClick={() => setDeleteModal({ open: false, id: null, title: "" })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="eh-modal-close"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

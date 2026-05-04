import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import backIcon from "../icon/back.png";
import { AccountMenu } from "../../components/AccountMenu";
import "../MainPage/Mainstyle.css";
import "./FollowingPage.css";

const API_BASE = import.meta.env.VITE_API_URL;

const formatNext = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const FollowingPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchFollows = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/visitor/follows`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHosts(Array.isArray(data) ? data : []);
    } catch {
      setHosts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || user.role !== "visitor") {
      navigate("/login");
      return;
    }
    fetchFollows();
  }, [token, user.role, navigate, fetchFollows]);

  const handleUnfollow = async (ehostId) => {
    if (busyId) return;
    setBusyId(ehostId);
    try {
      await axios.delete(`${API_BASE}/visitor/follows/${ehostId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHosts((prev) => prev.filter((h) => h.ehost_id !== ehostId));
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="following-page">
      <nav className="navbar">
        <button type="button" className="detail-back-btn" onClick={() => navigate("/MainPage")} aria-label="Back">
          <img src={backIcon} alt="Back" className="detail-back-icon" />
        </button>
        <div className="nav-links">
          <Link to="/register/ehost/step1" className="nav-link">Become E-host</Link>
          <AccountMenu />
        </div>
      </nav>

      <header className="following-hero">
        <h1 className="following-title">Following</h1>
        <p className="following-subtitle">Hosts you've subscribed to and their next experiences.</p>
      </header>

      <main className="following-main">
        {loading ? (
          <p className="following-loading">Loading…</p>
        ) : hosts.length === 0 ? (
          <div className="following-empty">
            <h2>You're not following anyone yet</h2>
            <p>Find a host you like and tap <strong>Follow</strong> on their experience page to see them here.</p>
            <button type="button" className="following-cta" onClick={() => navigate("/MainPage")}>
              Browse experiences
            </button>
          </div>
        ) : (
          <div className="following-grid">
            {hosts.map((h) => {
              const fullName = h.ehost_display_name || "Host";
              const date = formatNext(h.next_experience_date_time);
              return (
                <article key={h.ehost_id} className="following-card">
                  <header className="following-card-header">
                    {h.profile_image
                      ? <img src={h.profile_image} alt="" className="following-card-avatar" />
                      : <span className="following-card-avatar following-card-avatar--placeholder">
                          {(h.ehost_display_name?.[0] || "?").toUpperCase()}
                        </span>}
                    <div className="following-card-headtext">
                      <h3 className="following-card-name">{fullName}</h3>
                      {h.bio && <p className="following-card-bio">{h.bio}</p>}
                    </div>
                  </header>

                  {h.next_experience_id ? (
                    <div className="following-card-next">
                      <div className="following-card-next-label">Next experience</div>
                      <button
                        type="button"
                        className="following-card-next-btn"
                        onClick={() => navigate(`/DetailPage?id=${h.next_experience_id}`)}
                      >
                        <div
                          className="following-card-next-cover"
                          style={h.next_experience_cover ? { backgroundImage: `url(${h.next_experience_cover})` } : undefined}
                        />
                        <div className="following-card-next-body">
                          <div className="following-card-next-title">{h.next_experience_title}</div>
                          <div className="following-card-next-meta">
                            {date}{h.next_experience_country ? ` · ${h.next_experience_country}` : ""}
                          </div>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="following-card-empty">No upcoming experiences from this host.</div>
                  )}

                  <footer className="following-card-actions">
                    <button
                      type="button"
                      className="following-card-unfollow"
                      disabled={busyId === h.ehost_id}
                      onClick={() => handleUnfollow(h.ehost_id)}
                    >
                      {busyId === h.ehost_id ? "Removing…" : "Unfollow"}
                    </button>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

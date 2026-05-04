import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import backIcon from "../icon/back.png";
import { AccountMenu } from "../../components/AccountMenu";
import { ExperienceCard } from "../../components/ExperienceCard";
import "../MainPage/Mainstyle.css";
import "./EhostPublicProfile.css";

const API_BASE = import.meta.env.VITE_API_URL;

export const EhostPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isEhost = user.role === "ehost";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followState, setFollowState] = useState({ following: false, followers_count: 0 });
  const [followBusy, setFollowBusy] = useState(false);
  const [followHover, setFollowHover] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    axios
      .get(`${API_BASE}/visitor/ehosts/${id}`)
      .then(({ data: payload }) => {
        setData(payload);
        setFollowState((prev) => ({ ...prev, followers_count: payload.followers_count || 0 }));
      })
      .catch((err) => {
        if (err?.response?.status === 404) setNotFound(true);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    axios
      .get(`${API_BASE}/visitor/ehosts/${id}/follow-status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then(({ data: payload }) => setFollowState(payload))
      .catch(() => {});
  }, [id, token]);

  const canFollow = !isEhost && Number(id) !== Number(user.id);

  const handleToggleFollow = async () => {
    if (!token) {
      navigate(`/login?redirect=/ehost/${id}`);
      return;
    }
    if (!canFollow || followBusy) return;
    setFollowBusy(true);
    try {
      if (followState.following) {
        const { data: payload } = await axios.delete(
          `${API_BASE}/visitor/follows/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFollowState(payload);
      } else {
        const { data: payload } = await axios.post(
          `${API_BASE}/visitor/follows`,
          { ehost_id: Number(id) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFollowState(payload);
      }
    } catch {
      /* ignore */
    } finally {
      setFollowBusy(false);
    }
  };

  return (
    <div className="ehost-public-page">
      <nav className="navbar">
        <button
          type="button"
          className="detail-back-btn"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <img src={backIcon} alt="Back" className="detail-back-icon" />
        </button>
        <div className="nav-links">
          <Link to="/register/ehost/step1" className="nav-link">Become E-host</Link>
          <AccountMenu />
        </div>
      </nav>

      <main className="ehost-public-main">
        {loading ? (
          <p className="ehost-public-loading">Loading…</p>
        ) : notFound || !data ? (
          <div className="ehost-public-empty">
            <h2>Host not found</h2>
            <p>This host doesn't exist or is no longer active.</p>
            <button type="button" className="ehost-public-cta" onClick={() => navigate("/MainPage")}>
              Back to home
            </button>
          </div>
        ) : (
          <>
            <header className="ehost-public-header">
              {data.profile.profile_image ? (
                <img
                  src={data.profile.profile_image}
                  alt=""
                  className="ehost-public-avatar"
                />
              ) : (
                <span className="ehost-public-avatar ehost-public-avatar--placeholder">
                  {(data.profile.display_name?.[0] || "?").toUpperCase()}
                </span>
              )}
              <div className="ehost-public-headtext">
                <h1 className="ehost-public-name">{data.profile.display_name}</h1>
                <div className="ehost-public-meta">
                  <span>{followState.followers_count} follower{followState.followers_count === 1 ? "" : "s"}</span>
                  {data.profile.country && <span> · {data.profile.country}</span>}
                </div>
                {data.profile.bio && <p className="ehost-public-bio">{data.profile.bio}</p>}
              </div>
              {canFollow && (
                <button
                  type="button"
                  className={
                    followState.following
                      ? `ehost-public-follow-btn ehost-public-follow-btn--following${followHover ? " is-hover" : ""}`
                      : "ehost-public-follow-btn"
                  }
                  disabled={followBusy}
                  onClick={handleToggleFollow}
                  onMouseEnter={() => setFollowHover(true)}
                  onMouseLeave={() => setFollowHover(false)}
                >
                  {followState.following
                    ? (followHover ? "Unfollow" : "Following")
                    : `Follow ${data.profile.display_name}`}
                </button>
              )}
            </header>

            <section className="ehost-public-tours">
              <h2 className="section-title">Tours by {data.profile.display_name}</h2>
              {data.experiences.length === 0 ? (
                <p className="ehost-public-no-tours">This host has no published experiences yet.</p>
              ) : (
                <div className="card-list">
                  {data.experiences.map((exp) => (
                    <ExperienceCard key={exp.id} experience={exp} linkState={{ from: `/ehost/${id}` }} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

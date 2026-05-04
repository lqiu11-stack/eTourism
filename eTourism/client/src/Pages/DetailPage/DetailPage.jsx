import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import "./DetailPage.css";
import { useNavigate, useSearchParams, Link, useLocation } from "react-router-dom";
import backIcon from "../icon/back.png";
import { useExperiences } from "../../hooks/useExperiences";
import { toYouTubeEmbed } from "../../utils/youtube";
import { setExperienceContext } from "../../utils/networkMonitor";
import { ExperienceCard } from "../../components/ExperienceCard";
import { PhotoLightbox } from "../../components/PhotoLightbox";
import { AccountMenu } from "../../components/AccountMenu";
import { useAlertCard } from "../../components/useAlertCard";

const MAX_NEW_EVENTS = 8;

const API_BASE = import.meta.env.VITE_API_URL;

const renderStars = (rating) => Array(Number(rating)).fill('\u2605').join(' ');

export const DetailPage = () => {
  const location = useLocation(); 
  const from = location.state?.from;
  const handleBack = () => {

  if (from) {
    navigate(-1);
  } else {
    navigate("/MainPage");
  }
};
const { experiences } = useExperiences();
    const navigate = useNavigate();
    const { alert: showAlert, card: alertCard } = useAlertCard();
    const [showTerms, setShowTerms] = useState(false);
    const [termsText, setTermsText] = useState("");
    const [previewUrl, setPreviewUrl] = useState(null);
    useEffect(() => {
    fetch("/terms.txt")
      .then((r) => r.text())
      .then(setTermsText)
      .catch(() => {});
    }, []);
    const newEvents = useMemo(
        () => [...experiences]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, MAX_NEW_EVENTS),
        [experiences]
      );
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isEhost = user.role === "ehost";

  const [experience, setExperience] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [networkWarning, setNetworkWarning] = useState(null);
  const [followState, setFollowState] = useState({ following: false, followers_count: 0 });
  const [followBusy, setFollowBusy] = useState(false);
  const [followHover, setFollowHover] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const id = searchParams.get("id");
    if (!id) return;
    setExperienceContext(id);
    axios.get(`${API_BASE}/visitor/experiences/${id}`)
      .then(({ data }) => setExperience(data))
      .catch(() => {});
    axios.get(`${API_BASE}/visitor/reviews?experience_id=${id}`)
      .then(({ data }) => setReviews(data))
      .catch(() => {});
    if (token) {
      axios.get(`${API_BASE}/network-logs/experience/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(({ data }) => {
          if (data?.experience?.is_poor || data?.ehost?.is_poor) {
            setNetworkWarning(
              "Heads up: this host has had connection issues recently. Sessions may be interrupted."
            );
          } else {
            setNetworkWarning(null);
          }
        })
        .catch(() => {});
    }
    return () => setExperienceContext(null);
  }, [searchParams, token]);

  useEffect(() => {
    const ehostId = experience?.ehost_id;
    if (!ehostId) return;
    axios.get(`${API_BASE}/visitor/ehosts/${ehostId}/follow-status`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(({ data }) => setFollowState(data))
      .catch(() => {});
  }, [experience?.ehost_id, token]);

  const canFollow = !!token && !isEhost && !!experience?.ehost_id;

  const handleToggleFollow = async () => {
    if (!token) {
      navigate(`/login?redirect=/DetailPage?id=${searchParams.get("id")}`);
      return;
    }
    if (!canFollow || followBusy) return;
    setFollowBusy(true);
    try {
      if (followState.following) {
        const { data } = await axios.delete(
          `${API_BASE}/visitor/follows/${experience.ehost_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFollowState(data);
      } else {
        const { data } = await axios.post(
          `${API_BASE}/visitor/follows`,
          { ehost_id: experience.ehost_id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFollowState(data);
      }
    } catch {
      /* ignore — could surface a toast later */
    } finally {
      setFollowBusy(false);
    }
  };

  return (
    <div className="tour-page">

      {/* HERO */}
      <section
        className="detail-hero"
        style={{ backgroundImage: `url(${experience?.cover_image})` }}
      >
        <div className="detail-hero-overlay"/>

        <nav className="navbar">
            <button
                    type="button"
                    className="detail-back-btn"
                    onClick={handleBack}
                    aria-label="Back"
                  >
                    <img src={backIcon} alt="Back" className="detail-back-icon" />
                  </button>

          <div className="nav-links">
            <Link to="/register/ehost/step1" className="nav-link">Become E-host</Link>
            <AccountMenu />
          </div>
        </nav>

        <div className="detail-hero-content">

          <div className="detail-hero-left">
            <h1>{experience?.title}</h1>

            <p>{experience?.description}</p>

            <div className="detail-tags">
              {experience?.country && <span>{experience.country}</span>}
              {experience?.category && <span>{experience.category}</span>}
            </div>
          </div>

          <div className="detail-hero-right">
            <h3>Live Start</h3>
            <p>{experience ? new Date(experience.date_time).toLocaleString() : ""}</p>
            <p>{experience ? `£${experience.price} / per ticket` : ""}</p>

            {networkWarning && (
              <p className="detail-network-warning" role="status">
                {networkWarning}
              </p>
            )}

            {(() => {
              // eslint-disable-next-line react-hooks/purity
              const nowMs = Date.now();
              const isPast = experience?.date_time && new Date(experience.date_time).getTime() <= nowMs;
              const notApproved = experience?.status && experience.status !== 'approved';
              const unavailable = isPast || notApproved || isEhost;
              const reason = isEhost
                ? 'E-hosts cannot book experiences. Please sign in as a visitor to book.'
                : isPast
                ? 'Booking is closed — this experience has already started.'
                : notApproved
                ? 'This experience is not available for booking.'
                : null;
              return (
                <>
                  <button
                    className={`detail-book-btn${unavailable ? ' detail-book-btn--disabled' : ''}`}
                    disabled={unavailable}
                    onClick={async () => {
                      if (isEhost) {
                        await showAlert('info', 'E-hosts cannot book experiences. Please sign in as a visitor.');
                        return;
                      }
                      if (unavailable) return;
                      if (!isLoggedIn) {
                        navigate(`/login?redirect=/PaymentPage?id=${searchParams.get("id")}`);
                        return;
                      }
                      navigate(`/PaymentPage?id=${searchParams.get("id")}`);
                    }}
                  >
                    Book it now!
                  </button>
                  {reason && <p className="detail-book-error">{reason}</p>}
                </>
              );
            })()}
          </div>

        </div>
      </section>


      {/* PAST VIDEO */}
      <section className="detail-video-section">

        <div className="detail-video-left">
          <h3>Are you still hesitating?</h3>
          <p>Check our past video</p>

          {experience?.sample_video_url && toYouTubeEmbed(experience.sample_video_url) && (
            <iframe
              src={toYouTubeEmbed(experience.sample_video_url)}
              className="detail-video-player"
              title="Sample video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              frameBorder="0"
            />
          )}
        </div>

        <div className="detail-video-right">
          {experience?.video_description?.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <ul>
            {experience?.video_highlights?.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

      </section>


      {/* GUIDE */}
      <section className="detail-guide-section">

        <div className="detail-guide-card">

          {experience?.ehost_profile_image && (
            <img
              src={experience.ehost_profile_image}
              className="detail-guide-avatar"
              alt="detail-guide"
            />
          )}

          <div className="detail-guide-info">
            <h4>{experience?.ehost_first_name}</h4>
            <div className="detail-guide-meta">
              <span className="detail-guide-followers">
                {followState.followers_count} follower{followState.followers_count === 1 ? "" : "s"}
              </span>
              {canFollow && (
                <button
                  type="button"
                  className={
                    followState.following
                      ? `detail-follow-btn detail-follow-btn--following${followHover ? " is-hover" : ""}`
                      : "detail-follow-btn"
                  }
                  disabled={followBusy}
                  onClick={handleToggleFollow}
                  onMouseEnter={() => setFollowHover(true)}
                  onMouseLeave={() => setFollowHover(false)}
                >
                  {followState.following
                    ? (followHover ? "Unfollow" : "Following")
                    : `Follow ${experience?.ehost_first_name || "host"}`}
                </button>
              )}
              {!token && experience?.ehost_id && (
                <button
                  type="button"
                  className="detail-follow-btn"
                  onClick={handleToggleFollow}
                >
                  Follow {experience?.ehost_first_name || "host"}
                </button>
              )}
            </div>
            <p>{experience?.ehost_bio}</p>
          </div>

        </div>

      </section>


      {/* REVIEWS */}
      {reviews.length > 0 && (
        <>
          <section className="detail-blog-section">
            <div className="blog-card">
              <div className="blog-top">
                <span className="quote">{"\u275D"}</span>
                <div className="stars">{renderStars(reviews[0].rating)}</div>
              </div>
              <h3 className="blog-name">{reviews[0].first_name}</h3>
              <p className="blog-text">{reviews[0].comment}</p>
            </div>
            <div className="detail-video-left">
              <h3>Recommended by Travel Bloggers</h3>
              <p>Book the ticket and join us!</p>
              {/* <img src={blog} alt="blogger"/> */}
            </div>
          </section>

          <section className="detail-review-section">
            <h3>{"Customer’s review is important for us"}</h3>
            <div className="detail-reviews">
              {reviews.slice(1).map((r) => (
                <div className="detail-review" key={r.id}>
                  <div className="detail-review-stars" aria-label={`Rated ${r.rating} out of 5`}>
                    {renderStars(r.rating)}
                  </div>
                  <h4>{r.first_name}{r.country ? ` from ${r.country}` : ""}</h4>
                  <p>{r.comment}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}


      {/* REFUND */}
      <section className="detail-refund-section">
        <h3>Refund policy</h3>
        <div className="detail-refund-card">
          Free cancellation up to 24 hours before live start. If you miss the
          session, a replay will be available for 24 hours.
        </div>
      </section>

      {/* GALLERY */}
      {experience?.additional_images?.length > 0 && (
        <section className="detail-gallery-section">
          <h3>More photos</h3>
          <div className="detail-gallery-grid">
            {experience.additional_images.map((url, i) => (
              <button
                key={url}
                type="button"
                className="photo-trigger"
                onClick={() => setPreviewUrl(url)}
                aria-label={`Preview photo ${i + 1}`}
              >
                <img
                  src={url}
                  alt={`${experience.title} photo ${i + 1}`}
                  className="detail-gallery-img"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="popular">
              <div className="destination-section">
                <div className="where-header">
                  <div>
                    <h2 className="section-title">New event!</h2>
                    <p className="section-subtitle">Don't know what to choose? Check out our new activity!</p>
                  </div>
                  <button className="more-btn" onClick={() => navigate("/continent/all")}>Click here to check more</button>
                </div>
                <div className="card-list">
                  {newEvents.length > 0
                    ? newEvents.map(exp => (
                        <ExperienceCard key={exp.id} experience={exp} linkState={{ from: "main" }} />
                      ))
                    : <p style={{ color: "#666" }}>No experiences found.</p>
                  }
                </div>
              </div>
            </section>
      
            {/* Newsletter */}
            <section className="newsletter">
              <div className="newsletter-overlay"></div>
              <div className="newsletter-content">
                <h2>Get Your Travel Inspiration</h2>
                <p>Straight to Your Inbox</p>
                <div className="newsletter-form">
                  <input type="email" placeholder="Email address"/>
                  <button>Subscribe</button>
                </div>
              </div>
            </section>
      
            <footer className="footer">
              <div className="footer-container">
                <div className="footer-column">
                  <h3>e-Tourism</h3>
                  <p onClick={() => {
                    navigate("/");
                    setTimeout(() => {
                      window.scrollTo(0, 0);
                    }, 0);
                  }}>start your journey</p>
                </div>
                <div className="footer-column">
                  <h4>Join us</h4>
                  <p onClick={() => navigate("/register/ehost/step1")}>Become e-host</p>
                  <p onClick={() => navigate("/continent/all")}>View the newest event</p>
                </div>
                <div className="footer-column">
                  <h4>Travel</h4>
                  <p onClick={() => navigate("/continent/Asia")}>Asia</p>
                  <p onClick={() => navigate("/continent/Europe")}>Europe</p>
                  <p onClick={() => navigate("/continent/Africa")}>Africa</p>
                </div>
                <div className="footer-column">
                  <h4>Support</h4>
                  <p onClick={() => setShowTerms(true)} style={{ cursor: "pointer" }}>
                    User Terms
                  </p>
                </div>
              </div>
            </footer>
            {showTerms && (
              <div className="modal-overlay" onClick={() => setShowTerms(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="modal-close"
                    onClick={() => setShowTerms(false)}
                  >
                    ✕
                  </button>
                  <h2>Terms & Conditions</h2>
                  <div className="modal-content">
                    {termsText.split("\n\n").map((para, i) => (
                      <p key={i} style={{ whiteSpace: "pre-wrap" }}>{para}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

      <PhotoLightbox url={previewUrl} onClose={() => setPreviewUrl(null)} />
      {alertCard}
    </div>
  );
};

import { useState, useEffect } from "react";
import axios from "axios";
import "./DetailPage.css";

import videoImg from "../icon/livecover.png";
import head from "../icon/head.png";
import photo2 from "../icon/london1.jpg";
import photo3 from "../icon/london2.jpg";
import photo4 from "../icon/london3.jpg";
import { useNavigate, useSearchParams, Link, useLocation } from "react-router-dom";
import backIcon from "../icon/back.png";
import blog from "../icon/blogger.png";
import { getCountryImage } from "../../utils/countryImages";

const API_BASE = import.meta.env.VITE_API_URL;

const renderStars = (rating) => Array(Number(rating)).fill('\u2605').join(' ');

export const DetailPage = () => {
  const location = useLocation(); 
  const from = location.state?.from;
  const handleBack = () => {

  if (from === "map") {
    navigate("/MapPage");
  } else if (from === "ehost") {
    navigate("/EhostDashboard");
  } else {
    navigate("/MainPage");
  }
};

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const [experience, setExperience] = useState(null);
  const [reviews, setReviews] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const id = searchParams.get("id");
    if (!id) return;
    axios.get(`${API_BASE}/visitor/experiences/${id}`)
      .then(({ data }) => setExperience(data))
      .catch(() => {});
    axios.get(`${API_BASE}/visitor/reviews?experience_id=${id}`)
      .then(({ data }) => setReviews(data))
      .catch(() => {});
  }, [searchParams]);

  return (
    <div className="tour-page">

      {/* HERO */}
      <section
        className="detail-hero"
        style={{ backgroundImage: `url(${getCountryImage(experience?.country)})` }}
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
              <Link to="/help" className="nav-link">Helping centre</Link>
              <Link to="/Mybooking" className="nav-link">My booking</Link>
               {isLoggedIn ? (
                  <button className="nav-link nav-btn-link" onClick={handleLogout}>
                    Logout
                  </button>
                ) : (
                  <Link to="/login" className="nav-link">Login</Link>
                )}
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

            {(() => {
              const isPast = experience?.date_time && new Date(experience.date_time).getTime() <= Date.now();
              const notApproved = experience?.status && experience.status !== 'approved';
              const unavailable = isPast || notApproved;
              const reason = isPast
                ? 'Booking is closed — this experience has already started.'
                : notApproved
                ? 'This experience is not available for booking.'
                : null;
              return (
                <>
                  <button
                    className={`detail-book-btn${unavailable ? ' detail-book-btn--disabled' : ''}`}
                    disabled={unavailable}
                    onClick={() => !unavailable && navigate(`/PaymentPage?id=${searchParams.get("id")}`)}
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

          {experience?.sample_video_url ? (
            <video
              src={experience.sample_video_url}
              controls
              className="detail-video-player"
            />
          ) : (
            <img src={videoImg} alt="detail-live video"/>
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

          <img
            src={experience?.ehost_profile_image || head}
            className="detail-guide-avatar"
            alt="detail-guide"
          />

          <div>
            <h4>{experience?.ehost_first_name} {experience?.ehost_last_name}</h4>
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
              <h3 className="blog-name">{reviews[0].first_name} {reviews[0].last_name}</h3>
              <p className="blog-text">{reviews[0].comment}</p>
            </div>
            <div className="detail-video-left">
              <h3>Recommended by Travel Bloggers</h3>
              <p>Book the ticket and join us!</p>
              <img src={blog} alt="blogger"/>
            </div>
          </section>

          <section className="detail-review-section">
            <h3>{"Customer’s review is important for us"}</h3>
            <div className="detail-reviews">
              {reviews.slice(1).map((r) => (
                <div className="detail-review" key={r.id}>
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


      {/* PHOTOS */}
      <section className="detail-photo-section">

        <h3>More photo</h3>

        <div className="detail-photo-grid">

          <img src={photo2}/>
          <img src={photo2}/>
          <img src={photo3}/>
          <img src={photo4}/>

        </div>

      </section>


      <section className="detail-newsletter">

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

          <div className="footer-brand">
            <h3>e-Tourism</h3>
            <p>Follow us</p>
          </div>

          <div className="footer-column">
            <h4>About us</h4>
            <p>Company</p>
            <p>Careers</p>
            <p>Blog</p>
          </div>

          <div className="footer-column">
            <h4>Travel</h4>
            <p>Destinations</p>
            <p>Tours</p>
            <p>Guides</p>
          </div>

          <div className="footer-column">
            <h4>Support</h4>
            <p>Help Center</p>
            <p>Contact</p>
            <p>Terms</p>
          </div>

        </div>

      </footer>

    </div>
  );
};

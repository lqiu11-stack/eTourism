import "./BookingDetail.css";
import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import backIcon from "../icon/back.png";
import link2Icon from "../icon/link-2.png";
import approveIcon from "../icon/approve.png";
import enjoyIcon from "../icon/enjoy.png";
import { useLayoutEffect } from "react";
import { saveBookingToCalendar } from "../../utils/calendar";
import { AccountMenu } from "../../components/AccountMenu";



const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dt) => {
  if (!dt) return 'Date TBC';
  const d = new Date(dt);
  return `${d.getDate()} / ${d.getMonth() + 1} / ${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

export const MyBookingDetail = () => {
  const navigate = useNavigate();
  const [showTerms, setShowTerms] = useState(false);
  const [termsText, setTermsText] = useState("");
  const [joinModal, setJoinModal] = useState({ open: false, link: "" });
  const visitorUser = JSON.parse(localStorage.getItem("user") || "{}");
  const visitorDisplayName =
    visitorUser.display_name ||
    `${visitorUser.first_name || ""} ${visitorUser.last_name || ""}`.trim() ||
    visitorUser.email ||
    "your name";
  useEffect(() => {
  fetch("/terms.txt")
    .then((r) => r.text())
    .then(setTermsText)
    .catch(() => {});
}, []);


  console.log('[BookingDetail] component rendered');
  const [rating, setRating] = useState(0);
  const [quality, setQuality] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewStatus, setReviewStatus] = useState({ state: "idle", message: "" });
  const [reviewPopup, setReviewPopup] = useState(null);
  const location = useLocation();
  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, [location.key]);

  const token = localStorage.getItem("token");

  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const bookingIdParam = searchParams.get("id");

  // Booking passed directly via router state (from MyBooking card click)
  const stateBooking = location.state?.booking ?? null;

  const [booking, setBooking] = useState(stateBooking);
  const [experience, setExperience] = useState(
    stateBooking ? {
      id: stateBooking.experience_id,
      title: stateBooking.title,
      date_time: stateBooking.date_time,
      country: stateBooking.country,
      cover_image: stateBooking.cover_image,
    } : null
  );
  const [loading, setLoading] = useState(!stateBooking);
  const [error, setError] = useState("");
  const [refundPolicy, setRefundPolicy] = useState("");

  useEffect(() => {
    fetch("/refund-policy.txt")
      .then((r) => r.text())
      .then(setRefundPolicy)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const pendingId = localStorage.getItem("pending_booking_id");

    const fetchBooking = (id) =>
      axios.get(`${API_BASE}/visitor/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(({ data }) => {
        console.log('booking.status:', data.status);
        setBooking(data);
        return axios.get(`${API_BASE}/visitor/experiences/${data.experience_id}`);
      }).then(({ data }) => {
        setExperience(data);
        localStorage.removeItem("pending_booking_id");
      });
    console.log('[BookingDetail] bookingIdParam:', bookingIdParam, '| token:', token ? 'present' : 'MISSING', '| stateBooking:', !!stateBooking);

    if (bookingIdParam) {
      fetchBooking(bookingIdParam)
        .catch((err) => {
          console.error('[BookingDetail] fetchBooking failed:', err?.response?.status, err?.response?.data);
          if (!stateBooking) setError("Could not load booking details.");
        })
        .finally(() => setLoading(false));

    // Case 2: came back from Stripe (?session_id=XX)
    } else if (sessionId) {
      axios.post(
        `${API_BASE}/visitor/payments/stripe/capture`,
        { session_id: sessionId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
        .then(({ data }) => {
          if (data.booking && data.experience) {
            setBooking(data.booking);
            setExperience(data.experience);
            localStorage.removeItem("pending_booking_id");
          } else if (pendingId) {
            return fetchBooking(pendingId);
          }
        })
        .catch(() => {
          if (pendingId) return fetchBooking(pendingId);
          setError("Could not load your booking details.");
        })
        .finally(() => setLoading(false));

    // Case 3: pending_booking_id in localStorage (fallback)
    } else if (pendingId) {
      fetchBooking(pendingId)
        .catch(() => setError("Could not load booking details."))
        .finally(() => setLoading(false));

    } else {
      Promise.resolve().then(() => {
        setError("No booking found.");
        setLoading(false);
      });
    }
  }, [stateBooking, bookingIdParam, sessionId, token]);

  const coverImage = experience?.cover_image;
  const now = new Date();
  const eventDate = experience?.date_time ? new Date(experience.date_time) : null;
  const isPast = eventDate && eventDate < now;
  const hoursUntil = eventDate ? (eventDate - now) / 36e5 : null;
  const isWithin2h = hoursUntil !== null && hoursUntil <= 2;
  const submitReview = async () => {
    if (!booking?.experience_id) {
      setReviewStatus({ state: "error", message: "Missing experience info." });
      return;
    }
    if (rating < 1) {
      setReviewStatus({ state: "error", message: "Please select a star rating." });
      return;
    }
    const commentParts = [];
    if (quality.trim()) commentParts.push(`Quality: ${quality.trim()}`);
    if (reviewComment.trim()) commentParts.push(reviewComment.trim());
    setReviewStatus({ state: "submitting", message: "" });
    try {
      const { data } = await axios.post(
        `${API_BASE}/visitor/reviews`,
        {
          experience_id: booking.experience_id,
          rating,
          comment: commentParts.join("\n\n"),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const wasUpdated = data?.updated === true;
      const successMessage = wasUpdated
        ? "Your previous review was updated."
        : "Thanks for your review!";
      setReviewStatus({ state: "success", message: successMessage });
      setReviewPopup({
        title: wasUpdated ? "Review updated" : "Review submitted",
        message: successMessage,
        tone: "success",
      });
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to submit review. Please try again.";
      setReviewStatus({ state: "error", message });
      setReviewPopup({
        title: "Submission failed",
        message,
        tone: "error",
      });
    }
  };

  const isRefundBlocked =
    !booking ||
    isPast ||
    booking?.status === "refund_pending" ||
    booking?.status === "cancelled" ||
    booking?.status === "refunded";

  return (
    <div className="paymentsuccess-page">

      <nav className="navbar">
        <button
          type="button"
          className="detail-back-btn"
          onClick={() => {navigate("/MyBooking"); window.scrollTo(0, 0);}}
          aria-label="Back"
        >
          <img src={backIcon} alt="Back" className="detail-back-icon" />
        </button>
        <div className="nav-links">
          <Link to="/register/ehost/step1" className="nav-link">Become E-host</Link>
          <AccountMenu />
        </div>
      </nav>

      {/* Booking Card */}
      <div>
        <div className="Mybooking-hero">
        <h1 className="Myhero-title">Booking detail</h1>
        </div>

      <div className="Detail-booking-card">
        <h3>Here is your booking detail</h3>

        {loading && <p className="booking-loading">Loading your booking...</p>}
        {error && <p className="booking-error">{error}</p>}

        {!loading && !error && booking && experience && (
          <div className="booking-content">
            <img src={coverImage} className="booking-img" alt={experience.title} />

            <div className="booking-info">
              <h4
                className="booking-title-link"
                role="button"
                tabIndex={0}
                onClick={() => { navigate(`/DetailPage?id=${booking.experience_id}`); window.scrollTo(0, 0); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/DetailPage?id=${booking.experience_id}`);
                    window.scrollTo(0, 0);
                  }
                }}
              >
                {experience.title}
              </h4>

              <div className="schedual">
                <p>Stream start at {formatDate(experience.date_time)}</p>

                {!isPast &&
                booking.status !== "refund_pending" &&
                booking.status !== "cancelled" &&
                booking.status !== "refunded" && (
                  <button
                    className="calendar-btn"
                    onClick={() => saveBookingToCalendar(booking, experience)}
                  >
                    Save to calendar
                  </button>
                )}

              </div>

              {booking.contact_name && (
                <p className="booking-meta">Booked for: <strong>{booking.contact_name}</strong></p>
              )}
              <p className="booking-meta">Amount paid: <strong>£{Number(booking.amount_paid).toFixed(2)}</strong></p>

              {/* {booking.status === "refund_pending" && (
                <div className="booking-status-badge booking-status-badge--pending">
                  Refund pending, awaiting admin approval
                </div>
              )} */}

              <div className="booking-actions">

                {(booking.status === "cancelled" || booking.status === "refunded" || booking.status === "refund_pending") ? (
                  <span className={`booking-status-text booking-status-text--${booking.status.replace('_', '-')}`}>
                    {booking.status === "refund_pending" ? "Refund Pending" : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                ) : (
                  isPast ? (
                    null /* <button className="primary-btn">Contact customer service</button> */
                  ) : isWithin2h && booking.meeting_link ? (
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => setJoinModal({ open: true, link: booking.meeting_link })}
                    >
                      Join the stream
                    </button>
                  ) : (
                    <button className="primary-btn primary-btn--disabled" disabled>
                      {isWithin2h ? 'Link not yet available' : 'Not started yet'}
                    </button>
                  )

                )}


              </div>

              {!isPast && booking.status != "refund_pending" && (
                <span className="hint">
                  Link can be accessed 2 hours before the stream st
                </span>
              )}
            </div>
          </div>
        )}

        {/* How to join */}
        {!isPast && (
        <div className="how-section">
          <h4>How to join the stream?</h4>
          <div className="steps">
            <div className="step">
              <div className="step-icon"><img src={link2Icon} className="iconsize"/></div>
              <p>Join the link from the booking detail page</p>
            </div>
            <div className="step">
              <div className="step-icon"><img src={approveIcon} className="iconsize"/></div>
              <p>Our assistance will approve your join request</p>
            </div>
            <div className="step">
              <div className="step-icon"><img src={enjoyIcon} className="iconsize2"/></div>
              <p>Enjoy the event with us!</p>
            </div>
          </div>
        </div>
        )}

        {/* Refund */}
        {!isPast && (
        <div className="refund-section">
          <h4>Check our refund policy</h4>
          <div className="refund">
            <p style={{ whiteSpace: "pre-wrap" }}>{refundPolicy}</p>
            <div className="refund-buttons">
              <button
                disabled={isRefundBlocked}
                onClick={() => { navigate(`/RefundPage?id=${booking.id}`); window.scrollTo(0, 0); }}
              >
                {booking.status === 'refund_pending'
                  ? 'Refund requested'
                  : booking.status === 'refunded'
                  ? 'Already refunded'
                  : 'Apply for refund'}
              </button>
              {/* <button
                disabled={['refund_pending', 'refunded'].includes(booking?.status)}
              >Reschedule</button> */}
            </div>
          </div>
        </div>
        )}
      {/* feedback */}
      {isPast && (
      <div className="review-section">
        <h4 className="review-title">Tell us how you feel?</h4>

        <div className="review-card">

          {/* Q1 */}
          <p className="review-question">
            How would you rate your overall experience?
          </p>

          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() => setRating(star)}
                className="star"
              >
                {star <= rating ? "★" : "☆"}
              </span>
            ))}
          </div>

          {/* Q2 */}
          <p className="review-question">
            How would you rate the quality of the tour and explanation?
          </p>

          <input
            className="review-input"
            placeholder=""
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            disabled={reviewStatus.state === "submitting" || reviewStatus.state === "success"}
          />

          {/* Q3 */}
          <p className="review-question">
            Any additional comments?
          </p>

          <textarea
            className="review-textarea"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            disabled={reviewStatus.state === "submitting" || reviewStatus.state === "success"}
          />

          {reviewStatus.message && (
            <p className={`review-status review-status--${reviewStatus.state}`}>
              {reviewStatus.message}
            </p>
          )}

          <div className="review-submit-wrapper">
            <button
              className="review-submit-btn"
              onClick={submitReview}
              disabled={reviewStatus.state === "submitting" || reviewStatus.state === "success"}
            >
              {reviewStatus.state === "submitting"
                ? "Submitting..."
                : reviewStatus.state === "success"
                ? "Review submitted"
                : "Submit a review"}
            </button>
          </div>

        </div>
      </div>
      )}
      </div>
      </div>

      {reviewPopup && (
        <div
          className="review-popup-overlay"
          onClick={() => {
            const wasSuccess = reviewPopup.tone === "success";
            setReviewPopup(null);
            if (wasSuccess) navigate("/MyBooking");
          }}
        >
          <div
            className={`review-popup-card review-popup-card--${reviewPopup.tone}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="review-popup-title">{reviewPopup.title}</h3>
            <p className="review-popup-message">{reviewPopup.message}</p>
            <button
              className="review-popup-btn"
              type="button"
              onClick={() => {
                const wasSuccess = reviewPopup.tone === "success";
                setReviewPopup(null);
                if (wasSuccess) navigate("/MyBooking");
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

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

      {joinModal.open && (
        <div className="modal-overlay" onClick={() => setJoinModal({ open: false, link: "" })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setJoinModal({ open: false, link: "" })}
            >
              ✕
            </button>
            <h2>Before you join</h2>
            <div className="modal-content">
              <p>Please set your display name in the meeting to:</p>
              <p style={{ fontSize: 18, fontWeight: 600, margin: "12px 0", color: "#a3373b" }}>
                {visitorDisplayName}
              </p>
              <p style={{ fontSize: 13, color: "#6b6b6b" }}>
                This helps the e-host recognise you and tick you off the booking list when you arrive.
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button
                type="button"
                className="primary-btn primary-btn--disabled"
                style={{ cursor: "pointer", opacity: 1 }}
                onClick={() => setJoinModal({ open: false, link: "" })}
              >
                Cancel
              </button>
              <a
                href={joinModal.link}
                target="_blank"
                rel="noreferrer"
                className="primary-btn"
                onClick={() => setJoinModal({ open: false, link: "" })}
                style={{ display: "inline-block", textDecoration: "none" }}
              >
                Open meeting
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

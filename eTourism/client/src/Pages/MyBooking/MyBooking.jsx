import "./MyBooking.css";
import backIcon from "../icon/back.png";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";
import { saveBookingToCalendar } from "../../utils/calendar";
import { AccountMenu } from "../../components/AccountMenu";
import { useAlertCard } from "../../components/useAlertCard";


export const BookingDetail = () => {
  const location = useLocation();
  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, [location.key]);

  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get("id");

  return (
    <div>
      <h1>Booking Detail</h1>
      <p>Booking ID: {id}</p>
    </div>
  );
};

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dt) => {
  if (!dt) return 'Date TBC';
  const d = new Date(dt);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

export const MyBooking = () => {
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
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { alert: showAlert, card: alertCard } = useAlertCard();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    axios.get(`${API_BASE}/visitor/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(({ data }) => setBookings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const now = new Date();

  const renderActions = (b) => {
    const eventDate = b.date_time ? new Date(b.date_time) : null;
    const isPast = eventDate && eventDate < now;
    const hoursUntil = eventDate ? (eventDate - now) / 36e5 : null;
    const isWithin2h = hoursUntil !== null && hoursUntil <= 2;

    const stop = (e) => e.stopPropagation();

    if (b.status === 'cancelled' || b.status === 'refunded') {
      return <span className="Mybooking-status-tag">{b.status}</span>;
    }

    // Refund in progress
    if (b.status === 'refund_pending') {
      return (
        <div className="Mybooking-card-actions" onClick={stop}>
          <button className="Mybooking-small-refund-btn" onClick={() => navigate(`/MyBookingDetail?id=${b.id}`, { state: { booking: b } })}>Check the refund process</button>
        </div>
      );
    }

    // Past event
    if (isPast) {
      return (
        <div className="Mybooking-card-actions" onClick={stop}>
          <button className="Mybooking-small-feedback-btn" onClick={() => navigate(`/MyBookingDetail?id=${b.id}`, { state: { booking: b } })}>Tell us your feedback</button>
        
        </div>
      );
    }

    // Future — join button depends on how close the event is
    const joinBtn = (isWithin2h && b.meeting_link)
      ? (
        <button
          type="button"
          className="Mybooking-main-btn"
          onClick={(e) => { stop(e); setJoinModal({ open: true, link: b.meeting_link }); }}
        >
          Join the stream
        </button>
      ) : (
        <button className="Mybooking-main-btn Mybooking-main-btn--disabled" disabled onClick={stop}>
          {isWithin2h ? 'Link not yet available' : 'Not started yet'}
        </button>
      );

    return (
      <>
        {joinBtn}
        <div className="Mybooking-card-actions" onClick={stop}>
          
          <button
            className="Mybooking-small-btn"
            onClick={(e) => {
              stop(e);
              navigate(`/RefundPage?id=${b.id}`, {
                state: { from: "MyBooking", booking: b }
              });
            }}
          >
            Refund this activity
          </button>
          {/* <button className="Mybooking-small-btn" onClick={(e) => { stop(e); navigate(`/booking/${b.id}/reschedule`); }}>
            Reschedule
          </button> */}
          <button
            className="Mybooking-calendar-btn"
            onClick={async (e) => {
              stop(e);
              const r = saveBookingToCalendar(b, b);
              if (!r.ok) await showAlert("error", r.reason);
            }}
          >
            Save to calendar
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="Mybooking-page">

      <nav className="navbar">
        <button type="button" className="detail-back-btn" onClick={() => navigate("/MainPage")} aria-label="Back">
          <img src={backIcon} alt="Back" className="detail-back-icon" />
        </button>
        <div className="nav-links">
          <Link to="/register/ehost/step1" className="nav-link">Become E-host</Link>
          <AccountMenu />
        </div>
      </nav>

      <div className="Mybooking-hero">
        <h1 className="Myhero-title">My Booking</h1>
      </div>

      <div className="Mybooking-container">
        {loading && <p className="Mybooking-msg">Loading your bookings...</p>}

        {!loading && bookings.length === 0 && (
          <p className="Mybooking-msg">You have no bookings yet.</p>
        )}

        {bookings.map((b) => (
          <div
            className="Mybooking-card"
            key={b.id}
            onClick={() => navigate(`/MyBookingDetail?id=${b.id}`, { state: { booking: b } })}
            style={{ cursor: "pointer" }}
            >
            <img src={b.cover_image} className="Mybooking-card-img" alt={b.title} />

            <div className="Mybooking-card-info">
              <h2>{b.title}</h2>
              <p className="Mybooking-time">
                {formatDate(b.date_time)}
              </p>
              <p className="Mybooking-amount">£{Number(b.amount_paid).toFixed(2)} paid</p>
              <div className="help"><p>Need any help?</p></div>
              {renderActions(b)}
            </div>
          </div>
        ))}
      </div>

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
              <p>
                Please set your display name in the meeting to:
              </p>
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
                className="Mybooking-small-btn"
                onClick={() => setJoinModal({ open: false, link: "" })}
              >
                Cancel
              </button>
              <a
                href={joinModal.link}
                target="_blank"
                rel="noreferrer"
                className="Mybooking-main-btn"
                onClick={() => setJoinModal({ open: false, link: "" })}
                style={{ display: "inline-block", textDecoration: "none" }}
              >
                Open meeting
              </a>
            </div>
          </div>
        </div>
      )}
      {alertCard}
    </div>
  );
};

import "./MyBooking.css";
import backIcon from "../icon/back.png";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { getCountryImage } from "../../utils/countryImages";

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dt) => {
  if (!dt) return 'Date TBC';
  const d = new Date(dt);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

export const MyBooking = () => {
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

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


    if (b.status === 'cancelled' || b.status === 'refunded') {
      return <span className="Mybooking-status-tag">{b.status}</span>;
    }

    return (
      <>
        {b.meeting_link ? (
          <a
            href={b.meeting_link}
            className="Mybooking-main-btn"
            target="_blank"
            rel="noreferrer"
          >
            Join the stream
          </a>
        ) : (
          <button className="Mybooking-main-btn Mybooking-main-btn--disabled" disabled>
            Link not yet available
          </button>
        )}
        <div className="Mybooking-card-actions">
          {isPast ? (
            <button className="Mybooking-small-btn">Tell us your feedback</button>
          ) : (
            <>
              <button className="Mybooking-small-btn"
                onClick={() => navigate(`/booking/${b.id}/refund`)}>
                Refund this activity
              </button>
              <button className="Mybooking-small-btn"
                onClick={() => navigate(`/booking/${b.id}/reschedule`)}>
                Reschedule
              </button>
            </>
          )}
          <button className="Mybooking-small-btn">Customer service</button>
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
          <Link to="/help" className="nav-link">Helping centre</Link>
          <Link to="/Mybooking" className="nav-link">My booking</Link>
          {isLoggedIn ? (
            <button className="nav-link nav-btn-link" onClick={handleLogout}>Logout</button>
          ) : (
            <Link to="/login" className="nav-link">Login</Link>
          )}
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
          <div className="Mybooking-card" key={b.id}>
            <img src={getCountryImage(b.country)} className="Mybooking-card-img" alt={b.title} />

            <div className="Mybooking-card-info">
              <h2>{b.title}</h2>
              <p className="Mybooking-time">
                {formatDate(b.date_time)}
                <button className="Mybooking-calendar-btn">Save to calendar</button>
              </p>
              <p className="Mybooking-amount">£{Number(b.amount_paid).toFixed(2)} paid</p>
              <div className="help"><p>Need any help?</p></div>
              {renderActions(b)}
            </div>
          </div>
        ))}
      </div>

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
            <p>Company</p><p>Careers</p><p>Blog</p>
          </div>
          <div className="footer-column">
            <h4>Travel</h4>
            <p>Destinations</p><p>Tours</p><p>Guides</p>
          </div>
          <div className="footer-column">
            <h4>Support</h4>
            <p>Help Center</p><p>Contact</p><p>Terms</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

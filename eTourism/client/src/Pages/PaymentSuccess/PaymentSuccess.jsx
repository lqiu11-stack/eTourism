import "./PaymentSuccess.css";
import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import backIcon from "../icon/back.png";
import link2Icon from "../icon/link-2.png";
import approveIcon from "../icon/approve.png";
import enjoyIcon from "../icon/enjoy.png";
import success from "../icon/success.png";
import { saveBookingToCalendar } from "../../utils/calendar";
const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dt) => {
  if (!dt) return 'Date TBC';
  const d = new Date(dt);
  return `${d.getDate()} / ${d.getMonth() + 1} / ${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

export const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const paypalToken = searchParams.get("token"); // PayPal order ID on return

  const [booking, setBooking] = useState(null);
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(!!(sessionId || paypalToken));
  const [error, setError] = useState((sessionId || paypalToken) ? "" : "No session found.");
  const [refundPolicy, setRefundPolicy] = useState("");

  useEffect(() => {
    fetch("/refund-policy.txt")
      .then((r) => r.text())
      .then(setRefundPolicy)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const bookingId = localStorage.getItem("pending_booking_id");

    const fetchBooking = (id) =>
      axios.get(`${API_BASE}/visitor/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(({ data }) => {
        setBooking(data);
        return axios.get(`${API_BASE}/visitor/experiences/${data.experience_id}`);
      }).then(({ data }) => {
        setExperience(data);
        localStorage.removeItem("pending_booking_id");
      });

    if (paypalToken && bookingId) {
      axios.post(
        `${API_BASE}/visitor/payments/paypal/capture-order`,
        { orderID: paypalToken, booking_id: parseInt(bookingId) },
        { headers: { Authorization: `Bearer ${token}` } }
      )
        .then(() => fetchBooking(bookingId))
        .catch(() => {
          if (bookingId) return fetchBooking(bookingId);
          setError("PayPal payment capture failed.");
        })
        .finally(() => setLoading(false));
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
          } else if (bookingId) {
            return fetchBooking(bookingId);
          }
        })
        .catch(() => {
          if (bookingId) return fetchBooking(bookingId);
          setError("Could not load your booking details.");
        })
        .finally(() => setLoading(false));
    } else if (bookingId) {
      fetchBooking(bookingId).finally(() => setLoading(false));
    }
  }, [sessionId, paypalToken, token]);

  const coverImage = experience?.cover_image;
  const now = new Date();
  const eventDate = experience?.date_time ? new Date(experience.date_time) : null;
  const hoursUntilEvent = eventDate ? (eventDate - now) / 36e5 : null;
  const joinEnabled = hoursUntilEvent !== null && hoursUntilEvent <= 2;

  return (
    <div className="paymentsuccess-page">

      <nav className="navbar">
        <button
          type="button"
          className="detail-back-btn"
          onClick={() => navigate("/MainPage")}
          aria-label="Back"
        >
          <img src={backIcon} alt="Back" className="detail-back-icon" />
        </button>
        <div className="nav-links">
          <Link to="/Mybooking" className="nav-link">My booking</Link>
          {isLoggedIn ? (
            <button className="nav-link nav-btn-link" onClick={handleLogout}>Logout</button>
          ) : (
            <Link to="/login" className="nav-link">Login</Link>
          )}
        </div>
      </nav>

      {/* Success Section */}
      <div className="success-section">
        <div className="success-icon">
          <img src={success} className="icontick" />
        </div>
        <h2>Payment success!</h2>
        <p>Hope you enjoy the time with us!</p>
      </div>

      {/* Booking Card */}
      <div className="booking-card">
        <h3>Here is your booking detail</h3>

        {loading && <p className="booking-loading">Loading your booking...</p>}
        {error && <p className="booking-error">{error}</p>}

        {!loading && !error && booking && experience && (
          <div className="booking-content">
            <img src={coverImage} className="booking-img" alt={experience.title} />

            <div className="booking-info">
              <h4>{experience.title}</h4>

              <div className="schedual">
                <p>Stream start at {formatDate(experience.date_time)}</p>
                <button
                  className="calendar-btn"
                  onClick={() => saveBookingToCalendar(booking, experience)}
                >
                  Save to calendar
                </button>
              </div>

              {booking.contact_name && (
                <p className="booking-meta">Booked for: <strong>{booking.contact_name}</strong></p>
              )}
              <p className="booking-meta">Amount paid: <strong>£{Number(booking.amount_paid).toFixed(2)}</strong></p>

              <div className="booking-actions">
                {booking.meeting_link ? (
                  <a
                    href={joinEnabled ? booking.meeting_link : undefined}
                    className={`primary-btn${joinEnabled ? '' : ' primary-btn--disabled'}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={!joinEnabled ? (e) => e.preventDefault() : undefined}
                  >
                    Click here to join the event
                  </a>
                ) : (
                  <button className="primary-btn primary-btn--disabled" disabled>
                    Meeting link not yet available
                  </button>
                )}
              </div>

              <span className="hint">
                Link can be accessed 2 hours before the stream start
              </span>
            </div>
          </div>
        )}

        {/* How to join */}
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

        {/* Refund */}
        <div className="refund-section">
          <h4>Check our refund policy</h4>
          <div className="refund">
            <p style={{ whiteSpace: "pre-wrap" }}>{refundPolicy}</p>
            <div className="refund-buttons">
              <button
                disabled={!booking || ['refund_pending', 'refunded', 'cancelled'].includes(booking.status)}
                onClick={() => navigate(`/RefundPage?id=${booking.id}`, { state: { booking, from: 'PaymentSuccess' } })}
              >
                {booking?.status === 'refund_pending'
                  ? 'Refund requested'
                  : booking?.status === 'refunded'
                  ? 'Already refunded'
                  : 'Apply for the refund'}
              </button>
              {/* <button>Reschedule</button> */}
              {/* <button>Contact customer service</button> */}
            </div>
          </div>
        </div>

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

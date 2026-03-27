import "./MyBooking.css";
import backIcon from "../icon/back.png";
import thailand from "../icon/thai.png";
import japan from "../icon/japan.png";
import sydney from "../icon/paris.png";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";


export const MyBooking = () => {
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="Mybooking-page">

      {/* NAVBAR */}
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

      {/* HERO */}
      <div className="Mybooking-hero">

        <h1 className="Myhero-title">My Booking</h1>
      </div>

      {/* CONTENT */}
      <div className="Mybooking-container">

        {/* CARD 1 */}
        <div className="Mybooking-card">
          <img src={thailand} className="Mybooking-card-img" />

          <div className="Mybooking-card-info">
            <h2>Thailand Religious Tourism</h2>
            <p className="Mybooking-time">
              20/4/2025 14:00
              <button className="Mybooking-calendar-btn">
                    save to calendar
                </button>
            </p>
            <div className="help">
                <p>
                    Need any help?
                </p>
            </div>
            <div className="Mybooking-card-actions">
              <button className="Mybooking-small-btn">Refund this activity</button>
              <button className="Mybooking-small-btn">Reschedule</button>
              <button className="Mybooking-small-btn">customer service</button>
            </div>
          </div>

          <button className="Mybooking-main-btn">Join the stream</button>
        </div>

        {/* CARD 2 */}
        <div className="Mybooking-card">
          <img src={japan} className="Mybooking-card-img" />

          <div className="Mybooking-card-info">
            <h2>Japan Art Tourism</h2>
            <p className="Mybooking-time">20/3/2025 14:00</p>
            <div className="help">
                <p>
                    Need any help?
                </p>
            </div>
            <div className="Mybooking-card-actions">
            <button className="Mybooking-small-btn">Check the refund process</button>
            </div>
          </div>
        </div>

        {/* CARD 3 */}
        <div className="Mybooking-card">
          <img src={sydney} className="Mybooking-card-img" />

          <div className="Mybooking-card-info">
            <h2>Thailand Religious Tourism</h2>
            <p className="Mybooking-time">20/4/2024 14:00</p>
            <div className="help">
                <p>
                    Need any help?
                </p>
            </div>
             <div className="Mybooking-card-actions">
            <button className="Mybooking-small-btn">
              Tell us your feedback about the event
            </button>
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
import "./PaymentSuccess.css";
import thailandImg from "../icon/thai.png"; 
// import thailandImg from "../icon/thai.png"; 
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import backIcon from "../icon/back.png";
import { Link } from "react-router-dom";
import link2Icon from "../icon/link-2.png";
import approveIcon from "../icon/approve.png";
import enjoyIcon from "../icon/enjoy.png";
import success from "../icon/success.png";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

export const PaymentSuccessPage = () => {
    const navigate = useNavigate();
    /*login */
    const token = localStorage.getItem("token");
    const isLoggedIn = !!token;
     const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };


    /* check payment */ 
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        if (!sessionId) return;

        axios.post(
        `${API_BASE}/visitor/payments/capture-stripe`,
        { session_id: sessionId },
        {
            headers: {
            Authorization: `Bearer ${token}`,
            },
        }
        )
        .then(() => {
        console.log("Payment captured");
        })
        .catch(() => {
        console.log("Capture failed");
        });
    }, [sessionId, token]);
    
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
              <Link to="/help" className="nav-link">Helping centre</Link>
              <Link to="/booking" className="nav-link">My booking</Link>
               {isLoggedIn ? (
                  <button className="nav-link nav-btn-link" onClick={handleLogout}>
                    Logout
                  </button>
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

        <div className="booking-content">
          <img src={thailandImg} className="booking-img" />

          <div className="booking-info">
            <h4>Thailand Religious Tourism</h4>

            <div className="schedual">
            <p>Stream start at 20/ 4/ 2025 14:00</p>
                <button className="calendar-btn">
                    save to calendar
                </button>
              </div>

            <div className="booking-actions">
              <button className="primary-btn">
                Click here to join the event
              </button>
            </div>

            <span className="hint">
              Link can be accessed 2 hour before the stream start
            </span>
          </div>
        </div>

        {/* How to join */}
        <div className="how-section">
          <h4>How to join the stream?</h4>

          <div className="steps">
            <div className="step">
              <div className="step-icon">
                <img src={link2Icon} className="iconsize"/>
              </div>
              <p>Join the link from the booking detail page</p>
            </div>

            <div className="step">
              <div className="step-icon">
                <img src={approveIcon} className="iconsize"/>
              </div>
              <p>Our assistance will approve your join request</p>
            </div>

            <div className="step">
              <div className="step-icon">
                <img src={enjoyIcon} className="iconsize2"/>
              </div>
              <p>Enjoy the event with us!</p>
            </div>
          </div>
        </div>

        {/* Refund */}
        <div className="refund-section">
          <h4>Check our refund policy</h4>

        <div className="refund">
            <p>
                Free cancellation up to 24 hours before live start. If you miss the
                session, a replay will be available for 24 hours. In case of
                technical issues, we will provide access to the full recording.
            </p>

            <div className="refund-buttons">
                <button>Apply for the refund</button>
                <button>Reschedule</button>
                <button>Contact customer service</button>
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
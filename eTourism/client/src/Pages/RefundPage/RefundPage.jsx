import "./RefundPage.css";
import backIcon from "../icon/back.png";
import thailandImg from "../icon/thai.png"; 
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";

export const RefundPage = () => {
  const API_BASE = import.meta.env.VITE_API_URL;
  const location = useLocation();
  const from = location.state?.from;
  
  const stateBooking = location.state?.booking ?? null;

  const [booking, setBooking] = useState(stateBooking);
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (location.state?.scrollTop) {
      window.scrollTo(0, 0);
    }
  }, [location.state]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString();
  };

  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");


  const token = localStorage.getItem("token");
  const isLoggedIn = !!token; 
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };
  
  const navigate = useNavigate();

  const [reason, setReason] = useState("");
  const [agreed, setAgreed] = useState(false);
  // const refundStatus = getRefundStatus(experience?.date_time);

  const getRefundAmount = () => {
    if (refundStatus === "full") return "100%";
    if (refundStatus === "half") return "50%";
    return "0%";
  };

  const getRefundStatus = (eventDateStr) => {
  if (!eventDateStr) return null;

  const now = new Date();
  const eventDate = new Date(eventDateStr);

  const diffMs = eventDate - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffDays >= 5) {
      return "full";
    } else if (diffHours >= 24) {
      return "half";
    } else {
      return "none";
    }
  };
const refundStatus = getRefundStatus(experience?.date_time);

function getRefundRate(refundStatus) {
  if (refundStatus === "full") return 1;
  if (refundStatus === "half") return 0.5;
  return 0;
}
const refundRate = getRefundRate(refundStatus);
const refundAmount = Number(booking?.amount_paid || 0) * refundRate;


  useEffect(() => {
  if (!id) return;

  axios.get(`${API_BASE}/visitor/bookings/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(({ data }) => {
      setBooking(data);
      return axios.get(`${API_BASE}/visitor/experiences/${data.experience_id}`);
    })
    .then(({ data }) => {
      setExperience(data);
    })
    .catch((err) => {
      console.error("Failed to load refund data:", err);
    })
    .finally(() => {
      setLoading(false);
    });
}, [id, token]);

  return (
    <div className="cancel-page">
        <nav className="navbar">
        <button
          type="button"
          className="detail-back-btn"
          onClick={() => {
            if (from === "MyBooking") {
              navigate("/MyBooking", { state: { scrollTop: true } });
            } else if (from === "MyBookingDetail") {
              navigate(`/MyBookingDetail?id=${id}`, { state: { scrollTop: true } });
            } else {
              navigate(-1);
            }
          }}
        >
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

      {/* ===== HERO ===== */}
      <div>
        <div className="Mybooking-hero">
        <h1 className="Myhero-title">Refund and cancel</h1>
      </div>

      {/* ===== BOOKING CARD ===== */}
      <div className="refund-booking-card">
        <img src={thailandImg} alt="trip" />

        <div className="refund-booking-info">
          <h2>{experience?.title ?? "Loading..."}</h2>
          <p>{experience?.date_time ? formatDate(experience.date_time) : ""}</p>
        </div>

        <button className="service-btn">customer service</button>
      </div>

      {/* ===== REFUND SECTION ===== */}
      <div className="refund-box">


        <h2>Apply for refund</h2>

        <p>Please tell us the refunding reason*</p>
        <input
          className="reason-input"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <p className="policy-title">Based on our refund policy</p>

        <div className="policy-row">
          <div className={`policy-card ${refundStatus === "full" ? "active" : ""}`}>
            <h3>Fully refund</h3>
            <span>cancel 5+ days before event</span><br></br>
            <span className="link">Click to check the cancel policy</span>
          </div>

          <div className={`policy-card ${refundStatus === "half" ? "active" : ""}`}>
            <h3>Half refund</h3>
            <span>cancel 24+ hours before event</span><br></br>
            <span className="link">Click to check the cancel policy</span>
          </div>

          <div className={`policy-card ${refundStatus === "none" ? "active" : ""}`}>
            <h3>Not refundable</h3>
            <span>within 24 hours of the event</span><br></br>
            <span className="link">Click to check the cancel policy</span>
          </div>
        </div>

        <p className="refund-amount">
          You will get <b>£{refundAmount}</b> refund if you cancel right now.
        </p>

        <div className="refund-bottom">
          <label>
            <input
              type="checkbox"
              checked={agreed}
              onChange={() => setAgreed(!agreed)}
            />
              I agree to the cancel policy and confirm the refund amount
          </label>

          <button
            className="cancel-btn"
            disabled={!agreed}
          >
            Cancel booking
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};
import "./PaymentPage.css";
import paypalIcon from "../icon/paypal.png";
import masterIcon from "../icon/card.png";
import backIcon from "../icon/back.png";
import close from "../icon/close.png";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import bg from "../icon/worldtravel.jpg";
import { InfoTooltip } from "../../components/InfoTooltip";

const API_BASE = import.meta.env.VITE_API_URL;

export const PaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;
  const experienceId = searchParams.get("id");

  const [experience, setExperience] = useState(null);
  const [qtyNormal, setQtyNormal] = useState(0);
  const [qtyDiscounted, setQtyDiscounted] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedAllAdults, setAgreedAllAdults] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsText, setTermsText] = useState("");
  const [showWatchOnlyTerms, setShowWatchOnlyTerms] = useState(false);
  const [watchOnlyTermsText, setWatchOnlyTermsText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [groupGenderType, setGroupGenderType] = useState("");

  const genderPreference = experience?.gender_preference || "any";
  const requiresGroupGender = genderPreference !== "any";

  const genderPreferenceHint = {
    female_only: "This experience is for all-female groups only.",
    male_only: "This experience is for all-male groups only.",
    no_all_male_groups: "The eHost does not accept all-male groups for this experience.",
    no_all_female_groups: "The eHost does not accept all-female groups for this experience.",
  }[genderPreference];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    if (!experienceId) return;
    axios.get(`${API_BASE}/visitor/experiences/${experienceId}`)
      .then(({ data }) => setExperience(data))
      .catch(() => {});
  }, [experienceId]);

  useEffect(() => {
    fetch("/terms.txt")
      .then((r) => r.text())
      .then(setTermsText)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/watch-only-terms.txt")
      .then((r) => r.text())
      .then(setWatchOnlyTermsText)
      .catch(() => {});
  }, []);

  const normalPrice = experience ? parseFloat(experience.price) : 0;
  const discountedPrice = experience
    ? experience.price_discounted
      ? parseFloat(experience.price_discounted)
      : Math.max(0, normalPrice - 10)
    : 0;
  const total = qtyNormal * normalPrice + qtyDiscounted * discountedPrice;

  const bookingUnavailableReason = experience
    ? experience.status && experience.status !== 'approved'
      ? 'This experience is not available for booking yet.'
      : !experience.date_time
      ? 'This experience has no scheduled time slot.'
      : new Date(experience.date_time).getTime() <= Date.now()
      ? 'Booking is closed — this experience has already started.'
      : null
    : null;

  const validate = () => {
    if (qtyNormal + qtyDiscounted === 0) {
      setError("Please select at least one ticket.");
      return false;
    }
    if (!name || !email) {
      setError("Please fill in your name and email.");
      return false;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return false;
    }
    if (!agreedTerms) {
      setError("Please agree to the Terms before checkout.");
      return false;
    }
    if (!agreedAllAdults) {
      setError("Please confirm all viewers are 18+ before checkout.");
      return false;
    }
    if (requiresGroupGender && !groupGenderType) {
      setError("Please tell us the gender make-up of your group.");
      return false;
    }
    if (!token) {
      navigate(`/login?redirect=/PaymentPage?id=${experienceId}`);
      return false;
    }
    setError("");
    return true;
  };

  const createBooking = async () => {
    const { data } = await axios.post(
      `${API_BASE}/visitor/bookings`,
      {
        experience_id: experienceId,
        qty_normal: qtyNormal,
        qty_discounted: qtyDiscounted,
        contact_name: name,
        contact_email: email,
        agreed_to_terms: true,
        ...(requiresGroupGender ? { group_gender_type: groupGenderType } : {}),
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.booking.id;
  };

  const handleStripe = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const bookingId = await createBooking();
      localStorage.setItem("pending_booking_id", bookingId);
      const { data } = await axios.post(
        `${API_BASE}/visitor/payments/create-session`,
        { booking_id: bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.href = data.url;
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayPal = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const bookingId = await createBooking();
      localStorage.setItem("pending_booking_id", bookingId);
      const { data } = await axios.post(
        `${API_BASE}/visitor/payments/paypal/create-order`,
        { booking_id: bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const approvalLink = data.links.find((l) => l.rel === "approve");
      if (approvalLink) window.location.href = approvalLink.href;
    } catch (err) {
      setError(err.response?.data?.message || "PayPal payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dt) =>
    dt ? new Date(dt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "";

  return (
    <div className="payment-page"
    style={{ backgroundImage: `url(${bg})` }}>
      <div className="payment-card">

        <nav className="navbar">
          <button
            type="button"
            className="detail-back-btn"
            onClick={() => navigate(`/DetailPage?id=${experienceId}`)}
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

        {/* LEFT */}
        <div className="payment-left">
          <h2>Payment</h2>

          <p className="tour-title">{experience?.title}</p>

          <p className="live-time">
            <strong>Live Start</strong><br />
            {formatDate(experience?.date_time)}
          </p>

          {/* Ticket 1 */}
          <div className="ticket">
            <div>
              <p className="ticket-title">
                Normal ticket <span>£{normalPrice} / per ticket</span>
              </p>
              <span className="small-text">(include Q&A)</span>
            </div>
            <div className="counter">
              <button onClick={() => setQtyNormal(Math.max(0, qtyNormal - 1))}>-</button>
              <span>{qtyNormal}</span>
              <button onClick={() => setQtyNormal(qtyNormal + 1)}>+</button>
            </div>
            <p className="ticket-text">Ticket(s)</p>
          </div>

          {/* Ticket 2 */}
          <div className="ticket">
            <div>
              <p className="ticket-title">
                Watch-only ticket <span>£{discountedPrice} / per ticket</span>
                <InfoTooltip label="About watch-only / piggyback tickets">
                  Watch-only tickets piggyback on an existing booking &mdash; you join
                  the same live stream at a discount, but you can&rsquo;t ask questions
                  or interact. Pick this if you just want to watch along.
                </InfoTooltip>
              </p>
              <span className="small-text">(no Q&A, stream only)</span>
              <Link className="ticket-link" onClick={() => setShowWatchOnlyTerms(true)}>click to see the detail</Link>
            </div>
            <div className="counter">
              <button onClick={() => setQtyDiscounted(Math.max(0, qtyDiscounted - 1))}>-</button>
              <span>{qtyDiscounted}</span>
              <button onClick={() => setQtyDiscounted(qtyDiscounted + 1)}>+</button>
            </div>
            <p className="ticket-text">Ticket(s)</p>
          </div>

          {/* Terms */}
          <div className="terms">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => { setAgreedTerms(e.target.checked); setError(""); }}
            />
            <label>
              I agree to{" "}
              <Link className="terms-link" onClick={() => setShowTerms(true)}>the Terms</Link>
              {" "}and confirm I am 18+.
            </label>
          </div>

          <div className="terms">
            <input
              type="checkbox"
              checked={agreedAllAdults}
              onChange={(e) => { setAgreedAllAdults(e.target.checked); setError(""); }}
            />
            <label>I confirm that all viewers using these tickets are 18 or older.</label>
          </div>

          {/* Total */}
          <div className="total">
            <h3>Total</h3>
            <div className="price">£{total.toFixed(2)}</div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="payment-right">
          <h2>Booking Detail</h2>

          <label>Please tell us your name*</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label>
            Please tell us your email*
            <span>(stream link will be sent through email)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {requiresGroupGender && (
            <>
              <label>
                Group make-up*
                {genderPreferenceHint && <span> ({genderPreferenceHint})</span>}
              </label>
              <select
                value={groupGenderType}
                onChange={(e) => { setGroupGenderType(e.target.value); setError(""); }}
              >
                <option value="">Select your group type...</option>
                <option value="all_female">All female</option>
                <option value="all_male">All male</option>
                <option value="mixed">Mixed group</option>
              </select>
            </>
          )}

          {bookingUnavailableReason && (
            <p className="input-error">{bookingUnavailableReason}</p>
          )}
          {error && <p className="input-error">{error}</p>}

          <div className="pay-btn">
            <img src={paypalIcon} alt="paypal" />
            <button onClick={handlePayPal} disabled={loading || !!bookingUnavailableReason}>
              {loading ? "Processing..." : "Pay with PayPal"}
            </button>
          </div>

          <div className="pay-btn">
            <img src={masterIcon} alt="card" />
            <button onClick={handleStripe} disabled={loading || !!bookingUnavailableReason}>
              {loading ? "Processing..." : "Pay with Card"}
            </button>
          </div>
        </div>

      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="modal-overlay" onClick={() => setShowTerms(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowTerms(false)} aria-label="Close">
              <img src={close} className="close-icon" />
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

      {showWatchOnlyTerms && (
        <div className="modal-overlay" onClick={() => setShowWatchOnlyTerms(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowWatchOnlyTerms(false)} aria-label="Close">
              <img src={close} className="close-icon" />
            </button>
            <h2>Watch-only Ticket Terms</h2>
            <div className="modal-content">
              {watchOnlyTermsText.split("\n\n").map((para, i) => (
                <p key={i} style={{ whiteSpace: "pre-wrap" }}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

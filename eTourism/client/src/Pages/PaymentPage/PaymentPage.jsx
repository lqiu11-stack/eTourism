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
import { AccountMenu } from "../../components/AccountMenu";

const API_BASE = import.meta.env.VITE_API_URL;

export const PaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem("token");
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
  const [souvenirQty, setSouvenirQty] = useState(0);
  const [videoAddon, setVideoAddon] = useState(false);

  const genderPreference = experience?.gender_preference || "any";
  const autoGroupGenderType = {
    female_only: "all_female",
    male_only: "all_male",
    no_all_male_groups: "mixed",
    no_all_female_groups: "mixed",
  }[genderPreference];

  useEffect(() => {
    if (!experienceId) return;
    axios.get(`${API_BASE}/visitor/experiences/${experienceId}`)
      .then(({ data }) => setExperience(data))
      .catch(() => {});
  }, [experienceId]);

  useEffect(() => {
    if (experience && !experience.allows_piggyback && qtyDiscounted !== 0) {
      setQtyDiscounted(0);
    }
  }, [experience, qtyDiscounted]);

  useEffect(() => {
    if (experience && !experience.allows_souvenir_addon && souvenirQty !== 0) {
      setSouvenirQty(0);
    }
  }, [experience, souvenirQty]);

  useEffect(() => {
    if (experience && !experience.allows_video_addon && videoAddon) {
      setVideoAddon(false);
    }
  }, [experience, videoAddon]);

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
  const souvenirPrice = experience?.souvenir_price ? parseFloat(experience.souvenir_price) : 0;
  const videoAddonPrice = experience?.video_addon_price ? parseFloat(experience.video_addon_price) : 0;
  const souvenirTotal = experience?.allows_souvenir_addon ? souvenirQty * souvenirPrice : 0;
  const videoTotal = experience?.allows_video_addon && videoAddon ? videoAddonPrice : 0;
  const showAddons = !!(experience?.allows_souvenir_addon || experience?.allows_video_addon);
  const total = qtyNormal * normalPrice + qtyDiscounted * discountedPrice + souvenirTotal + videoTotal;

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
        souvenir_qty: experience?.allows_souvenir_addon ? souvenirQty : 0,
        video_addon: experience?.allows_video_addon ? videoAddon : false,
        ...(autoGroupGenderType ? { group_gender_type: autoGroupGenderType } : {}),
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
            <Link to="/register/ehost/step1" className="nav-link">Become E-host</Link>
            <AccountMenu />
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
              {experience?.max_visitors != null && (
                <span className="small-text"> &middot; {experience.max_visitors} spot(s) available</span>
              )}
            </div>
            <div className="counter">
              <button onClick={() => setQtyNormal(Math.max(0, qtyNormal - 1))}>-</button>
              <span>{qtyNormal}</span>
              <button
                onClick={() => setQtyNormal(Math.min(experience?.max_visitors ?? Infinity, qtyNormal + 1))}
                disabled={experience?.max_visitors != null && qtyNormal >= experience.max_visitors}
              >+</button>
            </div>
            <p className="ticket-text">Ticket(s)</p>
          </div>

          {/* Ticket 2 — only if the e-host allows piggyback bookings */}
          {experience?.allows_piggyback && (
            <div className="ticket">
              <div>
                <p className="ticket-title">
                  Watch-only ticket <span>£{discountedPrice} / per ticket</span>
                  <InfoTooltip label="About watch-only / piggyback tickets">
                    Watch-only tickets piggyback on an existing booking you join
                    the same live stream at a discount, but you can&rsquo;t ask questions
                    or interact. Pick this if you just want to watch along.
                  </InfoTooltip>
                </p>
                <span className="small-text">(no Q&A, stream only)</span>
                {experience?.max_piggyback_visitors != null && (
                  <span className="small-text"> &middot; {experience.max_piggyback_visitors} spot(s) available</span>
                )}
                <Link className="ticket-link" onClick={() => setShowWatchOnlyTerms(true)}>click to see the detail</Link>
              </div>
              <div className="counter">
                <button onClick={() => setQtyDiscounted(Math.max(0, qtyDiscounted - 1))}>-</button>
                <span>{qtyDiscounted}</span>
                <button
                  onClick={() => setQtyDiscounted(Math.min(experience?.max_piggyback_visitors ?? Infinity, qtyDiscounted + 1))}
                  disabled={experience?.max_piggyback_visitors != null && qtyDiscounted >= experience.max_piggyback_visitors}
                >+</button>
              </div>
              <p className="ticket-text">Ticket(s)</p>
            </div>
          )}

          {/* Add-ons */}
          {showAddons && (
            <div className="addons-section">
              <h3 className="addons-title">Add-ons</h3>

              {experience?.allows_souvenir_addon && (
                <div className="ticket">
                  <div>
                    <p className="ticket-title">
                      Souvenir <span>£{souvenirPrice.toFixed(2)} / each</span>
                      <InfoTooltip label="About the souvenir add-on">
                        Get a physical souvenir from this experience. The eHost will
                        contact you by email after booking to arrange shipping details.
                      </InfoTooltip>
                    </p>
                    <span className="small-text">(shipped after the live experience)</span>
                  </div>
                  <div className="counter">
                    <button onClick={() => setSouvenirQty(Math.max(0, souvenirQty - 1))}>-</button>
                    <span>{souvenirQty}</span>
                    <button onClick={() => setSouvenirQty(souvenirQty + 1)}>+</button>
                  </div>
                  <p className="ticket-text">Souvenir(s)</p>
                </div>
              )}

              {experience?.allows_video_addon && (
                <div className="ticket addon-video">
                  <div>
                    <p className="ticket-title">
                      Video download <span>£{videoAddonPrice.toFixed(2)}</span>
                      <InfoTooltip label="About the video download">
                        Pay extra to download a recording of the live experience after
                        it ends. A download link will be emailed to you.
                      </InfoTooltip>
                    </p>
                    <span className="small-text">(downloadable after the live)</span>
                  </div>
                  <label className="addon-checkbox">
                    <input
                      type="checkbox"
                      checked={videoAddon}
                      onChange={(e) => setVideoAddon(e.target.checked)}
                    />
                    Add to booking
                  </label>
                </div>
              )}
            </div>
          )}

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

          {/* Price breakdown + Total */}
          <div className="total">
            <h3>Total</h3>
            {(qtyNormal > 0 || qtyDiscounted > 0 || souvenirTotal > 0 || videoTotal > 0) && (
              <ul className="price-breakdown">
                {qtyNormal > 0 && (
                  <li>
                    <span>Normal ticket × {qtyNormal}</span>
                    <span>£{(qtyNormal * normalPrice).toFixed(2)}</span>
                  </li>
                )}
                {qtyDiscounted > 0 && (
                  <li>
                    <span>Watch-only × {qtyDiscounted}</span>
                    <span>£{(qtyDiscounted * discountedPrice).toFixed(2)}</span>
                  </li>
                )}
                {souvenirTotal > 0 && (
                  <li>
                    <span>Souvenir × {souvenirQty}</span>
                    <span>£{souvenirTotal.toFixed(2)}</span>
                  </li>
                )}
                {videoTotal > 0 && (
                  <li>
                    <span>Video download</span>
                    <span>£{videoTotal.toFixed(2)}</span>
                  </li>
                )}
              </ul>
            )}
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

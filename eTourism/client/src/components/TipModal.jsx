import { useState } from "react";
import axios from "axios";
import "./TipModal.css";

const API_BASE = import.meta.env.VITE_API_URL;

const PRESETS = [3, 5, 10, 20];

export const TipModal = ({ open, onClose, ehostId, ehostName, bookingId }) => {
  const [amount, setAmount] = useState(5);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const token = localStorage.getItem("token");

  const handleStripe = async () => {
    setError("");
    setSubmitting(true);
    try {
      const { data } = await axios.post(
        `${API_BASE}/visitor/tips/stripe-session`,
        { ehost_id: ehostId, amount: Number(amount), booking_id: bookingId, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.href = data.url;
    } catch (err) {
      setError(err.response?.data?.message || "Could not start tip payment.");
      setSubmitting(false);
    }
  };

  const handlePayPal = async () => {
    setError("");
    setSubmitting(true);
    try {
      const { data } = await axios.post(
        `${API_BASE}/visitor/tips/paypal/create-order`,
        { ehost_id: ehostId, amount: Number(amount), booking_id: bookingId, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem("pending_tip_id", String(data.tip_id));
      const approval = data.links?.find((l) => l.rel === "approve");
      if (approval) {
        window.location.href = approval.href;
      } else {
        setError("PayPal did not return an approval link.");
        setSubmitting(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not start PayPal tip.");
      setSubmitting(false);
    }
  };

  return (
    <div className="tip-modal-overlay" onClick={onClose}>
      <div className="tip-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="tip-modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="tip-modal-title">Send a tip{ehostName ? ` to ${ehostName}` : ""}</h2>
        <p className="tip-modal-subtitle">A small thank-you goes a long way.</p>

        <div className="tip-modal-presets">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`tip-preset${Number(amount) === p ? " tip-preset--active" : ""}`}
              onClick={() => setAmount(p)}
            >
              £{p}
            </button>
          ))}
        </div>

        <label className="tip-modal-label">
          Amount (£)
          <input
            type="number"
            min="1"
            max="500"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="tip-modal-input"
          />
        </label>

        <label className="tip-modal-label">
          Message (optional)
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            className="tip-modal-textarea"
            placeholder="Say thanks…"
            rows={3}
          />
        </label>

        {error && <p className="tip-modal-error">{error}</p>}

        <div className="tip-modal-actions">
          <button
            type="button"
            className="tip-modal-pay tip-modal-pay--stripe"
            onClick={handleStripe}
            disabled={submitting || !amount || Number(amount) < 1}
          >
            Pay with card
          </button>
          <button
            type="button"
            className="tip-modal-pay tip-modal-pay--paypal"
            onClick={handlePayPal}
            disabled={submitting || !amount || Number(amount) < 1}
          >
            PayPal
          </button>
        </div>
      </div>
    </div>
  );
};

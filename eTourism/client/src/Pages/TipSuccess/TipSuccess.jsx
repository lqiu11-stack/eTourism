import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "./TipSuccess.css";

const API_BASE = import.meta.env.VITE_API_URL;

export const TipSuccess = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [state, setState] = useState({ status: "loading", message: "Confirming your tip…" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const sessionId = params.get("session_id");
    const paypalToken = params.get("token");
    const tipId = localStorage.getItem("pending_tip_id");

    const finish = async () => {
      try {
        if (sessionId) {
          const { data } = await axios.post(
            `${API_BASE}/visitor/tips/stripe/capture`,
            { session_id: sessionId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setState({ status: "success", tip: data.tip });
          return;
        }
        if (paypalToken && tipId) {
          const { data } = await axios.post(
            `${API_BASE}/visitor/tips/paypal/capture-order`,
            { orderID: paypalToken, tip_id: Number(tipId) },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          localStorage.removeItem("pending_tip_id");
          setState({ status: "success", tip: data.tip });
          return;
        }
        setState({ status: "error", message: "Missing tip details." });
      } catch (err) {
        setState({
          status: "error",
          message: err.response?.data?.message || "Could not confirm your tip.",
        });
      }
    };

    finish();
  }, [params]);

  return (
    <div className="tip-success-page">
      <div className="tip-success-card">
        {state.status === "loading" && <p>{state.message}</p>}
        {state.status === "success" && (
          <>
            <h1>Thank you!</h1>
            <p>Your tip of £{Number(state.tip?.amount ?? 0).toFixed(2)} was sent to your eHost.</p>
            <div className="tip-success-actions">
              <Link to="/MyBooking" className="tip-success-btn">Back to my bookings</Link>
              <button type="button" className="tip-success-btn tip-success-btn--ghost" onClick={() => navigate("/")}>
                Home
              </button>
            </div>
          </>
        )}
        {state.status === "error" && (
          <>
            <h1>Something went wrong</h1>
            <p>{state.message}</p>
            <Link to="/MyBooking" className="tip-success-btn">Back to my bookings</Link>
          </>
        )}
      </div>
    </div>
  );
};

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/apiClient";
import "./style.css";

export const VisitorBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const loadBookings = async () => {
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const res = await apiClient.get("/visitor/bookings");
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setStatus({ type: "error", message: err?.response?.data?.message || err?.response?.data?.error || "Failed to load bookings" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    navigate("/");
  };

  useEffect(() => {
    loadBookings();
  }, []);

  return (
    <div className="bk-page">
      <div className="bk-header">
        <div className="bk-title">My Bookings</div>
        <button className="bk-btn secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {status.message && (
        <div className={`bk-status ${status.type === "error" ? "error" : "success"}`}>{status.message}</div>
      )}

      <div className="bk-list">
        {bookings.map((b) => (
          <div key={b.id} className="bk-item">
            <div className="bk-main">
              <div className="bk-name">{b.title || `Booking #${b.id}`}</div>
              <div className="bk-meta">
                <span>Status: {b.status || "unknown"}</span>
                {b.date_time && <span>Time: {new Date(b.date_time).toLocaleString()}</span>}
              </div>
            </div>
            <button className="bk-btn primary" onClick={() => navigate(`/visitor/bookings/${b.id}`)} disabled={loading}>
              View
            </button>
          </div>
        ))}

        {!loading && bookings.length === 0 && <div className="bk-empty">No bookings.</div>}
      </div>
    </div>
  );
};


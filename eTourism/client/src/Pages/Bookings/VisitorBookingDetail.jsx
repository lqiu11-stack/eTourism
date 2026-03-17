import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../api/apiClient";
import "./style.css";

export const VisitorBookingDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [meetingStatus, setMeetingStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const loadBooking = useCallback(async () => {
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const res = await apiClient.get(`/visitor/bookings/${id}`);
      setBooking(res.data || null);
    } catch (err) {
      setStatus({ type: "error", message: err?.response?.data?.message || err?.response?.data?.error || "Failed to load booking details" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadMeetingLink = useCallback(async () => {
    setMeetingStatus({ type: "", message: "" });
    try {
      const res = await apiClient.get(`/visitor/bookings/${id}/meeting-link`);
      setMeeting(res.data || null);
    } catch (err) {
      const code = err?.response?.status;
      if (code === 403) {
        setMeetingStatus({ type: "info", message: err?.response?.data?.message || "The meeting link is available after a successful booking" });
        return;
      }
      if (code === 404) {
        setMeetingStatus({ type: "info", message: err?.response?.data?.message || "The eHost has not configured the meeting link yet" });
        return;
      }
      setMeetingStatus({ type: "error", message: err?.response?.data?.message || err?.response?.data?.error || "Failed to load meeting link" });
    }
  }, [id]);

  useEffect(() => {
    loadBooking();
    loadMeetingLink();
  }, [loadBooking, loadMeetingLink]);

  return (
    <div className="bk-page">
      <div className="bk-header">
        <div className="bk-title">Booking Detail</div>
        <button className="bk-btn secondary" onClick={() => navigate("/visitor/bookings")}>
          Back
        </button>
      </div>

      {status.message && (
        <div className={`bk-status ${status.type === "error" ? "error" : "success"}`}>{status.message}</div>
      )}

      {booking && (
        <div className="bk-card">
          <div className="bk-row">
            <span className="bk-k">Booking ID</span>
            <span className="bk-v">{booking.id}</span>
          </div>
          <div className="bk-row">
            <span className="bk-k">Status</span>
            <span className="bk-v">{booking.status || "unknown"}</span>
          </div>
          <div className="bk-row">
            <span className="bk-k">Amount</span>
            <span className="bk-v">{booking.amount_paid}</span>
          </div>
          <div className="bk-row">
            <span className="bk-k">Experience ID</span>
            <span className="bk-v">{booking.experience_id}</span>
          </div>
        </div>
      )}

      <div className="bk-card">
        <div className="bk-subtitle">Meeting Link</div>

        {meeting && (
          <>
            <div className="bk-row">
              <span className="bk-k">Platform</span>
              <span className="bk-v">{meeting.platform}</span>
            </div>
            <div className="bk-row">
              <span className="bk-k">URL</span>
              <span className="bk-v">
                <a href={meeting.meeting_url} target="_blank" rel="noreferrer">
                  {meeting.meeting_url}
                </a>
              </span>
            </div>
            <div className="bk-row">
              <span className="bk-k">Password</span>
              <span className="bk-v">{meeting.meeting_password || "-"}</span>
            </div>
          </>
        )}

        {meetingStatus.message && (
          <div className={`bk-note ${meetingStatus.type === "error" ? "error" : "info"}`}>{meetingStatus.message}</div>
        )}

        <div className="bk-actions">
          <button className="bk-btn secondary" onClick={loadMeetingLink} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};


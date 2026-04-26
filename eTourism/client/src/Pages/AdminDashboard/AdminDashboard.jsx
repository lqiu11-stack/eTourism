import { useState, useEffect, useCallback } from "react";
import "./AdminDashboard.css";
import profileImg from "../icon/head.png";
import { Link, useNavigate } from "react-router-dom";
import search from "../icon/search.png";
import axios from "axios"; 
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler,
  Title, Tooltip, Legend, ArcElement
);

const API_BASE = import.meta.env.VITE_API_URL;

export const Dashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isLoggedIn = !!token;

  const [activeTab, setActiveTab] = useState("booking");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showRefundPanel, setShowRefundPanel] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [action, setAction] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");

  const fetchBookings = useCallback(async (search = "") => {
    setBookingLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('booking_id', search.trim());
      const { data } = await axios.get(`${API_BASE}/admin/bookings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    } finally {
      setBookingLoading(false);
    }
  }, [token]);

  const handleRefund = (item) => {
    setSelectedBooking(item);
    setShowRefundPanel(true);
    setAction("");
    setRejectReason("");
  };

  const handleRefundAction = async () => {
    if (!action) { alert("Please select Approve or Reject."); return; }
    if (action === "reject" && !rejectReason.trim()) { alert("Please enter a reason for rejection."); return; }
    const refundId = selectedBooking.refund_id;
    if (!refundId) { alert("No refund record found for this booking."); return; }
    try {
      if (action === "approve") {
        await axios.patch(
          `${API_BASE}/admin/refunds/${refundId}/approve`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Refund approved and payment processed.");
      } else {
        await axios.patch(
          `${API_BASE}/admin/refunds/${refundId}/reject`,
          { reason: rejectReason },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Refund rejected. Booking restored to confirmed.");
      }
      setShowRefundPanel(false);
      fetchBookings();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to process refund.");
    }
  };

  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearch, setUserSearch] = useState("");

  const fetchUsers = useCallback(async () => {
    setUserLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setUserLoading(false);
    }
  }, [token]);

  const handleUpdateUserStatus = async (id, status) => {
    try {
      await axios.patch(
        `${API_BASE}/admin/users/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update status.");
    }
  };

  const handleUpdateUserRole = async (id, role) => {
    try {
      await axios.patch(
        `${API_BASE}/admin/users/${id}/role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
      setShowUserModal(false);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update role.");
    }
  };

  const [confirmModal, setConfirmModal] = useState({ open: false, title: "", message: "", onConfirm: null });

  const closeConfirmModal = () => setConfirmModal({ open: false, title: "", message: "", onConfirm: null });

  const handleDeleteUser = (id) => {
    setConfirmModal({
      open: true,
      title: "Delete user?",
      message: "Delete this user? This cannot be undone.",
      onConfirm: async () => {
        closeConfirmModal();
        try {
          await axios.delete(`${API_BASE}/admin/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchUsers();
          setShowUserModal(false);
        } catch (e) {
          alert(e.response?.data?.message || "Failed to delete user.");
        }
      },
    });
  };

  const [experiences, setExperiences] = useState([]);
  const [expLoading, setExpLoading] = useState(false);
  const [expStatusFilter, setExpStatusFilter] = useState("pending");
  const [expSearch, setExpSearch] = useState("");

  const fetchExperiences = useCallback(async (status, search = "") => {
    setExpLoading(true);
    try {
      const params = new URLSearchParams({ status });
      if (search.trim()) params.set('search', search.trim());
      const { data } = await axios.get(
        `${API_BASE}/admin/experiences?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExperiences(Array.isArray(data) ? data : []);
    } catch {
      setExperiences([]);
    } finally {
      setExpLoading(false);
    }
  }, [token]);

  const handleApproveExperience = async (id) => {
    try {
      await axios.patch(
        `${API_BASE}/admin/experiences/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchExperiences(expStatusFilter);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to approve.");
    }
  };

  const handleRejectExperience = async (id) => {
    try {
      await axios.patch(
        `${API_BASE}/admin/experiences/${id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchExperiences(expStatusFilter);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to reject.");
    }
  };

  const handleDeleteExperience = (id) => {
    setConfirmModal({
      open: true,
      title: "Delete experience?",
      message: "This cannot be undone.",
      onConfirm: async () => {
        closeConfirmModal();
        try {
          await axios.delete(`${API_BASE}/admin/experiences/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchExperiences(expStatusFilter);
        } catch (e) {
          alert(e.response?.data?.message || "Failed to delete.");
        }
      },
    });
  };

  const [applications, setApplications] = useState([]);
  const [appLoading, setAppLoading] = useState(false);
  const [appStatusFilter, setAppStatusFilter] = useState("pending");
  const [appSearch, setAppSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [showAppModal, setShowAppModal] = useState(false);

  const fetchApplications = useCallback(async (status, search = "") => {
    setAppLoading(true);
    try {
      const params = new URLSearchParams({ status });
      if (search.trim()) params.set('search', search.trim());
      const { data } = await axios.get(
        `${API_BASE}/admin/applications?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApplications(Array.isArray(data) ? data : []);
    } catch {
      setApplications([]);
    } finally {
      setAppLoading(false);
    }
  }, [token]);

  const handleApproveApplication = async (id) => {
    try {
      await axios.patch(
        `${API_BASE}/admin/applications/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Application approved. The ehost can now log in with the password they set during registration.");
      fetchApplications(appStatusFilter);
      setShowAppModal(false);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to approve.");
    }
  };

  const handleRejectApplication = async (id) => {
    if (!window.confirm("Reject this application?")) return;
    try {
      await axios.patch(
        `${API_BASE}/admin/applications/${id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchApplications(appStatusFilter);
      setShowAppModal(false);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to reject.");
    }
  };

  // ── Network issues ───────────────────────────────────────────────────
  const [networkSummary, setNetworkSummary] = useState(null);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [networkWindow, setNetworkWindow] = useState(168);

  const fetchNetworkSummary = useCallback(async () => {
    setNetworkLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE}/network-logs/admin/summary?hours=${networkWindow}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNetworkSummary(data);
    } catch {
      setNetworkSummary(null);
    } finally {
      setNetworkLoading(false);
    }
  }, [token, networkWindow]);

  useEffect(() => {
    if (activeTab === "booking") fetchBookings();
    if (activeTab === "user") fetchUsers();
    if (activeTab === "request") fetchExperiences(expStatusFilter);
    if (activeTab === "EhostJoin") fetchApplications(appStatusFilter);
    if (activeTab === "reports") fetchAnalytics();
    if (activeTab === "suitability") fetchSuitExps(suitStatusFilter);
    if (activeTab === "network") fetchNetworkSummary();
  }, [activeTab, networkWindow]);

  // ── Analytics / Reports ──────────────────────────────────────────────
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [token]);

  // ── Suitability Review ───────────────────────────────────────────────
  const [suitExps, setSuitExps] = useState([]);
  const [suitLoading, setSuitLoading] = useState(false);
  const [suitStatusFilter, setSuitStatusFilter] = useState("approved");
  const [showSuitPanel, setShowSuitPanel] = useState(false);
  const [selectedSuitExp, setSelectedSuitExp] = useState(null);
  const [suitScores, setSuitScores] = useState([]);
  const [suitScoresLoading, setSuitScoresLoading] = useState(false);
  const [suitResult, setSuitResult] = useState("pass");
  const [suitComment, setSuitComment] = useState("");
  const [suitSubmitting, setSuitSubmitting] = useState(false);

  const fetchSuitExps = useCallback(async (status) => {
    setSuitLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE}/admin/experiences?status=${status}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuitExps(Array.isArray(data) ? data : []);
    } catch {
      setSuitExps([]);
    } finally {
      setSuitLoading(false);
    }
  }, [token]);

  const fetchSuitScores = useCallback(async (id) => {
    setSuitScoresLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE}/admin/experiences/${id}/scores`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuitScores(Array.isArray(data) ? data : []);
    } catch {
      setSuitScores([]);
    } finally {
      setSuitScoresLoading(false);
    }
  }, [token]);

  const handleOpenSuitPanel = (exp) => {
    setSelectedSuitExp(exp);
    setSuitResult("pass");
    setSuitComment("");
    setShowSuitPanel(true);
    fetchSuitScores(exp.id);
  };

  const handleScoreExperience = async () => {
    if (suitResult === "fail" && !suitComment.trim()) {
      alert("Please enter a reason when marking as unsuitable.");
      return;
    }
    setSuitSubmitting(true);
    try {
      await axios.post(
        `${API_BASE}/admin/experiences/${selectedSuitExp.id}/score`,
        { result: suitResult, comment: suitComment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Experience marked as ${suitResult === "pass" ? "suitable" : "unsuitable"}.`);
      setShowSuitPanel(false);
      fetchSuitExps(suitStatusFilter);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to submit review.");
    } finally {
      setSuitSubmitting(false);
    }
  };

  return (
    <div className="admin-container">

      {/* ===== Top Navbar ===== */}
      <nav className="admin-navbar">
        <div className="admin-nav-links">
          <a>Admin dashboard</a>
        </div>
        <div className="admin-nav-links">
          {isLoggedIn ? (
            <button className="admin-nav-link admin-nav-btn-link" onClick={handleLogout}>Logout</button>
          ) : (
            <Link to="/login" className="admin-nav-link">Login</Link>
          )}
        </div>
      </nav>

      {/* ===== Profile Section ===== */}
      <div className="profile-section">
        <img src={profileImg} alt="profile" className="profile-img" />
        <h2>{user.first_name || "Admin"}</h2>
        {/* <button className="profile-btn">Profile and setting</button> */}
      </div>

      {/* ===== Tabs ===== */}
      <div className="tabs">
        {[
          { key: "booking", label: "Manage booking" },
          { key: "user", label: "User data" },
          { key: "reports", label: "Reports" },
          { key: "suitability", label: "Suitability review" },
          { key: "request", label: "Experiences" },
          { key: "EhostJoin", label: "E-hosts" },
          { key: "network", label: "Network issues" },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={activeTab === key ? "tab active" : "tab"}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ===== Content ===== */}
      <div className="content-box">
        {activeTab === "booking" && (
          <Booking
            bookings={bookings}
            loading={bookingLoading}
            showRefundPanel={showRefundPanel}
            selectedBooking={selectedBooking}
            action={action}
            rejectReason={rejectReason}
            setShowRefundPanel={setShowRefundPanel}
            setAction={setAction}
            setRejectReason={setRejectReason}
            handleRefund={handleRefund}
            handleRefundAction={handleRefundAction}
            bookingSearch={bookingSearch}
            setBookingSearch={setBookingSearch}
            onSearch={() => fetchBookings(bookingSearch)}
          />
        )}
        {activeTab === "user" && (
          <UserData
            users={users}
            loading={userLoading}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            showUserModal={showUserModal}
            setShowUserModal={setShowUserModal}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            onUpdateRole={handleUpdateUserRole}
            onUpdateStatus={handleUpdateUserStatus}
            onDelete={handleDeleteUser}
          />
        )}
        {activeTab === "message" && <MessageBox />}
        {activeTab === "request" && (
          <ExperienceRequests
            experiences={experiences}
            loading={expLoading}
            statusFilter={expStatusFilter}
            setStatusFilter={(s) => { setExpStatusFilter(s); setExpSearch(""); fetchExperiences(s, ""); }}
            onApprove={handleApproveExperience}
            onReject={handleRejectExperience}
            onDelete={handleDeleteExperience}
            expSearch={expSearch}
            setExpSearch={setExpSearch}
            onSearch={() => fetchExperiences(expStatusFilter, expSearch)}
          />
        )}
        {activeTab === "EhostJoin" && (
          <EhostApplications
            applications={applications}
            loading={appLoading}
            statusFilter={appStatusFilter}
            setStatusFilter={(s) => { setAppStatusFilter(s); setAppSearch(""); fetchApplications(s, ""); }}
            selectedApp={selectedApp}
            setSelectedApp={setSelectedApp}
            showAppModal={showAppModal}
            setShowAppModal={setShowAppModal}
            onApprove={handleApproveApplication}
            onReject={handleRejectApplication}
            appSearch={appSearch}
            setAppSearch={setAppSearch}
            onSearch={() => fetchApplications(appStatusFilter, appSearch)}
          />
        )}
        {activeTab === "reports" && (
          <Reports analytics={analytics} loading={analyticsLoading} />
        )}
        {activeTab === "suitability" && (
          <SuitabilityReview
            experiences={suitExps}
            loading={suitLoading}
            statusFilter={suitStatusFilter}
            setStatusFilter={(s) => { setSuitStatusFilter(s); fetchSuitExps(s); }}
            showPanel={showSuitPanel}
            setShowPanel={setShowSuitPanel}
            selectedExp={selectedSuitExp}
            scores={suitScores}
            scoresLoading={suitScoresLoading}
            result={suitResult}
            setResult={setSuitResult}
            comment={suitComment}
            setComment={setSuitComment}
            submitting={suitSubmitting}
            onOpenPanel={handleOpenSuitPanel}
            onSubmitScore={handleScoreExperience}
            onApprove={handleApproveExperience}
            onReject={handleRejectExperience}
            onAfterAction={() => { setShowSuitPanel(false); fetchSuitExps(suitStatusFilter); }}
          />
        )}
        {activeTab === "network" && (
          <NetworkIssues
            summary={networkSummary}
            loading={networkLoading}
            windowHours={networkWindow}
            onWindowChange={setNetworkWindow}
          />
        )}
      </div>

      {confirmModal.open && (
        <div className="refund-overlay" role="dialog" aria-modal="true">
          <div className="refund-panel" style={{ width: "min(440px, 90vw)", padding: 24, flexDirection: "column", gap: 16 }}>
            <h3 style={{ margin: 0 }}>{confirmModal.title}</h3>
            <p style={{ margin: 0 }}>{confirmModal.message}</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="sort-btn" onClick={closeConfirmModal}>Cancel</button>
              <button type="button" className="sort-btn" style={{ background: "#e57373", color: "white" }} onClick={() => confirmModal.onConfirm && confirmModal.onConfirm()}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const STATUS_COLORS = {
  pending:        { background: "#f4d58d", color: "#5a4012" },
  confirmed:      { background: "#a8d5b3", color: "#1f4d2c" },
  refund_pending: { background: "#f5b97a", color: "#5a3210" },
  refunded:       { background: "#d3d3d3", color: "#444" },
  cancelled:      { background: "#e0a3a3", color: "#5a1a1a" },
  rescheduled:    { background: "#a3c4e0", color: "#1a3c5a" },
};

const getStatusStyle = (status) =>
  STATUS_COLORS[status] || { background: "#eee", color: "#333" };

const Booking = ({
  bookings, loading,
  showRefundPanel, selectedBooking, action, rejectReason,
  setShowRefundPanel, setAction, setRejectReason, handleRefund, handleRefundAction,
  bookingSearch, setBookingSearch, onSearch,
}) => (
  <div>
    <div className="booking-top">
      <div className="search-wrapper">
        <input
          className="admin-search-bar"
          placeholder="Search by booking code"
          value={bookingSearch}
          onChange={(e) => setBookingSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        />
        <button className="admin-search-btn" onClick={onSearch}><img src={search} className="admin-search-icon" /></button>
      </div>
    </div>
    <div className="table-box">
      <div className="table-header" style={{ gridTemplateColumns: "0.5fr 1fr 1.2fr 1.5fr 1.5fr 1fr 1fr 1fr 0.8fr" }}>
        <span>ID</span>
        <span>Contact name</span>
        <span>Visitor name</span>
        <span>Visitor email</span>
        <span>Experience</span>
        <span>Event date</span>
        <span>Payment</span>
        <span>Status</span>
        <span>Amount</span>
      </div>
      {loading && <p style={{ padding: "12px" }}>Loading...</p>}
      {!loading && bookings.length === 0 && <p style={{ padding: "12px" }}>No bookings found.</p>}
      {bookings.map((item) => (
        <div className="table-row" key={item.id} style={{ gridTemplateColumns: "0.5fr 1fr 1.2fr 1.5fr 1.5fr 1fr 1fr 1fr 0.8fr" }}>
          <div>#{item.id}</div>
          <div>{item.contact_name || "—"}</div>
          <div>{item.visitor_first_name} {item.visitor_last_name}</div>
          <div style={{ fontSize: "13px" }}>{item.visitor_email || "—"}</div>
          <div>{item.experience_title || "—"}</div>
          <div style={{ fontSize: "13px" }}>
            {item.experience_date_time ? new Date(item.experience_date_time).toLocaleDateString() : "TBC"}
          </div>
          <div style={{ fontSize: "13px" }}>{item.payment_method || "—"}</div>
          <div>
            {item.status === "refund_pending" ? (
              <button
                className="sort-btn"
                style={{ ...getStatusStyle(item.status), padding: "4px 10px", fontSize: "12px" }}
                onClick={() => handleRefund(item)}
              >
                refund pending
              </button>
            ) : (
              <button
                className="sort-btn"
                style={{ ...getStatusStyle(item.status), padding: "4px 10px", fontSize: "12px" }}
                disabled
              >
                {item.status}
              </button>
            )}
          </div>
          <div>£{Number(item.amount_paid || 0).toFixed(2)}</div>
        </div>
      ))}
    </div>

    {showRefundPanel && selectedBooking && (
      <div className="refund-overlay">
        <div className="refund-panel">
          <button className="close-btn" onClick={() => setShowRefundPanel(false)}>✕</button>
          <div className="refund-left">
            <h3>Booking #{selectedBooking.id}</h3>
            <p><strong>Experience:</strong> {selectedBooking.experience_title || "—"}</p>
            <p><strong>Visitor:</strong> {selectedBooking.visitor_first_name} {selectedBooking.visitor_last_name}</p>
            <p><strong>Email:</strong> {selectedBooking.visitor_email || selectedBooking.contact_email}</p>
            <p><strong>Amount paid:</strong> £{Number(selectedBooking.amount_paid || 0).toFixed(2)}</p>
            <p><strong>Payment method:</strong> {selectedBooking.payment_method || "—"}</p>
            <p><strong>Refund amount:</strong> £{Number(selectedBooking.refund_amount || 0).toFixed(2)}</p>
            {selectedBooking.refund_reason && (
              <p><strong>Visitor reason:</strong> {selectedBooking.refund_reason}</p>
            )}
          </div>
          <div className="refund-right">
            <button className={`action-btn ${action === "approve" ? "active" : ""}`} onClick={() => setAction("approve")}>
              Approve refund
            </button>
            <button className={`action-btn ${action === "reject" ? "active" : ""}`} onClick={() => setAction("reject")}>
              Reject refund
            </button>
            <textarea
              placeholder="Type reject reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              disabled={action !== "reject"}
            />
            <button className="save-btn" onClick={handleRefundAction}>
              Save
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
const UserData = ({
  users, loading, userSearch, setUserSearch,
  showUserModal, setShowUserModal, selectedUser, setSelectedUser,
  onUpdateRole, onUpdateStatus, onDelete,
}) => {
  const filtered = users.filter((u) =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div>
      <div className="booking-top">
        <div className="search-wrapper">
          <input
            className="admin-search-bar"
            placeholder="Search by name or email"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
          <button className="admin-search-btn"><img src={search} className="admin-search-icon" /></button>
        </div>
      </div>

      <div className="table-box">
        <div className="table-header" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", fontWeight: "bold", borderBottom: "1px solid black", paddingBottom: "10px" }}>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {loading && <p style={{ padding: "12px" }}>Loading...</p>}
        {!loading && filtered.length === 0 && <p style={{ padding: "12px" }}>No users found.</p>}
        {filtered.map((item) => (
          <div className="table-row" key={item.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #eee" }}>
            <div>{item.email}</div>
            <div>{item.role}</div>
            <div>
              <span style={{ color: item.status === "suspended" ? "red" : "green" }}>{item.status}</span>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button className="sort-btn" onClick={() => { setSelectedUser({ ...item }); setShowUserModal(true); }}>
                Edit
              </button>
              <button
                className="sort-btn"
                onClick={() => onUpdateStatus(item.id, item.status === "active" ? "suspended" : "active")}
              >
                {item.status === "active" ? "Suspend" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showUserModal && selectedUser && (
        <div className="refund-overlay">
          <div className="refund-panel">
            <button className="close-btn" onClick={() => setShowUserModal(false)}>✕</button>
            <div className="refund-left">
              <h3>Edit User</h3>
              <p>Email: <strong>{selectedUser.email}</strong></p>
              <p>Name: {selectedUser.first_name} {selectedUser.last_name}</p>
              <p>DOB: {selectedUser.date_of_birth}</p>
              <p>Country: {selectedUser.country}</p>
              <p>Status: {selectedUser.status}</p>
            </div>
            <div className="refund-right">
              <p>Change role:</p>
              <select
                className="userdata-typein"
                value={selectedUser.role}
                onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
              >
                <option value="visitor">visitor</option>
                <option value="ehost">ehost</option>
                <option value="admin">admin</option>
              </select>
              <button className="save-btn" onClick={() => onUpdateRole(selectedUser.id, selectedUser.role)}>
                Save role
              </button>
              <button
                className="action-btn"
                style={{ marginTop: "10px", background: "#e57373", color: "white" }}
                onClick={() => onDelete(selectedUser.id)}
              >
                Delete user
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ExperienceRequests = ({ experiences, loading, statusFilter, setStatusFilter, onApprove, onReject, onDelete, expSearch, setExpSearch, onSearch }) => (
  <div>
    <div className="booking-top">
      <div className="search-wrapper">
        <input
          className="admin-search-bar"
          placeholder="Search by experience title"
          value={expSearch}
          onChange={(e) => setExpSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        />
        <button className="admin-search-btn" onClick={onSearch}><img src={search} className="admin-search-icon" /></button>
      </div>
      {["pending", "approved", "rejected"].map((s) => (
        <button key={s} className="sort-btn" style={statusFilter === s ? { background: "#a88b8b", color: "white" } : {}} onClick={() => setStatusFilter(s)}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </button>
      ))}
    </div>

    <div className="table-box">
      <div className="table-header" style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 2fr", fontWeight: "bold", borderBottom: "1px solid black", paddingBottom: "10px" }}>
        <span>ID</span>
        <span>Title</span>
        <span>Status</span>
        <span>Actions</span>
      </div>
      {loading && <p style={{ padding: "12px" }}>Loading...</p>}
      {!loading && experiences.length === 0 && <p style={{ padding: "12px" }}>No experiences found.</p>}
      {experiences.map((item) => (
        <div className="table-row" key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 2fr", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #eee" }}>
          <div>#{item.id}</div>
          <div>{item.title}</div>
          <div>
            <span style={{ color: item.status === "approved" ? "green" : item.status === "rejected" ? "red" : "#b8860b" }}>
              {item.status}
            </span>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {item.status === "pending" && (
              <>
                <button className="sort-btn" onClick={() => onApprove(item.id)}>Approve</button>
                <button className="sort-btn" onClick={() => onReject(item.id)}>Reject</button>
              </>
            )}
            <button type="button" className="sort-btn" style={{ background: "#e57373", color: "white" }} onClick={() => onDelete(item.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CHART_COLORS = [
  "#a88b8b", "#7b9eb8", "#8bb897", "#c4a05a", "#9b7bb8",
  "#b87b7b", "#5a8cb8", "#7bb87b", "#b8a05a", "#7b7bb8",
];

const barOptions = () => ({
  indexAxis: "y",
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: { display: false },
    tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.x} booking${ctx.parsed.x !== 1 ? "s" : ""}` } },
  },
  scales: {
    x: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, grid: { color: "#f0e8e8" } },
    y: {
      grid: { display: false },
      ticks: {
        font: { size: 12 },
        autoSkip: false,
        callback: function (value) {
          const label = this.getLabelForValue(value);
          const max = window.innerWidth < 640 ? 14 : window.innerWidth < 900 ? 20 : 28;
          return label.length > max ? label.slice(0, max - 1) + "…" : label;
        },
      },
    },
  },
});

const Reports = ({ analytics, loading }) => {
  if (loading) return <p style={{ padding: "16px" }}>Loading reports...</p>;
  if (!analytics) return <p style={{ padding: "16px" }}>No data available.</p>;

  const expChartData = {
    labels: analytics.topExperiences.map((e) =>
      e.title.length > 28 ? e.title.slice(0, 26) + "…" : e.title
    ),
    datasets: [{
      data: analytics.topExperiences.map((e) => Number(e.booking_count)),
      backgroundColor: "#a88b8b",
      borderColor: "#8b6b6b",
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const hostChartData = {
    labels: analytics.topHosts.map((h) => h.name),
    datasets: [{
      data: analytics.topHosts.map((h) => Number(h.booking_count)),
      backgroundColor: "#7b9eb8",
      borderColor: "#5a7e9b",
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const revenueChartData = {
    labels: analytics.revenueByCategory.map((c) => c.category || "Uncategorised"),
    datasets: [{
      data: analytics.revenueByCategory.map((c) => Number(c.revenue)),
      backgroundColor: "#8bb897",
      borderColor: "#6a9a78",
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const revenueBarOptions = {
    ...barOptions(),
    plugins: {
      ...barOptions().plugins,
      tooltip: { callbacks: { label: (ctx) => ` £${Number(ctx.parsed.x).toFixed(2)}` } },
    },
  };

  const categoryChartData = {
    labels: analytics.categoryBreakdown.map((c) => c.category || "Uncategorised"),
    datasets: [{
      data: analytics.categoryBreakdown.map((c) => Number(c.booking_count)),
      backgroundColor: CHART_COLORS.slice(0, analytics.categoryBreakdown.length),
      borderWidth: 1,
      borderColor: "#fff",
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right", labels: { font: { size: 12 }, padding: 12 } },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed} booking${ctx.parsed !== 1 ? "s" : ""}` } },
    },
  };

  const CHART_HEIGHT = 300;
  const expBarHeight = Math.max(CHART_HEIGHT, analytics.topExperiences.length * 36);
  const hostBarHeight = Math.max(CHART_HEIGHT, analytics.topHosts.length * 36);
  const revenueBarHeight = Math.max(CHART_HEIGHT, analytics.revenueByCategory.length * 36);

  return (
    <div className="reports-wrapper">
      <div className="report-charts-row">
        <div className="report-section report-section-wide">
          <h3 className="report-heading">Most Popular Experiences</h3>
          {analytics.topExperiences.length === 0 ? (
            <p className="report-empty">No bookings recorded yet.</p>
          ) : (
            <div style={{ height: expBarHeight }}>
              <Bar data={expChartData} options={barOptions()} />
            </div>
          )}
        </div>

        <div className="report-section report-section-wide">
          <h3 className="report-heading">Most Popular eHosts</h3>
          {analytics.topHosts.length === 0 ? (
            <p className="report-empty">No bookings recorded yet.</p>
          ) : ( <div style={{ height: hostBarHeight }}>
              <Bar data={hostChartData} options={barOptions()} />
            </div>
          )}
        </div>
      </div>

      <div className="report-charts-row">
        <div className="report-section report-section-wide">
          <h3 className="report-heading">Revenue by Category</h3>
          {analytics.revenueByCategory.length === 0 ? (
            <p className="report-empty">No revenue recorded yet.</p>
          ) : (
            <div style={{ height: revenueBarHeight }}>
              <Bar data={revenueChartData} options={revenueBarOptions} />
            </div>
          )}
        </div>

        <div className="report-section report-section-narrow">
          <h3 className="report-heading">Bookings by Category</h3>
          {analytics.categoryBreakdown.length === 0 ? (
            <p className="report-empty">No category data yet.</p>
          ) : (
            <div style={{ height: CHART_HEIGHT }}>
              <Doughnut data={categoryChartData} options={doughnutOptions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SuitabilityReview = ({
  experiences, loading, statusFilter, setStatusFilter,
  showPanel, setShowPanel, selectedExp, scores, scoresLoading,
  result, setResult, comment, setComment, submitting,
  onOpenPanel, onSubmitScore, onApprove, onReject, onAfterAction,
}) => (
  <div>
    <div className="booking-top">
      {["approved", "pending", "rejected"].map((s) => (
        <button
          key={s}
          className="sort-btn"
          style={statusFilter === s ? { background: "#a88b8b", color: "white" } : {}}
          onClick={() => setStatusFilter(s)}
        >
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </button>
      ))}
    </div>

    <div className="table-box">
      <div className="suit-table-header">
        <span>ID</span><span>Title</span><span>Host</span><span>Category</span><span>Country</span><span>Status</span><span>Action</span>
      </div>
      {loading && <p style={{ padding: "12px" }}>Loading...</p>}
      {!loading && experiences.length === 0 && <p style={{ padding: "12px" }}>No experiences found.</p>}
      {experiences.map((item) => (
        <div className="suit-table-row" key={item.id}>
          <span>#{item.id}</span>
          <span>{item.title}</span>
          <span>{item.ehost_first_name ? `${item.ehost_first_name} ${item.ehost_last_name}` : "—"}</span>
          <span>{item.category || "—"}</span>
          <span>{item.country || "—"}</span>
          <span>
            <span style={{ color: item.status === "approved" ? "green" : item.status === "rejected" ? "red" : "#b8860b" }}>
              {item.status}
            </span>
          </span>
          <span>
            <button className="sort-btn" onClick={() => onOpenPanel(item)}>Review</button>
          </span>
        </div>
      ))}
    </div>

    {showPanel && selectedExp && (
      <div className="refund-overlay">
        <div className="suit-panel">
          <button className="close-btn" onClick={() => setShowPanel(false)}>✕</button>

          <div className="suit-panel-left">
            <h3>{selectedExp.title}</h3>
            <p><strong>Category:</strong> {selectedExp.category || "—"}</p>
            <p><strong>Country:</strong> {selectedExp.country || "—"}</p>
            <p><strong>Language:</strong> {selectedExp.language || "—"}</p>
            <p><strong>Status:</strong> {selectedExp.status}</p>
            {selectedExp.description && (
              <p style={{ marginTop: "8px", fontSize: "13px" }}>{selectedExp.description}</p>
            )}
            <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
              {selectedExp.status !== "approved" && (
                <button className="save-btn" onClick={() => onApprove(selectedExp.id).then(onAfterAction)}>Approve</button>
              )}
              {selectedExp.status !== "rejected" && (
                <button className="action-btn" onClick={() => onReject(selectedExp.id).then(onAfterAction)}>Reject</button>
              )}
            </div>
          </div>

          <div className="suit-panel-right">
            <h4>Suitability Review</h4>
            <div className="suit-radio-group">
              <label className={`suit-radio ${result === "pass" ? "suit-radio-selected" : ""}`}>
                <input type="radio" value="pass" checked={result === "pass"} onChange={() => setResult("pass")} />
                Suitable
              </label>
              <label className={`suit-radio ${result === "fail" ? "suit-radio-selected" : ""}`}>
                <input type="radio" value="fail" checked={result === "fail"} onChange={() => setResult("fail")} />
                Unsuitable
              </label>
            </div>
            <textarea
              className="suit-textarea"
              placeholder={result === "fail" ? "Reason for rejection (required)" : "Notes (optional)"}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button className="save-btn" onClick={onSubmitScore} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit review"}
            </button>

            <div className="suit-history">
              <h5>Review History</h5>
              {scoresLoading && <p style={{ fontSize: "12px" }}>Loading...</p>}
              {!scoresLoading && scores.length === 0 && <p style={{ fontSize: "12px", color: "#999" }}>No previous reviews.</p>}
              {scores.map((s) => (
                <div key={s.id} className="suit-history-item">
                  <span className={`result-badge ${s.result}`}>{s.result === "pass" ? "Suitable" : "Unsuitable"}</span>
                  <span className="suit-history-date">{new Date(s.scored_at).toLocaleDateString()}</span>
                  {s.comment && <p className="suit-history-comment">{s.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

const EhostApplications = ({
  applications, loading, statusFilter, setStatusFilter,
  selectedApp, setSelectedApp, showAppModal, setShowAppModal,
  onApprove, onReject, appSearch, setAppSearch, onSearch,
}) => (
  <div>
    <div className="booking-top">
      <div className="search-wrapper">
        <input
          className="admin-search-bar"
          placeholder="Search by name or email"
          value={appSearch}
          onChange={(e) => setAppSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        />
        <button className="admin-search-btn" onClick={onSearch}><img src={search} className="admin-search-icon" /></button>
      </div>
      {["pending", "approved", "rejected"].map((s) => (
        <button key={s} className="sort-btn" style={statusFilter === s ? { background: "#a88b8b", color: "white" } : {}} onClick={() => setStatusFilter(s)}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </button>
      ))}
    </div>

    <div className="table-box">
      <div className="table-header" style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr 1fr 2fr", fontWeight: "bold", borderBottom: "1px solid black", paddingBottom: "10px" }}>
        <span>ID</span>
        <span>Name</span>
        <span>Email</span>
        <span>Status</span>
        <span>Actions</span>
      </div>
      {loading && <p style={{ padding: "12px" }}>Loading...</p>}
      {!loading && applications.length === 0 && <p style={{ padding: "12px" }}>No applications found.</p>}
      {applications.map((item) => (
        <div className="table-row" key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr 1fr 2fr", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #eee" }}>
          <div>#{item.id}</div>
          <div>{item.name}</div>
          <div>{item.email}</div>
          <div>
            <span style={{ color: item.status === "approved" ? "green" : item.status === "rejected" ? "red" : "#b8860b" }}>
              {item.status}
            </span>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button className="sort-btn" onClick={() => { setSelectedApp(item); setShowAppModal(true); }}>
              View
            </button>
          </div>
        </div>
      ))}
    </div>

    {showAppModal && selectedApp && (
      <div className="refund-overlay">
        <div className="refund-panel">
          <button className="close-btn" onClick={() => setShowAppModal(false)}>✕</button>
          <div className="refund-left">
            <h3>Application #{selectedApp.id}</h3>
            <p><strong>Name:</strong> {selectedApp.name}</p>
            <p><strong>Email:</strong> {selectedApp.email}</p>
            <p><strong>Country:</strong> {selectedApp.country}</p>
            <p><strong>Has experience:</strong> {selectedApp.has_experience ? "Yes" : "No"}</p>
            {selectedApp.years_of_experience > 0 && <p><strong>Years:</strong> {selectedApp.years_of_experience}</p>}
            <p><strong>Description:</strong> {selectedApp.description}</p>
            <p><strong>Video:</strong> <a href={selectedApp.video_link} target="_blank" rel="noreferrer">{selectedApp.video_link}</a></p>
          </div>
          <div className="refund-right">
            <p>Status: <strong>{selectedApp.status}</strong></p>
            {selectedApp.status === "pending" && (
              <>
                <button className="save-btn" onClick={() => onApprove(selectedApp.id)}>Approve</button>
                <button className="action-btn" style={{ marginTop: "8px" }} onClick={() => onReject(selectedApp.id)}>Reject</button>
              </>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
);

const NETWORK_QUALITY_COLORS = {
  good: "#8bb897",
  slow: "#c4a05a",
  failed: "#b87b7b",
  offline: "#7b8794",
};

const WINDOW_OPTIONS = [
  { value: 24, label: "Last 24 hours" },
  { value: 168, label: "Last 7 days" },
  { value: 720, label: "Last 30 days" },
];

const formatBucket = (iso, bucket) => {
  const d = new Date(iso);
  if (bucket === "hour") {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const userLabel = (u) =>
  [u.first_name, u.last_name].filter(Boolean).join(" ") || `User ${u.user_id}`;

const NetworkIssues = ({ summary, loading, windowHours, onWindowChange }) => {
  const [showDetails, setShowDetails] = useState(false);

  const windowSelector = (
    <select
      className="ad-network-window"
      value={windowHours}
      onChange={(e) => onWindowChange(Number(e.target.value))}
    >
      {WINDOW_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );

  if (loading) {
    return (
      <div className="ad-network">
        <div className="ad-network-header">
          <p className="ad-network-intro">Loading network issues…</p>
          {windowSelector}
        </div>
      </div>
    );
  }
  if (!summary) {
    return (
      <div className="ad-network">
        <div className="ad-network-header">
          <p className="ad-network-intro">Failed to load network issues.</p>
          {windowSelector}
        </div>
      </div>
    );
  }

  const {
    users = [],
    experiences = [],
    quality_breakdown = { good: 0, slow: 0, failed: 0, offline: 0 },
    time_series = [],
    bucket = "day",
    totals = { events: 0, poor_events: 0, poor_ratio: 0, affected_users: 0, affected_experiences: 0 },
  } = summary;

  const hasEvents = totals.events > 0;
  const topUsers = users.slice(0, 10);
  const topExps = experiences.slice(0, 10);

  const breakdownLabels = Object.keys(quality_breakdown);
  const breakdownData = {
    labels: breakdownLabels,
    datasets: [{
      data: breakdownLabels.map((q) => quality_breakdown[q]),
      backgroundColor: breakdownLabels.map((q) => NETWORK_QUALITY_COLORS[q]),
      borderColor: "#fff",
      borderWidth: 1,
    }],
  };
  const breakdownOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right", labels: { font: { size: 12 }, padding: 12 } },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed} event${ctx.parsed !== 1 ? "s" : ""}` } },
    },
  };

  const trendData = {
    labels: time_series.map((p) => formatBucket(p.bucket, bucket)),
    datasets: [
      {
        label: "Total events",
        data: time_series.map((p) => p.total),
        borderColor: "#7b9eb8",
        backgroundColor: "rgba(123,158,184,0.15)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: "Poor events",
        data: time_series.map((p) => p.poor_count),
        borderColor: "#b87b7b",
        backgroundColor: "rgba(184,123,123,0.15)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };
  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { font: { size: 12 } } },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#f0e8e8" } },
    },
  };

  const issueBarOptions = (suffix) => ({
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.x} ${suffix}${ctx.parsed.x !== 1 ? "s" : ""}` } },
    },
    scales: {
      x: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, grid: { color: "#f0e8e8" } },
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 12 },
          autoSkip: false,
          callback: function (value) {
            const label = this.getLabelForValue(value);
            const max = window.innerWidth < 640 ? 14 : window.innerWidth < 900 ? 20 : 28;
            return label.length > max ? label.slice(0, max - 1) + "…" : label;
          },
        },
      },
    },
  });

  const usersChartData = {
    labels: topUsers.map(userLabel),
    datasets: [{
      data: topUsers.map((u) => u.poor_count),
      backgroundColor: "#b87b7b",
      borderColor: "#8b5a5a",
      borderWidth: 1,
      borderRadius: 4,
    }],
  };
  const expsChartData = {
    labels: topExps.map((e) => e.title || `Experience ${e.experience_id}`),
    datasets: [{
      data: topExps.map((e) => e.poor_count),
      backgroundColor: "#7b9eb8",
      borderColor: "#5a7e9b",
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const CHART_HEIGHT = 280;
  const usersBarHeight = Math.max(CHART_HEIGHT, topUsers.length * 32);
  const expsBarHeight = Math.max(CHART_HEIGHT, topExps.length * 32);

  return (
    <div className="ad-network">
      <div className="ad-network-header">
        <p className="ad-network-intro">
          Connection issues captured from client telemetry. Rows flagged in orange exceed the
          unreliable-connection threshold.
        </p>
        {windowSelector}
      </div>

      <div className="ad-network-kpis">
        <div className="ad-network-kpi">
          <span className="ad-network-kpi-label">Total events</span>
          <span className="ad-network-kpi-value">{totals.events}</span>
        </div>
        <div className="ad-network-kpi">
          <span className="ad-network-kpi-label">Poor events</span>
          <span className="ad-network-kpi-value">{totals.poor_events}</span>
        </div>
        <div className="ad-network-kpi">
          <span className="ad-network-kpi-label">Poor ratio</span>
          <span className="ad-network-kpi-value">
            {totals.events > 0 ? `${Math.round(totals.poor_ratio * 100)}%` : "—"}
          </span>
        </div>
        <div className="ad-network-kpi">
          <span className="ad-network-kpi-label">Affected users / experiences</span>
          <span className="ad-network-kpi-value">
            {totals.affected_users} / {totals.affected_experiences}
          </span>
        </div>
      </div>

      {!hasEvents ? (
        <div className="ad-network-empty">No network events recorded in this window.</div>
      ) : (
        <>
          <div className="ad-network-charts-row">
            <div className="ad-network-chart">
              <h3 className="ad-network-section-title">Quality breakdown</h3>
              <div style={{ height: CHART_HEIGHT }}>
                <Doughnut data={breakdownData} options={breakdownOptions} />
              </div>
            </div>
            <div className="ad-network-chart ad-network-chart-wide">
              <h3 className="ad-network-section-title">
                Issues over time ({bucket === "hour" ? "hourly" : "daily"})
              </h3>
              {time_series.length === 0 ? (
                <div className="ad-network-empty">No events in this window.</div>
              ) : (
                <div style={{ height: CHART_HEIGHT }}>
                  <Line data={trendData} options={trendOptions} />
                </div>
              )}
            </div>
          </div>

          <div className="ad-network-charts-row">
            <div className="ad-network-chart">
              <h3 className="ad-network-section-title">Top users with issues</h3>
              {topUsers.length === 0 ? (
                <div className="ad-network-empty">No user issues recorded.</div>
              ) : (
                <div style={{ height: usersBarHeight }}>
                  <Bar data={usersChartData} options={issueBarOptions("issue")} />
                </div>
              )}
            </div>
            <div className="ad-network-chart">
              <h3 className="ad-network-section-title">Top experiences with issues</h3>
              {topExps.length === 0 ? (
                <div className="ad-network-empty">No experience issues recorded.</div>
              ) : (
                <div style={{ height: expsBarHeight }}>
                  <Bar data={expsChartData} options={issueBarOptions("issue")} />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="ad-network-details">
        <button
          type="button"
          className="ad-network-details-toggle"
          onClick={() => setShowDetails((v) => !v)}
        >
          {showDetails ? "Hide details" : "Show details"}
        </button>

        {showDetails && (
          <>
            <h3 className="ad-network-section-title">User details</h3>
            {users.length === 0 ? (
              <div className="ad-network-empty">No user issues recorded.</div>
            ) : (
              <div className="ad-network-table-wrap">
              <table className="ad-network-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Issues</th>
                    <th>Total</th>
                    <th>Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id} className={u.is_poor ? "ad-network-row-warn" : ""}>
                      <td>{userLabel(u)}</td>
                      <td>{u.email || "—"}</td>
                      <td>{u.role || "—"}</td>
                      <td>{u.poor_count}</td>
                      <td>{u.total}</td>
                      <td>{Math.round(u.poor_ratio * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}

            <h3 className="ad-network-section-title">Experience details</h3>
            {experiences.length === 0 ? (
              <div className="ad-network-empty">No experience issues recorded.</div>
            ) : (
              <div className="ad-network-table-wrap">
              <table className="ad-network-table">
                <thead>
                  <tr>
                    <th>Experience</th>
                    <th>Issues</th>
                    <th>Total</th>
                    <th>Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {experiences.map((e) => (
                    <tr key={e.experience_id} className={e.is_poor ? "ad-network-row-warn" : ""}>
                      <td>{e.title || `Experience ${e.experience_id}`}</td>
                      <td>{e.poor_count}</td>
                      <td>{e.total}</td>
                      <td>{Math.round(e.poor_ratio * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

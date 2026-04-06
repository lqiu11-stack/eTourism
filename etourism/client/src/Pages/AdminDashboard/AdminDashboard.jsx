import { useState, useEffect, useCallback } from "react";
import "./AdminDashboard.css";
import profileImg from "../icon/head.png";
import { Link, useNavigate } from "react-router-dom";
import search from "../icon/search.png";
import axios from "axios";

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

  const fetchBookings = useCallback(async () => {
    setBookingLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/admin/bookings`, {
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

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    try {
      await axios.delete(`${API_BASE}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
      setShowUserModal(false);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete user.");
    }
  };

  const [experiences, setExperiences] = useState([]);
  const [expLoading, setExpLoading] = useState(false);
  const [expStatusFilter, setExpStatusFilter] = useState("pending");

  const fetchExperiences = useCallback(async (status) => {
    setExpLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE}/admin/experiences?status=${status}`,
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

  const handleDeleteExperience = async (id) => {
    if (!window.confirm("Delete this experience?")) return;
    try {
      await axios.delete(`${API_BASE}/admin/experiences/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchExperiences(expStatusFilter);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete.");
    }
  };

  const [applications, setApplications] = useState([]);
  const [appLoading, setAppLoading] = useState(false);
  const [appStatusFilter, setAppStatusFilter] = useState("pending");
  const [selectedApp, setSelectedApp] = useState(null);
  const [showAppModal, setShowAppModal] = useState(false);

  const fetchApplications = useCallback(async (status) => {
    setAppLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE}/admin/applications?status=${status}`,
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
      const { data } = await axios.patch(
        `${API_BASE}/admin/applications/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Application approved!\nTemporary password: ${data.temp_password}\nPlease share this with the new ehost.`);
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

  useEffect(() => {
    if (activeTab === "booking") fetchBookings();
    if (activeTab === "user") fetchUsers();
    if (activeTab === "request") fetchExperiences(expStatusFilter);
    if (activeTab === "EhostJoin") fetchApplications(appStatusFilter);
  }, [activeTab]);

  const chatList = [
  {
    id: 1,
    username: "Amy",
    time: "10:30",
    lastMessage: "I want to check for the refund progress that i appplied from last week.",
    unread: 1,
    status: "ongoing",
    messages: [
      { sender: "visitor", text: "Hello, I want to ask..." },
      { sender: "user", text: "Sure, how can I help?" },
      { sender: "visitor", text: "I want to check for the refund progress that i appplied from last week." }
    ]
  },
  {
    id: 2,
    username: "Jason",
    time: "09:15",
    lastMessage: "Thank you! I have completed the payment already.",
    unread: 0,
    status: "completed",
  },
  {
    id: 3,
    username: "Sophie",
    time: "Yesterday",
    lastMessage: "Can I change my booking date to next Friday?",
    unread: 1,
    status: "ongoing",
  },
];

  const [selectedChat, setSelectedChat] = useState(null);

  const MessageBox = () => (
    <div>
      <div className="booking-top">
        <div className="search-wrapper">
          <input className="admin-search-bar" placeholder="Search chatbox by username" />
          <button className="admin-search-btn"><img src={search} className="admin-search-icon" /></button>
        </div>
      </div>
      <div className="chat-layout">
        <div className="chat-list">
          {chatList.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${chat.status === "completed" ? "completed-chat" : "ongoing-chat"}`}
              onClick={() => setSelectedChat(chat)}
            >
              <div className="chat-item-top">
                <span className="chat-username">{chat.username}</span>
                <span className="chat-time">{chat.time}</span>
              </div>
              <div className="chat-preview-row">
                <span className="chat-preview">{chat.lastMessage}</span>
                {chat.unread > 0 && <span className="chat-unread">{chat.unread}</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="chat-window">
          {selectedChat ? (
            <>
              <div className="chat-header">{selectedChat.username}</div>
              <div className="chat-messages">
                {(selectedChat.messages || []).map((msg, i) => (
                  <div key={i} className={`msg ${msg.sender}`}>{msg.text}</div>
                ))}
              </div>
              <div className="chat-input">
                <input placeholder="Type a message..." />
                <button className="sort-btn">Send</button>
              </div>
            </>
          ) : (
            <div className="no-chat">Select a chat</div>
          )}
        </div>
      </div>
    </div>
  );

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
        <button className="profile-btn">Profile and setting</button>
      </div>

      {/* ===== Tabs ===== */}
      <div className="tabs">
        {[
          { key: "booking", label: "Manage booking" },
          { key: "user", label: "User data" },
          { key: "message", label: "Message box" },
          { key: "request", label: "E-tourism request" },
          { key: "EhostJoin", label: "New e-host request" },
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
            setStatusFilter={(s) => { setExpStatusFilter(s); fetchExperiences(s); }}
            onApprove={handleApproveExperience}
            onReject={handleRejectExperience}
            onDelete={handleDeleteExperience}
          />
        )}
        {activeTab === "EhostJoin" && (
          <EhostApplications
            applications={applications}
            loading={appLoading}
            statusFilter={appStatusFilter}
            setStatusFilter={(s) => { setAppStatusFilter(s); fetchApplications(s); }}
            selectedApp={selectedApp}
            setSelectedApp={setSelectedApp}
            showAppModal={showAppModal}
            setShowAppModal={setShowAppModal}
            onApprove={handleApproveApplication}
            onReject={handleRejectApplication}
          />
        )}
      </div>

    </div>
  );
};

const Booking = ({
  bookings, loading,
  showRefundPanel, selectedBooking, action, rejectReason,
  setShowRefundPanel, setAction, setRejectReason, handleRefund,
}) => (
  <div>
    <div className="booking-top">
      <div className="search-wrapper">
        <input className="admin-search-bar" placeholder="Search by booking code" />
        <button className="admin-search-btn"><img src={search} className="admin-search-icon" /></button>
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
              <button className="sort-btn" onClick={() => handleRefund(item)}>{item.status}</button>
            ) : (
              <button className="sort-btn" disabled>{item.status}</button>
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
            <p>Contact: {selectedBooking.contact_name}</p>
            <p>Email: {selectedBooking.contact_email}</p>
            <p>Amount paid: £{Number(selectedBooking.amount_paid || 0).toFixed(2)}</p>
            <p>Status: {selectedBooking.status}</p>
          </div>
          <div className="refund-right">
            <button className={`action-btn ${action === "approve" ? "active" : ""}`} onClick={() => setAction("approve")}>
              Accept refund
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
            <button
              className="save-btn"
              onClick={() => {
                if (action === "reject" && !rejectReason) { alert("Please enter a reject reason"); return; }
                alert(`Saved: ${action}`);
                setShowRefundPanel(false);
              }}
            >
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
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", fontWeight: "bold", borderBottom: "1px solid black", paddingBottom: "10px" }}>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {loading && <p style={{ padding: "12px" }}>Loading...</p>}
        {!loading && filtered.length === 0 && <p style={{ padding: "12px" }}>No users found.</p>}
        {filtered.map((item) => (
          <div key={item.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #eee" }}>
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

const ExperienceRequests = ({ experiences, loading, statusFilter, setStatusFilter, onApprove, onReject, onDelete }) => (
  <div>
    <div className="booking-top">
      <div className="search-wrapper">
        <input className="admin-search-bar" placeholder="Search by experience title" />
        <button className="admin-search-btn"><img src={search} className="admin-search-icon" /></button>
      </div>
      {["pending", "approved", "rejected"].map((s) => (
        <button key={s} className="sort-btn" style={statusFilter === s ? { background: "#a88b8b", color: "white" } : {}} onClick={() => setStatusFilter(s)}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </button>
      ))}
    </div>

    <div className="table-box">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 2fr", fontWeight: "bold", borderBottom: "1px solid black", paddingBottom: "10px" }}>
        <span>ID</span>
        <span>Title</span>
        <span>Status</span>
        <span>Actions</span>
      </div>
      {loading && <p style={{ padding: "12px" }}>Loading...</p>}
      {!loading && experiences.length === 0 && <p style={{ padding: "12px" }}>No experiences found.</p>}
      {experiences.map((item) => (
        <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 2fr", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #eee" }}>
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
            <button className="sort-btn" style={{ background: "#e57373", color: "white" }} onClick={() => onDelete(item.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const EhostApplications = ({
  applications, loading, statusFilter, setStatusFilter,
  selectedApp, setSelectedApp, showAppModal, setShowAppModal,
  onApprove, onReject,
}) => (
  <div>
    <div className="booking-top">
      <div className="search-wrapper">
        <input className="admin-search-bar" placeholder="Search by name or email" />
        <button className="admin-search-btn"><img src={search} className="admin-search-icon" /></button>
      </div>
      {["pending", "approved", "rejected"].map((s) => (
        <button key={s} className="sort-btn" style={statusFilter === s ? { background: "#a88b8b", color: "white" } : {}} onClick={() => setStatusFilter(s)}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </button>
      ))}
    </div>

    <div className="table-box">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr 1fr 2fr", fontWeight: "bold", borderBottom: "1px solid black", paddingBottom: "10px" }}>
        <span>ID</span>
        <span>Name</span>
        <span>Email</span>
        <span>Status</span>
        <span>Actions</span>
      </div>
      {loading && <p style={{ padding: "12px" }}>Loading...</p>}
      {!loading && applications.length === 0 && <p style={{ padding: "12px" }}>No applications found.</p>}
      {applications.map((item) => (
        <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr 1fr 2fr", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #eee" }}>
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
            {item.status === "pending" && (
              <>
                <button className="sort-btn" onClick={() => onApprove(item.id)}>Approve</button>
                <button className="sort-btn" onClick={() => onReject(item.id)}>Reject</button>
              </>
            )}
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
            <p><strong>Nationality:</strong> {selectedApp.nationality}</p>
            <p><strong>Preferred country:</strong> {selectedApp.preferred_country}</p>
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

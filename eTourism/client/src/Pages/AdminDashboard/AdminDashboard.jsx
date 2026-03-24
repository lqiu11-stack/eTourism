import { useState } from "react";
import "./AdminDashboard.css";
import profileImg from "../icon/head.png";
import { Link } from "react-router-dom";
import search from "../icon/search.png"
export const Dashboard = () => {

  /* fake detail for manage booking */
  const managebooking =[
    {
    bookingCode: "ABC123",
    username: "Amy",
    eventName: "London city trip",
    status: "ongoing",
    link: "http://abc.com",
  },
  {
    bookingCode: "DEF456",
    username: "Ben",
    eventName: "Paris museum tour",
    status: "finish",
    link: "http://def.com",
  },
  {
    bookingCode: "GHI789",
    username: "Cindy",
    eventName: "Tokyo food trip",
    status: "refund pending",
    link: "http://ghi.com",
    eventDate: "2025/12/08",
    bookingDate: "2025/01/08",
    refundDate: "2025/10/08",
    refundReason: "Don't have the time to join the stream",
  },
  ]
 const [bookings, setBookings] = useState(managebooking);
 const [showRefundPanel, setShowRefundPanel] = useState(false);
 const [selectedBooking, setSelectedBooking] = useState(null);
 const [action, setAction] = useState(""); // "approve" or "reject"
 const [rejectReason, setRejectReason] = useState("");
const handleRefund = (item) => {
  setSelectedBooking(item);
  setShowRefundPanel(true);
  setAction("");
  setRejectReason("");
};

  /* fake detail for userdata */
    const [userData, setUserData] = useState([
      {
        email: "amy@gmail.com",
        password: "12345678",
        role: "admin",
        first_name: "Amy",
        last_name: "AA",
        date_of_birth: "2022-03-10",
        country: "UK",
        language: "English",
      }
    ]);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  /* fake detail for chat box (can delete after) */
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

  /* fakee data for the request */
  const tourism =[
    {
    eventCode: "asdv12",
    eventName: "Afica animal tourism",
    status: "Pending",
    btn: "12/06/2026",
  },
  ]
  const [selectedrequest, setRequest] = useState(tourism);

  /*fake data for new ehost*/
  const ehostRequestData = [
  {
    applyCode: "EH001",
    hostName: "Sophia Lee",
    state: "Padding",
    detail: "View",
    approved: "12/03/2003",
  },
  {
    applyCode: "EH002",
    hostName: "Daniel Wang",
    state: "Approved",
    detail: "View",
    approved: "12/04/2003",
  },
  {
    applyCode: "EH003",
    hostName: "Emily Chen",
    state: "Padding",
    detail: "View",
    approved:"12/03/2007",
  },
  {
    applyCode: "EH004",
    hostName: "Jason Lin",
    state: "Approved",
    detail: "View",
    approved: "12/03/2006",
  },
  {
    applyCode: "EH005",
    hostName: "Olivia Brown",
    state: "Padding",
    detail: "View",
    approved:"12/03/2012",
  },
];
const [selectedRequest, setSelectedRequest] = useState(ehostRequestData);

/* fake report*/
const reportData = [
    {
      reportCode: "RP001",
      username: "Amy",
      state: "Unsolved",
      detail: "View",
    },
    {
      reportCode: "RP002",
      username: "John",
      state: "Solved",
      detail: "View",
    },
    {
      reportCode: "RP003",
      username: "Emily",
      state: "Unsolved",
      detail: "View",
    },
    {
      reportCode: "RP004",
      username: "Daniel",
      state: "Solved",
      detail: "View",
    },
  ];
  const [reports, setReports] = useState(reportData);

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;
  
  const [activeTab, setActiveTab] = useState("booking");

    const MessageBox = () => {
  return (
    <div>

      {/* Top search */}
      <div className="booking-top">
        <div className="search-wrapper">
          <input
            className="admin-search-bar"
            placeholder="Search chatbox by username"
          />
          <button className="admin-search-btn">
            <img src={search} className="admin-search-icon" />
          </button>
        </div>
      </div>

      {/* Chat layout */}
      <div className="chat-layout">

        {/* list */}
        <div className="chat-list">
          {chatList.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${
                chat.status === "completed"
                  ? "completed-chat"
                  : "ongoing-chat"
              }`}
              onClick={() => setSelectedChat(chat)} 
            >
              <div className="chat-item-top">
                <span className="chat-username">{chat.username}</span>
                <span className="chat-time">{chat.time}</span>
              </div>

              <div className="chat-preview-row">
                <span className="chat-preview">{chat.lastMessage}</span>

                {chat.unread > 0 && (
                  <span className="chat-unread">{chat.unread}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* chat window */}
        <div className="chat-window">
          {selectedChat ? (
            <>
              <div className="chat-header">
                {selectedChat.username}
              </div>

              <div className="chat-messages">
                {selectedChat.messages.map((msg, index) => (
                  <div key={index} className={`msg ${msg.sender}`}>
                    {msg.text}
                  </div>
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
};
    const Request = () => {
      return (
    <div>

      {/* Top search + buttons */}
      <div className="booking-top">

        <div className="search-wrapper">
          <input
            className="admin-search-bar"
            placeholder="Search by event apply code"
          />
          <button className="admin-search-btn">
             <img src ={search} className="admin-search-icon"></img>
          </button>
         
        </div>

        <button className="sort-btn">Approved</button>
        <button className="sort-btn">Pending</button>
      </div>

      {/* Table */}
      <div className="table-box">
        <div className="table-header">
          <span>Event code</span>
          <span>Event name</span>
          <span>State</span>
          <span>Approve date</span>
        </div>
        <div>
      {selectedrequest.map((item) => (
        <div key={item.eventCode} className="table-row">
          <div>{item.eventCode}</div>
          <div>{item.eventName}</div>
          <div>
            <button className="sort-btn">
              {item.status}
            </button>
          </div>
          <div>{item.btn}</div>
        </div>
      ))}
    </div>
      </div>

    </div>
  );
    };


  const EhostJoin = () => {
      return (
    <div>

      {/* Top search + buttons */}
      <div className="booking-top">

        <div className="search-wrapper">
          <input
            className="admin-search-bar"
            placeholder="Search by event apply code"
          />
          <button className="admin-search-btn">
             <img src ={search} className="admin-search-icon"></img>
          </button>
         
        </div>

        <button className="sort-btn">Approved</button>
        <button className="sort-btn">Padding</button>
      </div>

      {/* Table */}
      <div className="table-box">
        <div className="table-header">
          <span>Apply form code</span>
          <span>E-host name</span>
          <span>State</span>
          <span>View detail</span>
          <span>Approved</span>
        </div>
        {selectedRequest.map((item) => (
        <div className="request-row" key={item.applyCode}>
          <div>{item.applyCode}</div>
          <div>{item.hostName}</div>

          <div>
            <button
              className="sort-btn"                                                                                     
              onClick={() => handleApprove(item.applyCode)}
              disabled={item.state === "Approved"}
            >
              {item.state}
            </button>
          </div>

          <div>
            <button className="sort-btn">
              {item.detail}
            </button>
          </div>

          <div>{item.approved}</div>
        </div>
      ))}
      </div>

    </div>
  );
    };

    const Report = () => {
      return (
    <div>

      {/* Top search + buttons */}
      <div className="booking-top">

        <div className="search-wrapper">
          <input
            className="admin-search-bar"
            placeholder="Search by event apply code"
          />
          <button className="admin-search-btn">
             <img src ={search} className="admin-search-icon"></img>
          </button>
         
        </div>

        <button className="sort-btn">Solved</button>
        <button className="sort-btn">Unsolved</button>
      </div>

      {/* Table */}
      <div className="table-box">
        <div className="report-header">
          <span>Report code</span>
          <span>Username</span>
          <span>State</span>
          <span>View detail</span>
        </div>
        {reports.map((item) => (
        <div className="report-row" key={item.reportCode}>
          <div>{item.reportCode}</div>
          <div>{item.username}</div>

          <div>
            <button
              className="sort-btn"
              onClick={() => handleSolve(item.reportCode)}
              disabled={item.state === "Solved"}
            >
              {item.state}
            </button>
          </div>

          <div>
            <button className="sort-btn">
              {item.detail}
            </button>
          </div>
        </div>
      ))}
      </div>

    </div>
  );
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
                  <button className="admin-nav-link admin-nav-btn-link" onClick={handleLogout}>
                    Logout
                  </button>
                ) : (
                  <Link to="/login" className="admin-nav-link">Logout</Link>
                )}
            </div>
          </nav>

      {/* ===== Profile Section ===== */}
      <div className="profile-section">
        <img src={profileImg} alt="profile" className="profile-img" />
        <h2>Angela</h2>

        <button className="profile-btn">
          Profile and setting
        </button>
      </div>

      {/* ===== Tabs ===== */}
      <div className="tabs">
        <button
          className={activeTab === "booking" ? "tab active" : "tab"}
          onClick={() => setActiveTab("booking")}
        >
          Manage booking
        </button>

        <button
          className={activeTab === "user" ? "tab active" : "tab"}
          onClick={() => setActiveTab("user")}
        >
          User data
        </button>

        <button
          className={activeTab === "message" ? "tab active" : "tab"}
          onClick={() => setActiveTab("message")}
        >
          Message box
        </button>

        <button
          className={activeTab === "request" ? "tab active" : "tab"}
          onClick={() => setActiveTab("request")}
        >
          E-tourism request
        </button>

        <button
          className={activeTab === "EhostJoin" ? "tab active" : "tab"}
          onClick={() => setActiveTab("EhostJoin")}
        >
          New e-host request
        </button>

        <button
          className={activeTab === "Report" ? "tab active" : "tab"}
          onClick={() => setActiveTab("Report")}
        >
          Report
        </button>
      </div>

      {/* ===== Content ===== */}
      <div className="content-box">
        {activeTab === "booking" && (
        <Booking
          bookings={bookings}
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
          userData={userData}
          setUserData={setUserData}
          showUserModal={showUserModal}
          setShowUserModal={setShowUserModal}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
        />
        )}
        {activeTab === "message" && <MessageBox />}
        {activeTab === "request" && <Request />}
        {activeTab === "profile" && <Profile />}
        {activeTab === "EhostJoin" && <EhostJoin />}
         {activeTab === "Report" && <Report />}
      </div>

    </div>
  );
  
};

const Booking = ({
    bookings,
    showRefundPanel,
    selectedBooking,
    action,
    rejectReason,
    setShowRefundPanel,
    setAction,
    setRejectReason,
    handleRefund,
  }) => {
  return (
    <div>

      {/* Top search + buttons */}
      <div className="booking-top">

        <div className="search-wrapper">
          <input
            className="admin-search-bar"
            placeholder="Search by booking code"
          />
          <button className="admin-search-btn">
             <img src ={search} className="admin-search-icon"></img>
          </button>
         
        </div>

        <button className="sort-btn">Sort by date</button>
        <button className="sort-btn">Sort by event name</button>
        {/* <button
          className="sort-btn"
          disabled={item.status !== "refund pending"}
          onClick={() => {
            setSelectedBooking(item);
            setShowRefundPanel(true);
          }}
        >
          {item.status}
        </button> */}
      </div>

      {/* Table */}
      <div className="table-box">
        <div className="table-header">
          <span>Booking code</span>
          <span>Username</span>
          <span>Event name</span>
          <span>State</span>
          <span>Link to Stream</span>
        </div>
          {bookings.map((item) => (
          <div className="table-row" key={item.bookingCode}>
            <div>{item.bookingCode}</div>
            <div>{item.username}</div>
            <div>{item.eventName}</div>
            <div>
              {item.status === "refund pending" ? (
                <button
                  className="sort-btn"
                  onClick={() => handleRefund(item)}
                >
                  {item.status}
                </button>
              ) : (
                <button className="sort-btn" disabled>
                  {item.status}
                </button>
              )}
            </div>

            {/* <div>{item.status}</div> */}
            <div>
              <a href={item.link} target="_blank" rel="noreferrer">
                <button className="sort-btn">
                  View Stream
                </button>
              </a>
            </div>
          </div>
        ))}
      </div>
      {showRefundPanel && selectedBooking && (
        <div className="refund-overlay">
          <div className="refund-panel">

            {/* Close */}
            <button
              className="close-btn"
              onClick={() => setShowRefundPanel(false)}
            >
              ✕
            </button>

            {/* Left */}
            <div className="refund-left">
              <h3>Manage booking ID: {selectedBooking.bookingCode}</h3>

              <p>booking username: {selectedBooking.username}</p>
              <p>Event name: {selectedBooking.eventName}</p>
              <p>Event date: {selectedBooking.eventDate}</p>
              <p>Booking date: {selectedBooking.bookingDate}</p>
              <p>Refund apply date: {selectedBooking.refundDate}</p>
              <p>Refund reason: {selectedBooking.refundReason}</p>

              <p className="refund-state">
                Refund policy: two days before the event, refund 80%
              </p>
            </div>

            {/* Right */}
            <div className="refund-right">

              <button
                className={`action-btn ${action === "approve" ? "active" : ""}`}
                onClick={() => setAction("approve")}
              >
                Accept refund
              </button>

              <button
                className={`action-btn ${action === "reject" ? "active" : ""}`}
                onClick={() => setAction("reject")}
              >
                Refund rejected
              </button>

              <textarea
              placeholder="Type in the reject reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              disabled={action !== "reject"}
            />

              <button
                className="save-btn"
                onClick={() => {
                  if (action === "reject" && !rejectReason) {
                    alert("Please enter reject reason");
                    return;
                  }

                  alert(`Saved: ${action}`);
                  setShowRefundPanel(false);
                }}
              >
                Save the change
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

const UserData = ({
  userData,
  setUserData,
  showUserModal,
  setShowUserModal,
  selectedUser,
  setSelectedUser,
}) => {return (
    <div>

      {/* Top search + buttons */}
      <div className="booking-top">

        <div className="search-wrapper">
          <input
            className="admin-search-bar"
            placeholder="Search by username"
          />
          <button className="admin-search-btn">
             <img src ={search} className="admin-search-icon"></img>
          </button>
         
        </div>

        <button className="sort-btn">Sort by alphabet</button>
        {/* <button className="sort-btn">Sort by event name</button> */}
      </div>

      {/* Table */}
      <div className="table-box">
        <div className="user-table-header">
          <span>Username</span>
          <span>Registration date</span>
          <span>Edit user file</span>
        </div>
        {userData.map((item, index) => (
          <div className="user-table-row" key={index}>
            <div>{item.email}</div>
            <div>{item.role}</div>
            <div>
              <button
                className="sort-btn"
                onClick={() => {
                  setSelectedUser(item);
                  setShowUserModal(true);
                }}
              >
                Edit user profile
              </button>
            </div>
          </div>
        ))}
      </div>
      {showUserModal && selectedUser && (
          <div className="refund-overlay">
            <div className="refund-panel">

              <button
                className="close-btn"
                onClick={() => setShowUserModal(false)}
              >
                ✕
              </button>
              {/*        
              email: "amy@gmail.com",
              password: "12345678",
              role: "admin",
              first_name: "Amy",
              last_name: "AA",
              date_of_birth: "2022-03-10",
              country: "UK",
              language: "English", */}

              <div className="refund-left">
                <h3>Edit User</h3>

                <p>Email:</p>
                
                <input
                 className="userdata-typein-email"
                  value={selectedUser.email}/>

                <p>Role:</p>
                <input
                 className="userdata-typein"
                  value={selectedUser.role}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      role: e.target.value,
                    })
                  }
                />

                <p>First Name:</p>
                <input
                 className="userdata-typein"
                  value={selectedUser.first_name}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      first_name: e.target.value,
                    })
                  }
                />

                <p>Last Name:</p>
                <input
                 className="userdata-typein"
                  value={selectedUser.last_name}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      last_name: e.target.value,
                    })
                  }
                />


              </div>

              <div className="refund-right">
                <p>Date of birth:</p>
                <input
                  className="userdata-typein"
                  value={selectedUser.date_of_birth}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      date_of_birth: e.target.value,
                    })
                  }
                />

                <p>Location:</p>
                <input
                 className="userdata-typein"
                  value={selectedUser.country}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      country: e.target.value,
                    })
                  }
                />

                <p>Language:</p>
                <input
                 className="userdata-typein"
                  value={selectedUser.language}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      language: e.target.value,
                    })
                  }
                />
                
                <button
                  className="save-btn"
                  onClick={() => {
                    setUserData((prev) =>
                      prev.map((u) =>
                        u.email === selectedUser.email ? selectedUser : u
                      )
                    );
                    setShowUserModal(false);
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
}

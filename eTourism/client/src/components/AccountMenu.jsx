import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AccountMenu.css";

const PALETTE = ["#f7a13c", "#d97aa8", "#7ac0d9", "#a3d977", "#c294e0", "#f08080"];

const initialsOf = (user) => {
  const f = (user?.first_name || "").trim();
  const l = (user?.last_name || "").trim();
  if (f || l) return `${f[0] || ""}${l[0] || ""}`.toUpperCase();
  if (user?.display_name) return user.display_name.slice(0, 2).toUpperCase();
  if (user?.email) return user.email.slice(0, 2).toUpperCase();
  return "?";
};

const colorFor = (user) => {
  const seed = (user?.email || user?.first_name || "x").length;
  return PALETTE[seed % PALETTE.length];
};

const fullNameOf = (user) => {
  const parts = [user?.first_name, user?.last_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return user?.display_name || user?.email || "Account";
};

export const AccountMenu = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isLoggedIn = !!token;

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!isLoggedIn) {
    return (
      <Link to="/login" className="account-menu-login">
        Login
      </Link>
    );
  }

  const initials = initialsOf(user);
  const avatarColor = colorFor(user);
  const fullName = fullNameOf(user);

  const close = () => setOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    close();
    navigate("/login");
  };

  return (
    <div className="account-menu" ref={ref}>
      <button
        type="button"
        className="account-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="account-avatar" style={{ background: avatarColor }}>{initials}</span>
        <span className="account-menu-name">{fullName}</span>
      </button>

      {open && (
        <div className="account-menu-panel" role="menu">
          <div className="account-menu-header">
            <span className="account-avatar account-avatar--lg" style={{ background: avatarColor }}>{initials}</span>
            <div>
              <div className="account-menu-header-name">{fullName}</div>
              {user.email && <div className="account-menu-header-email">{user.email}</div>}
            </div>
          </div>

          <ul className="account-menu-list">
            {user.role === "ehost" ? (
              <>
                <li>
                  <Link to="/EhostDashboard" className="account-menu-item" role="menuitem" onClick={close}>
                    <svg className="account-menu-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="9" />
                      <rect x="14" y="3" width="7" height="5" />
                      <rect x="14" y="12" width="7" height="9" />
                      <rect x="3" y="16" width="7" height="5" />
                    </svg>
                    E-host dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/EhostProfile" className="account-menu-item" role="menuitem" onClick={close}>
                    <svg className="account-menu-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
                    </svg>
                    Update profile
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/VisitorProfile" className="account-menu-item" role="menuitem" onClick={close}>
                    <svg className="account-menu-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
                    </svg>
                    My profile
                  </Link>
                </li>
                <li>
                  <Link to="/MyBooking" className="account-menu-item" role="menuitem" onClick={close}>
                    <svg className="account-menu-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="7" width="18" height="13" rx="2" />
                      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Bookings &amp; Trips
                  </Link>
                </li>
                <li>
                  <Link to="/Following" className="account-menu-item" role="menuitem" onClick={close}>
                    <svg className="account-menu-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    Following
                  </Link>
                </li>
              </>
            )}
            <li className="account-menu-divider" aria-hidden="true" />
            <li>
              <button type="button" className="account-menu-item" role="menuitem" onClick={handleLogout}>
                <svg className="account-menu-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
                Sign out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

import { useMemo, useRef, useState, useEffect } from "react";
import axios from "axios";
import "./Mainstyle.css";
import { AccountMenu } from "../../components/AccountMenu";

const API_BASE = import.meta.env.VITE_API_URL;
import searchIcon from "../icon/search.png";
import continentIcon from "../icon/continents.png";
import dateIcon from "../icon/calendar.png";
import filterIcon from "../icon/filter.png";
import refundIcon from "../icon/cashback.png";
import customerSrevice from "../icon/customer-service.png";
import customerReview from "../icon/customer-review.png";
import LiveIcon from "../icon/live.png";
import translate from "../icon/language.png";
import { useNavigate, Link } from "react-router-dom";
import { CONTINENTS, CATEGORIES, LANGUAGES } from "../../constants/enums";
import { useExperiences } from "../../hooks/useExperiences";
import { useAuth } from "../../utils/auth";
import { formatDate } from "../../utils/formatDate";
import { ExperienceCard } from "../../components/ExperienceCard";



const MAX_NEW_EVENTS = 8;
const FILTER_CONTINENTS = CONTINENTS.filter(c => c !== "Antarctica");

const GENDER_OPTIONS = [
  { value: "", label: "All" },
  { value: "any", label: "Any" },
  { value: "mixed", label: "Mixed only" },
  { value: "female_only", label: "Female-only" },
  { value: "male_only", label: "Male-only" },
];
const GENDER_LABELS = GENDER_OPTIONS.reduce((acc, o) => { acc[o.value] = o.label; return acc; }, {});

const filterGenderOptionsForViewer = (viewerGender) => {
  if (viewerGender === "male") return GENDER_OPTIONS.filter(o => o.value !== "female_only");
  if (viewerGender === "female") return GENDER_OPTIONS.filter(o => o.value !== "male_only");
  return GENDER_OPTIONS;
};

const toggleIn = (list, value) =>
  list.includes(value) ? list.filter(v => v !== value) : [...list, value];

const FilterDropdown = ({ label, shortLabel, options, active, onChange, isOpen, onToggle }) => (
  <div style={{ position: "relative" }}>
    <button
      className={`filter-chip${active.length ? " filter-chip--active" : ""}`}
      onClick={onToggle}
    >
      {active.length
        ? `${shortLabel}${active.length > 1 ? ` (${active.length})` : `: ${active[0]}`}`
        : `+ ${label}`}
    </button>
    {isOpen && (
      <div className="filter-dropdown">
        {options.map(opt => (
          <label key={opt} className="filter-check">
            <input
              type="checkbox"
              checked={active.includes(opt)}
              onChange={() => onChange(prev => toggleIn(prev, opt))}
            />
            {opt}
          </label>
        ))}
      </div>
    )}
  </div>
);

export const MainPage = () => {
  const navigate = useNavigate();
  const [showTerms, setShowTerms] = useState(false);
  const [termsText, setTermsText] = useState("");
  useEffect(() => {
  fetch("/terms.txt")
    .then((r) => r.text())
    .then(setTermsText)
    .catch(() => {});
}, []);

  const { user } = useAuth();
  const visibleGenderOptions = filterGenderOptionsForViewer(user?.gender);
  const { experiences } = useExperiences();
  const dateInputRef = useRef(null);
  const [followedHosts, setFollowedHosts] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || user?.role !== "visitor") {
      setFollowedHosts([]);
      return;
    }
    axios.get(`${API_BASE}/visitor/follows`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ data }) => setFollowedHosts(Array.isArray(data) ? data : []))
      .catch(() => setFollowedHosts([]));
  }, [user?.role]);

  const [searchLocation, setSearchLocation] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [activeContinents, setActiveContinents] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [activeLanguages, setActiveLanguages] = useState([]);
  const [genderFilter, setGenderFilter] = useState("");
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (name) => setOpenMenu(prev => (prev === name ? null : name));

  useEffect(() => {
    if (!openMenu) return undefined;
    const handler = (e) => {
      if (e.target.closest('.filter-chip') || e.target.closest('.filter-dropdown')) return;
      if (e.target.closest('input, select, textarea, button, label, datalist')) return;
      setOpenMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

  const continentCounts = useMemo(
    () => experiences.reduce((acc, e) => {
      if (e.continent) acc[e.continent] = (acc[e.continent] || 0) + 1;
      return acc;
    }, {}),
    [experiences]
  );

  const newEvents = useMemo(
    () => {
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now();
      return [...experiences]
        .filter((e) => e.date_time && new Date(e.date_time).getTime() > now)
        .sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
        .slice(0, MAX_NEW_EVENTS);
    },
    [experiences]
  );

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation.trim()) params.set("q", searchLocation.trim());
    if (searchDate) params.set("date", searchDate);
    if (activeContinents.length) params.set("continents", activeContinents.join(","));
    if (activeCategories.length) params.set("categories", activeCategories.join(","));
    if (activeLanguages.length) params.set("languages", activeLanguages.join(","));
    if (genderFilter) params.set("gender", genderFilter);
    const target = activeContinents.length === 1 ? activeContinents[0] : "all";
    navigate(`/continent/${target}${params.toString() ? `?${params}` : ""}`);
  };

  const resetFilters = () => {
    setActiveContinents([]);
    setActiveCategories([]);
    setActiveLanguages([]);
    setGenderFilter("");
    setSearchLocation("");
    setSearchDate("");
    setOpenMenu(null);
  };

  return (
    <div className="main-page">

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay" />

        <div className="hero-content">
          <nav className="navbar">
            <div className="nav-links">
              <a className="Text">
                E-tourism
              </a>
            </div>

            <div className="nav-links">
              <button className="top-btn" type="button" 
              onClick={() =>
                navigate("/register/ehost/step1", {
                  state: {
                    from: location.pathname + location.search,
                  },
                })
              }>
            Join us to become an E-host
          </button>
              <AccountMenu />
            </div>
          </nav>

          <h1 className="hero-title">
            Where do you want to start the journey?
          </h1>

          {/* Search Box */}
          <div className="search-panel">

            <div className="search-row">

              <div className="search-pair location-group">
                <div className="search-title">
                  <div className="title-left">
                    <img src={continentIcon} alt="location" className="title-icon" />
                    <span>Country / Location</span>
                  </div>
                  <button className="map-link" type="button" onClick={() => navigate("/MapPage")} >Search by map</button>
                </div>
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search for the location"
                    className="textbox-word"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>

              <div className="search-pair date-group">
                <div className="search-title">
                  <img src={dateIcon} className="date-icon"/>
                  <span>Date</span>
                </div>
                <div className="search-box">
                  <input
                    type="text"
                    className="textbox-word"
                    value={formatDate(searchDate)}
                    placeholder="Select date"
                    readOnly
                    onClick={() => dateInputRef.current?.showPicker()}
                  />

                  <input
                    ref={dateInputRef}
                    className="textbox-word"
                    type="date"
                    value={searchDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {setSearchDate(e.target.value);
                                      setTimeout(() => {
                                        dateInputRef.current?.blur();
                                      }, 100);
                    }
                    }
                    style={{ position: "absolute", inset: 0, opacity: 0, pointerEvents: "none" }}
                  />
                </div>
              </div>

              <button className="search-btn" onClick={handleSearch}>
                <img src={searchIcon} className="date-icon"/>
              </button>

            </div>

            {/* Filter */}
            <div className="filters">
              <div className="filter-title">
                <img src={filterIcon} className="filter-icon"/>
                <span>Filter</span>
              </div>
              <div className="filter-list">
                <FilterDropdown
                  label="Region"
                  shortLabel="Region"
                  options={FILTER_CONTINENTS}
                  active={activeContinents}
                  onChange={setActiveContinents}
                  isOpen={openMenu === "region"}
                  onToggle={() => toggleMenu("region")}
                />
                <FilterDropdown
                  label="Tour type"
                  shortLabel="Type"
                  options={CATEGORIES}
                  active={activeCategories}
                  onChange={setActiveCategories}
                  isOpen={openMenu === "category"}
                  onToggle={() => toggleMenu("category")}
                />
                <FilterDropdown
                  label="Tour language"
                  shortLabel="Language"
                  options={LANGUAGES}
                  active={activeLanguages}
                  onChange={setActiveLanguages}
                  isOpen={openMenu === "language"}
                  onToggle={() => toggleMenu("language")}
                />
                <div style={{ position: "relative" }}>
                  <button
                    className={`filter-chip${genderFilter ? " filter-chip--active" : ""}`}
                    onClick={() => toggleMenu("gender")}
                  >
                    {genderFilter
                      ? `Gender: ${GENDER_LABELS[genderFilter]}`
                      : "+ Gender preference"}
                  </button>
                  {openMenu === "gender" && (
                    <div className="filter-dropdown">
                      {visibleGenderOptions.map(({ value, label }) => (
                        <label key={value || "all"} className="filter-check">
                          <input
                            type="radio"
                            name="main-gender"
                            checked={genderFilter === value}
                            onChange={() => setGenderFilter(value)}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <button className="filter-chip" onClick={resetFilters}>
                  Reset filter
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="feature">
          <span className="icon-circle"><img src={refundIcon} className="filter-icon"/></span>
          <h4>Free refund</h4>
          <p>24 hours before stream start</p>
        </div>
        <div className="feature">
          <span className="icon-circle"><img src={customerSrevice} className="filter-icon"/></span>
          <h4>Customer service</h4>
          <p>We got 24/7 online service</p>
        </div>
        <div className="feature">
          <span className="icon-circle"><img src={customerReview} className="filter-icon"/></span>
          <h4>Worldwide</h4>
          <p>Over 1000 service</p>
        </div>
        <div className="feature">
          <span className="icon-circle"><img src={LiveIcon} className="filter-icon"/></span>
          <h4>Support Multi-platform</h4>
          <p>Friendly to every customer</p>
        </div>
        <div className="feature">
          <span className="icon-circle"><img src={translate} className="filter-icon"/></span>
          <h4>Different Language</h4>
          <p>Friendly to customer</p>
        </div>
      </section>

      {/* Hosts you follow */}
      {followedHosts.length > 0 && (
        <section className="follow-rail-section">
          <div className="follow-rail-header">
            <div>
              <h2 className="section-title">Hosts you follow</h2>
              <p className="section-subtitle">Catch their next live experience.</p>
            </div>
            <button className="more-btn" onClick={() => navigate("/Following")}>See all</button>
          </div>
          <div className="follow-rail">
            {followedHosts.map((h) => {
              const next = h.next_experience_id;
              const goTo = next
                ? `/DetailPage?id=${next}`
                : `/Following`;
              const date = h.next_experience_date_time
                ? new Date(h.next_experience_date_time).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                : null;
              return (
                <div
                  key={h.ehost_id}
                  role="button"
                  tabIndex={0}
                  className="follow-card"
                  onClick={() => navigate(goTo)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(goTo); } }}
                >
                  <div
                    className="follow-card-cover"
                    style={h.next_experience_cover ? { backgroundImage: `url(${h.next_experience_cover})` } : undefined}
                  />
                  <div className="follow-card-body">
                    <div className="follow-card-host">
                      {h.profile_image
                        ? <img src={h.profile_image} alt="" className="follow-card-avatar" />
                        : <span className="follow-card-avatar follow-card-avatar--placeholder">
                            {(h.ehost_display_name?.[0] || "?").toUpperCase()}
                          </span>}
                      <Link
                        to={`/ehost/${h.ehost_id}`}
                        className="follow-card-name follow-card-name--link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {h.ehost_display_name || "Host"}
                      </Link>
                    </div>
                    {next ? (
                      <>
                        <div className="follow-card-title">{h.next_experience_title}</div>
                        <div className="follow-card-meta">{date} · {h.next_experience_country}</div>
                      </>
                    ) : (
                      <div className="follow-card-meta">No upcoming experiences</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Where Next */}
      <section className="where-wrapper">
        <div className="destination-section">
          <div className="where-header">
            <div>
              <h2 className="section-title">Where next?</h2>
              <p className="section-subtitle">Here are some popular choice</p>
            </div>
            <button className="more-btn" onClick={handleSearch}>Explore more</button>
          </div>
          <div className="destination-grid">
            <div
              className="destination-card big-card"
              onClick={() => navigate("/continent/Asia")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-text">
                <h3>Asia</h3>
                <p>{continentCounts["Asia"] || 0} experience{continentCounts["Asia"] !== 1 ? "s" : ""} available</p>
              </div>
            </div>
            <div className="right-column">
              <div
                className="destination-card tall-card"
                onClick={() => navigate("/continent/Europe")}
                style={{ cursor: "pointer" }}
              >
                <div className="small-card-text">
                  <h3>Europe</h3>
                  <p>{continentCounts["Europe"] || 0} experience{continentCounts["Europe"] !== 1 ? "s" : ""} available</p>
                </div>
              </div>
              <div
                className="destination-card tall-card"
                onClick={() => navigate("/continent/Africa")}
                style={{ cursor: "pointer" }}
              >
                <div className="small-card-text">
                  <h3>Africa</h3>
                  <p>{continentCounts["Africa"] || 0} experience{continentCounts["Africa"] !== 1 ? "s" : ""} available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New event */}
      <section className="popular">
        <div className="destination-section">
          <div className="where-header">
            <div>
              <h2 className="section-title">New event!</h2>
              <p className="section-subtitle">Don't know what to choose? Check out our new activity!</p>
            </div>
            <button className="more-btn" onClick={() => navigate("/continent/all")}>Click here to check more</button>
          </div>
          <div className="new-event-grid">
            {newEvents.length > 0
              ? newEvents.map(exp => (
                  <ExperienceCard
                    key={exp.id}
                    experience={exp}
                    linkState={{ from: "main" }}
                  />
                ))
              : <p style={{ color: "#666" }}>No experiences found.</p>
            }
          </div>
        </div>
      </section>

      {/* Newsletter */}
      {/* <section className="newsletter">
        <div className="newsletter-overlay"></div>
        <div className="newsletter-content">
          <h2>Get Your Travel Inspiration</h2>
          <p>Straight to Your Inbox</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Email address"/>
            <button>Subscribe</button>
          </div>
        </div>
      </section> */}

<section className="newsletter">
              <div className="newsletter-overlay"></div>
              <div className="newsletter-content">
                <h2>Get Your Travel Inspiration</h2>
                <p>Straight to Your Inbox</p>
                <div className="newsletter-form">
                  <input type="email" placeholder="Email address"/>
                  <button>Subscribe</button>
                </div>
              </div>
            </section>
      <footer className="footer">
              <div className="footer-container">
                <div className="footer-column">
                  <h3>e-Tourism</h3>
                  <p onClick={() => {
                    navigate("/");
                    setTimeout(() => {
                      window.scrollTo(0, 0);
                    }, 0);
                  }}>start your journey</p>
                </div>
                <div className="footer-column">
                  <h4>Join us</h4>
                  <p onClick={() => navigate("/register/ehost/step1")}>Become e-host</p>
                  <p onClick={() => navigate("/continent/all")}>View the newest event</p>
                </div>
                <div className="footer-column">
                  <h4>Travel</h4>
                  <p onClick={() => navigate("/continent/Asia")}>Asia</p>
                  <p onClick={() => navigate("/continent/Europe")}>Europe</p>
                  <p onClick={() => navigate("/continent/Africa")}>Africa</p>
                </div>
                <div className="footer-column">
                  <h4>Support</h4>
                  <p onClick={() => setShowTerms(true)} style={{ cursor: "pointer" }}>
                    User Terms
                  </p>
                </div>
              </div>
            </footer>
      {showTerms && (
        <div className="modal-overlay" onClick={() => setShowTerms(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowTerms(false)}
            >
              ✕
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
    </div>
  );
};



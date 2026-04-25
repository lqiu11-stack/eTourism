import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import "../MainPage/Mainstyle.css";
import "./ContinentPage.css";
import searchIcon from "../icon/search.png";
import continentIcon from "../icon/continents.png";
import dateIcon from "../icon/calendar.png";
import filterIcon from "../icon/filter.png";
import backIcon from "../icon/back.png";
import { getCountryImage } from "../../utils/countryImages";

const API_BASE = import.meta.env.VITE_API_URL;
const VALID_CONTINENTS = ["Africa", "Asia", "Europe", "North America", "South America", "Oceania"];
const ALL_VALUE = "all";

const getImage = (exp) => getCountryImage(exp.country);

const formatDate = (dt) => {
  if (!dt) return "Choose a date...";
  const d = new Date(dt);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export const ContinentPage = () => {
  const navigate = useNavigate();
  const { continent } = useParams();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isEhost = user.role === "ehost";

  const isAll = continent === ALL_VALUE;
  const lockedContinent = isAll
    ? null
    : VALID_CONTINENTS.includes(continent) ? continent : null;

  const parseList = (value) => (value ? value.split(",").map(v => v.trim()).filter(Boolean) : []);

  const [experiences, setExperiences] = useState([]);
  const [searchLocation, setSearchLocation] = useState(searchParams.get("q") || "");
  const [searchDate, setSearchDate] = useState(searchParams.get("date") || "");

  const [activeContinents, setActiveContinents] = useState(() => parseList(searchParams.get("continents")));
  const [activeCategories, setActiveCategories] = useState(() => parseList(searchParams.get("categories")));
  const [activeLanguages, setActiveLanguages] = useState(() => parseList(searchParams.get("languages")));

  const [showRegionMenu, setShowRegionMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const [appliedQ, setAppliedQ] = useState(searchParams.get("q") || "");
  const [appliedDate, setAppliedDate] = useState(searchParams.get("date") || "");

  const toggleIn = (list, value) =>
    list.includes(value) ? list.filter(v => v !== value) : [...list, value];

  const fetchExperiences = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/visitor/experiences`);
      setExperiences(data);
    } catch {}
  }, []);

  useEffect(() => { fetchExperiences(); }, [fetchExperiences]);

  const filtered = experiences.filter(e => {
    if (lockedContinent && e.continent !== lockedContinent) return false;
    if (isAll && activeContinents.length && !activeContinents.includes(e.continent)) return false;
    if (activeCategories.length && !activeCategories.includes(e.category)) return false;
    if (activeLanguages.length && !activeLanguages.includes(e.language)) return false;
    if (appliedQ.trim()) {
      const needle = appliedQ.trim().toLowerCase();
      const locHit = e.location_name && e.location_name.toLowerCase().includes(needle);
      const countryHit = e.country && e.country.toLowerCase().includes(needle);
      if (!locHit && !countryHit) return false;
    }
    if (appliedDate && (!e.date_time || e.date_time.slice(0, 10) !== appliedDate)) return false;
    return true;
  });

  const headerTitle = isAll
    ? (activeContinents.length === 1 ? activeContinents[0] : "Explore destinations")
    : lockedContinent || "Explore destinations";

  const handleSearch = () => {
    setAppliedQ(searchLocation);
    setAppliedDate(searchDate);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const resetAll = () => {
    setActiveContinents([]);
    setActiveCategories([]);
    setActiveLanguages([]);
    setSearchLocation("");
    setSearchDate("");
    setAppliedQ("");
    setAppliedDate("");
    setShowRegionMenu(false);
    setShowCategoryMenu(false);
    setShowLanguageMenu(false);
  };

  return (
    <div className="main-page continent-page">

      <section className="hero">
        <div className="hero-overlay" />

        <div className="hero-content">

          <nav className="navbar">
            <button className="detail-back-btn" onClick={() => navigate(-1)}>
              <img src={backIcon} alt="Back" className="detail-back-icon" />
            </button>

            <div className="nav-links">
              <Link to="/register/ehost/step1" className="nav-link">Become E-host</Link>
              <Link
                to="/MyBooking"
                className="nav-link"
                onClick={(e) => {
                  if (isEhost) {
                    e.preventDefault();
                    alert("My booking is only available to visitors. You are signed in as an e-host.");
                    return;
                  }
                  window.scrollTo(0, 0);
                }}
              >
                My booking
              </Link>
              {isLoggedIn ? (
                <button className="nav-link nav-btn-link" onClick={handleLogout}>Logout</button>
              ) : (
                <Link to="/login" className="nav-link">Login</Link>
              )}
            </div>
          </nav>

          <h1 className="hero-title">{headerTitle}</h1>

          <div className="search-panel">

            <div className="search-row">

              <div className="search-pair location-group">
                <div className="search-title">
                  <div className="title-left">
                    <img src={continentIcon} alt="location" className="title-icon" />
                    <span>Country / Location</span>
                  </div>
                  <button className="map-link" type="button" onClick={() => navigate("/MapPage")}>Search by map</button>
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
                  <img src={dateIcon} className="date-icon" />
                  <span>Date</span>
                </div>
                <div className="search-box">
                  <input
                    type="text"
                    className="textbox-word"
                    value={formatDate(searchDate)}
                    placeholder="Select date"
                    readOnly
                    onClick={() => document.getElementById("real-date-input").showPicker()}
                  />
                  <input
                    id="real-date-input"
                    className="textbox-word"
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                  />
                </div>
              </div>

              <button className="search-btn" onClick={handleSearch}>
                <img src={searchIcon} className="date-icon" />
              </button>

            </div>

            <div className="filters">
              <div className="filter-title">
                <img src={filterIcon} className="filter-icon" />
                <span>Filter</span>
              </div>
              <div className="filter-list">

                {isAll && (
                  <div style={{ position: "relative" }}>
                    <button
                      className={`filter-chip${activeContinents.length ? " filter-chip--active" : ""}`}
                      onClick={() => { setShowRegionMenu(p => !p); setShowCategoryMenu(false); setShowLanguageMenu(false); }}
                    >
                      {activeContinents.length
                        ? `Region${activeContinents.length > 1 ? ` (${activeContinents.length})` : `: ${activeContinents[0]}`}`
                        : "+ Region"}
                    </button>
                    {showRegionMenu && (
                      <div className="filter-dropdown">
                        {VALID_CONTINENTS.map(c => (
                          <label key={c} className="filter-check">
                            <input
                              type="checkbox"
                              checked={activeContinents.includes(c)}
                              onChange={() => setActiveContinents(prev => toggleIn(prev, c))}
                            />
                            {c}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ position: "relative" }}>
                  <button
                    className={`filter-chip${activeCategories.length ? " filter-chip--active" : ""}`}
                    onClick={() => { setShowCategoryMenu(p => !p); setShowRegionMenu(false); setShowLanguageMenu(false); }}
                  >
                    {activeCategories.length
                      ? `Type${activeCategories.length > 1 ? ` (${activeCategories.length})` : `: ${activeCategories[0]}`}`
                      : "+ Tour type"}
                  </button>
                  {showCategoryMenu && (
                    <div className="filter-dropdown">
                      {["Cultural Tourism","Historical Tourism","Art Tourism","Eco Tourism","Luxury Tourism","Culinary Tourism","Wellness Tourism","Religious Tourism"].map(c => (
                        <label key={c} className="filter-check">
                          <input
                            type="checkbox"
                            checked={activeCategories.includes(c)}
                            onChange={() => setActiveCategories(prev => toggleIn(prev, c))}
                          />
                          {c}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ position: "relative" }}>
                  <button
                    className={`filter-chip${activeLanguages.length ? " filter-chip--active" : ""}`}
                    onClick={() => { setShowLanguageMenu(p => !p); setShowRegionMenu(false); setShowCategoryMenu(false); }}
                  >
                    {activeLanguages.length
                      ? `Language${activeLanguages.length > 1 ? ` (${activeLanguages.length})` : `: ${activeLanguages[0]}`}`
                      : "+ Tour language"}
                  </button>
                  {showLanguageMenu && (
                    <div className="filter-dropdown">
                      {["English","Spanish","French","German","Italian","Portuguese","Dutch","Arabic","Chinese","Japanese","Korean","Hindi","Thai","Turkish","Russian"].map(l => (
                        <label key={l} className="filter-check">
                          <input
                            type="checkbox"
                            checked={activeLanguages.includes(l)}
                            onChange={() => setActiveLanguages(prev => toggleIn(prev, l))}
                          />
                          {l}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <button className="filter-chip" onClick={resetAll}>
                  Reset filter
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="continent-grid-section">
        <h2 className="section-title">All activity</h2>
        {filtered.length === 0 ? (
          <p className="continent-empty">
            {experiences.length === 0
              ? `No experiences available${lockedContinent ? ` for ${lockedContinent}` : ""} yet.`
              : "No results match your filters."}
          </p>
        ) : (
          <div className="continent-grid">
            {filtered.map(exp => (
              <div
                key={exp.id}
                className="tour-card"
                onClick={() => navigate(`/DetailPage?id=${exp.id}`, { state: { from: "continent", continent: lockedContinent || "all" } })}
                style={{ cursor: "pointer" }}
              >
                <div className="tour-image">
                  <img src={getImage(exp)} alt={exp.title} />
                  <div className="image-overlay">
                    <h3>{exp.title}</h3>
                  </div>
                </div>
                <div className="tour-info">
                  <p>{formatDate(exp.date_time)}</p>
                  <p>£{exp.price} / per ticket</p>
                  <button className="book-btn">Click to book &gt;&gt;</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

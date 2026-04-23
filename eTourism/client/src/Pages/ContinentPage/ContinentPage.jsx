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

  const isAll = continent === ALL_VALUE;
  const activeContinent = isAll
    ? null
    : VALID_CONTINENTS.includes(continent) ? continent : "Asia";
  const headerTitle = isAll ? "Explore destinations" : activeContinent;

  const [experiences, setExperiences] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchLocation, setSearchLocation] = useState(searchParams.get("q") || "");
  const [searchDate, setSearchDate] = useState(searchParams.get("date") || "");

  const [activeCategory, setActiveCategory] = useState(null);
  const [activeLanguage, setActiveLanguage] = useState(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const applyFilters = useCallback((list, q, date) => {
    let results = list;
    if (q && q.trim()) {
      const needle = q.trim().toLowerCase();
      results = results.filter(e =>
        (e.location_name && e.location_name.toLowerCase().includes(needle)) ||
        (e.country && e.country.toLowerCase().includes(needle))
      );
    }
    if (date) {
      results = results.filter(e =>
        e.date_time && e.date_time.slice(0, 10) === date
      );
    }
    return results;
  }, []);

  const fetchExperiences = useCallback(async () => {
    const params = new URLSearchParams();
    if (activeContinent) params.set("continent", activeContinent);
    if (activeCategory) params.set("category", activeCategory);
    if (activeLanguage) params.set("language", activeLanguage);
    try {
      const { data } = await axios.get(`${API_BASE}/visitor/experiences?${params}`);
      setExperiences(data);
      setFiltered(data);
    } catch {}
  }, [activeContinent, activeCategory, activeLanguage]);

  useEffect(() => { fetchExperiences(); }, [fetchExperiences]);

  useEffect(() => {
    if (experiences.length === 0) return;
    const initialQ = searchParams.get("q");
    const initialDate = searchParams.get("date");
    if (initialQ || initialDate) {
      setFiltered(applyFilters(experiences, initialQ || "", initialDate || ""));
    }
  }, [experiences, searchParams, applyFilters]);

  const handleSearch = () => {
    setFiltered(applyFilters(experiences, searchLocation, searchDate));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
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
              <Link to="/Eregistrate1" className="nav-link">Become E-host</Link>
              <Link to="/MyBooking" className="nav-link" onClick={() => window.scrollTo(0, 0)}>
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

                <div style={{ position: "relative" }}>
                  <button
                    className={`filter-chip${activeCategory ? " filter-chip--active" : ""}`}
                    onClick={() => { setShowCategoryMenu(p => !p); setShowLanguageMenu(false); }}
                  >
                    {activeCategory ? `Type: ${activeCategory}` : "+ Tour type"}
                  </button>
                  {showCategoryMenu && (
                    <div className="filter-dropdown">
                      <button onClick={() => { setActiveCategory(null); setShowCategoryMenu(false); }}>All</button>
                      {["Cultural Tourism","Historical Tourism","Art Tourism","Eco Tourism","Luxury Tourism","Culinary Tourism","Wellness Tourism","Religious Tourism"].map(c => (
                        <button key={c} onClick={() => { setActiveCategory(c); setShowCategoryMenu(false); }}>{c}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ position: "relative" }}>
                  <button
                    className={`filter-chip${activeLanguage ? " filter-chip--active" : ""}`}
                    onClick={() => { setShowLanguageMenu(p => !p); setShowCategoryMenu(false); }}
                  >
                    {activeLanguage ? `Language: ${activeLanguage}` : "+ Tour language"}
                  </button>
                  {showLanguageMenu && (
                    <div className="filter-dropdown">
                      <button onClick={() => { setActiveLanguage(null); setShowLanguageMenu(false); }}>All</button>
                      {["English","Spanish","French","German","Italian","Portuguese","Dutch","Arabic","Chinese","Japanese","Korean","Hindi","Thai","Turkish","Russian"].map(l => (
                        <button key={l} onClick={() => { setActiveLanguage(l); setShowLanguageMenu(false); }}>{l}</button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  className="filter-chip"
                  onClick={() => {
                    setActiveCategory(null);
                    setActiveLanguage(null);
                    setSearchLocation("");
                    setSearchDate("");
                    setShowCategoryMenu(false);
                    setShowLanguageMenu(false);
                  }}
                >
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
              ? `No experiences available${activeContinent ? ` for ${activeContinent}` : ""} yet.`
              : "No results match your search."}
          </p>
        ) : (
          <div className="continent-grid">
            {filtered.map(exp => (
              <div
                key={exp.id}
                className="tour-card"
                onClick={() => navigate(`/DetailPage?id=${exp.id}`, { state: { from: "continent", continent: activeContinent || "all" } })}
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
                  <p>{exp.price}£ / per ticket</p>
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

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./Mainstyle.css";
import searchIcon from "../icon/search.png";
import continentIcon from "../icon/continents.png";
import dateIcon from "../icon/calendar.png";
import filterIcon from"../icon/filter.png";
import refundIcon from"../icon/cashback.png";
import customerSrevice from "../icon/customer-service.png"
import customerReview from "../icon/customer-review.png"
import LiveIcon from "../icon/live.png"
import translate from "../icon/language.png"
import { useNavigate, Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dt) => {
  if (!dt) return 'Choose a date...';
  const d = new Date(dt);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export const MainPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const [experiences, setExperiences] = useState([]);
  const [searchLocation, setSearchLocation] = useState("");
  const [searchDate, setSearchDate] = useState("");

  const [activeContinent, setActiveContinent] = useState(null);
  const [activeCategory,  setActiveCategory]  = useState(null);
  const [activeLanguage,  setActiveLanguage]  = useState(null);
  const [showRegionMenu,  setShowRegionMenu]  = useState(false);
  const [showCategoryMenu,setShowCategoryMenu]= useState(false);
  const [showLanguageMenu,setShowLanguageMenu]= useState(false);

  const fetchExperiences = useCallback(async () => {
    const params = new URLSearchParams();
    if (activeContinent) params.set('continent', activeContinent);
    if (activeCategory)  params.set('category',  activeCategory);
    if (activeLanguage)  params.set('language',  activeLanguage);
    try {
      const { data } = await axios.get(`${API_BASE}/visitor/experiences?${params}`);
      setExperiences(data);
    } catch {}
  }, [activeContinent, activeCategory, activeLanguage]);

  useEffect(() => { fetchExperiences(); }, [fetchExperiences]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation.trim()) params.set('q', searchLocation.trim());
    if (searchDate) params.set('date', searchDate);
    const target = activeContinent || 'Asia';
    navigate(`/continent/${target}${params.toString() ? `?${params}` : ''}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const continentCounts = experiences.reduce((acc, e) => {
    if (e.continent) acc[e.continent] = (acc[e.continent] || 0) + 1;
    return acc;
  }, {});

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
              <Link to="/Eregistrate1" className="nav-link">Become E-host</Link>
              <Link to="/MyBooking" className="nav-link" onClick={() => window.scrollTo(0, 0)}>
                My booking
              </Link>
              {isLoggedIn ? (
                <button className="nav-link nav-btn-link" onClick={handleLogout}>
                  Logout
                </button>
              ) : (
                <Link to="/login" className="nav-link">Login</Link>
              )}
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
                <div style={{ position: 'relative' }}>
                  <button
                    className={`filter-chip${activeContinent ? ' filter-chip--active' : ''}`}
                    onClick={() => { setShowRegionMenu(p => !p); setShowCategoryMenu(false); setShowLanguageMenu(false); }}
                  >
                    {activeContinent ? `Region: ${activeContinent}` : '+ Region'}
                  </button>
                  {showRegionMenu && (
                    <div className="filter-dropdown">
                      <button onClick={() => { setActiveContinent(null); setShowRegionMenu(false); }}>All</button>
                      {['Africa','Asia','Europe','North America','South America','Oceania'].map(c => (
                        <button key={c} onClick={() => { setActiveContinent(c); setShowRegionMenu(false); }}>{c}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <button
                    className={`filter-chip${activeCategory ? ' filter-chip--active' : ''}`}
                    onClick={() => { setShowCategoryMenu(p => !p); setShowRegionMenu(false); setShowLanguageMenu(false); }}
                  >
                    {activeCategory ? `Type: ${activeCategory}` : '+ Tour type'}
                  </button>
                  {showCategoryMenu && (
                    <div className="filter-dropdown">
                      <button onClick={() => { setActiveCategory(null); setShowCategoryMenu(false); }}>All</button>
                      {['Cultural Tourism','Historical Tourism','Art Tourism','Eco Tourism','Luxury Tourism','Culinary Tourism','Wellness Tourism','Religious Tourism'].map(c => (
                        <button key={c} onClick={() => { setActiveCategory(c); setShowCategoryMenu(false); }}>{c}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <button
                    className={`filter-chip${activeLanguage ? ' filter-chip--active' : ''}`}
                    onClick={() => { setShowLanguageMenu(p => !p); setShowRegionMenu(false); setShowCategoryMenu(false); }}
                  >
                    {activeLanguage ? `Language: ${activeLanguage}` : '+ Tour language'}
                  </button>
                  {showLanguageMenu && (
                    <div className="filter-dropdown">
                      <button onClick={() => { setActiveLanguage(null); setShowLanguageMenu(false); }}>All</button>
                      {['English','Spanish','French','German','Italian','Portuguese','Dutch','Arabic','Chinese','Japanese','Korean','Hindi','Thai','Turkish','Russian'].map(l => (
                        <button key={l} onClick={() => { setActiveLanguage(l); setShowLanguageMenu(false); }}>{l}</button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  className="filter-chip"
                  onClick={() => { setActiveContinent(null); setActiveCategory(null); setActiveLanguage(null); setSearchLocation(""); setSearchDate(""); setShowRegionMenu(false); setShowCategoryMenu(false); setShowLanguageMenu(false); }}
                >
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

      {/* Where Next */}
      <section className="where-wrapper">
        <div className="destination-section">
          <div className="where-header">
            <div>
              <h2 className="section-title">Where next?</h2>
              <p className="section-subtitle">Here are some popular choice</p>
            </div>
            <button className="more-btn" onClick={() => navigate('/continent/Asia')}>Explore more</button>
          </div>
          <div className="destination-grid">
            <div
              className="destination-card big-card"
              onClick={() => navigate('/continent/Asia')}
              style={{ cursor: 'pointer' }}
            >
              <div className="card-text">
                <h3>Asia</h3>
                <p>{continentCounts['Asia'] || 0} experience{continentCounts['Asia'] !== 1 ? 's' : ''} available</p>
              </div>
            </div>
            <div className="right-column">
              <div
                className="destination-card tall-card"
                onClick={() => navigate('/continent/Europe')}
                style={{ cursor: 'pointer' }}
              >
                <div className="small-card-text">
                  <h3>Europe</h3>
                  <p>{continentCounts['Europe'] || 0} experience{continentCounts['Europe'] !== 1 ? 's' : ''} available</p>
                </div>
              </div>
              <div
                className="destination-card tall-card"
                onClick={() => navigate('/continent/Africa')}
                style={{ cursor: 'pointer' }}
              >
                <div className="small-card-text">
                  <h3>Africa</h3>
                  <p>{continentCounts['Africa'] || 0} experience{continentCounts['Africa'] !== 1 ? 's' : ''} available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
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
          <div className="footer-brand">
            <h3>e-Tourism</h3>
            <p>Follow us</p>
          </div>
          <div className="footer-column">
            <h4>About us</h4>
            <p>Company</p>
            <p>Careers</p>
            <p>Blog</p>
          </div>
          <div className="footer-column">
            <h4>Travel</h4>
            <p>Destinations</p>
            <p>Tours</p>
            <p>Guides</p>
          </div>
          <div className="footer-column">
            <h4>Support</h4>
            <p>Help Center</p>
            <p>Contact</p>
            <p>Terms</p>
          </div>
        </div>
      </footer>

    </div>
  );
};
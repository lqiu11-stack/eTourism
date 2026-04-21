import { useState, useEffect } from "react";
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
import { getCountryImage } from "../../utils/countryImages";
import { useNavigate, Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

const getImage = (exp) => getCountryImage(exp.country);

const formatDate = (dt) => {
  if (!dt) return 'Date TBC';
  const d = new Date(dt);
  return `${d.getDate()} / ${d.getMonth() + 1} / ${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

export const MainPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const [experiences, setExperiences] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchLocation, setSearchLocation] = useState("");
  const [searchDate, setSearchDate] = useState("");

  useEffect(() => {
    axios.get(`${API_BASE}/visitor/experiences`)
      .then(({ data }) => { setExperiences(data); setFiltered(data); })
      .catch(() => {});
  }, []);

  const handleSearch = () => {
    let results = experiences;
    if (searchLocation.trim()) {
      const q = searchLocation.trim().toLowerCase();
      results = results.filter(e =>
        (e.location_name && e.location_name.toLowerCase().includes(q)) ||
        (e.country && e.country.toLowerCase().includes(q))
      );
    }
    if (searchDate) {
      results = results.filter(e =>
        e.date_time && e.date_time.slice(0, 10) === searchDate
      );
    }
    setFiltered(results);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const soldOut = filtered.filter(e => e.max_visitors <= 15);
  const monthly  = filtered.filter(e => e.max_visitors > 15);

  const continentCounts = experiences.reduce((acc, e) => {
    if (e.continent) acc[e.continent] = (acc[e.continent] || 0) + 1;
    return acc;
  }, {});

  const renderCard = (exp) => (
    <div
      className="tour-card"
      key={exp.id}
      onClick={() =>
        navigate(`/DetailPage?id=${exp.id}`, {
          state: { from: "main" },
        })
      }
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
        <button className="book-btn">
          Click to book &gt;&gt;
        </button>
      </div>
    </div>
  );

  return (
    <div className="main-page">

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay" />

        <div className="hero-content">

          <nav className="navbar">
            <div className="nav-links">
              <a className="nav-link" style={{cursor:'pointer'}} onClick={() => navigate("/Eregistrate1")}>
                Join us to become E-host
              </a>
            </div>

            <div className="nav-links">
              <Link to="/help" className="nav-link">Helping centre</Link>
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
                    placeholder="Today I wanna go..."
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
                    type="date"
                    className="date-input"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
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
                <button className="filter-chip">+ Region</button>
                <button className="filter-chip">+ Tour type</button>
                <button className="filter-chip">+ Tour language</button>
                <button className="filter-chip">More filter</button>
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
            <button className="more-btn">Explore more</button>
          </div>
          <div className="destination-grid">
            <div className="destination-card big-card">
              <div className="card-text">
                <h3>Asia</h3>
                <p>{continentCounts['Asia'] || 0} experience{continentCounts['Asia'] !== 1 ? 's' : ''} available</p>
              </div>
            </div>
            <div className="right-column">
              <div className="destination-card tall-card">
                <div className="small-card-text">
                  <h3>Europe</h3>
                  <p>{continentCounts['Europe'] || 0} experience{continentCounts['Europe'] !== 1 ? 's' : ''} available</p>
                </div>
              </div>
              <div className="destination-card tall-card">
                <div className="small-card-text">
                  <h3>Africa</h3>
                  <p>{continentCounts['Africa'] || 0} experience{continentCounts['Africa'] !== 1 ? 's' : ''} available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Almost Sold Out */}
      <section className="popular">
        <div className="destination-section">
          <div className="where-header">
            <div>
              <h2 className="section-title">Almost sold out!</h2>
              <p className="section-subtitle">Grab your last chance to explore the world with us.</p>
            </div>
            <button className="more-btn">Click here to check more</button>
          </div>
          <div className="card-list">
            {soldOut.length > 0
                ? soldOut.map(renderCard)
                : <p style={{color:'#666'}}>No experiences found.</p>
            }
          </div>
        </div>
      </section>

      {/* Top Choice This Month */}
      <section className="popular">
        <div className="destination-section">
          <div className="where-header">
            <div>
              <h2 className="section-title">Top choice this month!</h2>
              <p className="section-subtitle">Don't know what to choose? Check our monthly recommendation</p>
            </div>
            <button className="more-btn">Click here to check more</button>
          </div>
          <div className="card-list">
            { monthly.length > 0
                ? monthly.map(renderCard)
                : <p style={{color:'#666'}}>No experiences found.</p>
            }
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
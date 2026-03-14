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
import london from "../icon/London.png";
import iceland from "../icon/plane.png";
import paris from "../icon/paris.png";
import japan from "../icon/japan.png";
import china from "../icon/china.png";
import Philippine from "../icon/Philippine.png";
import korea from "../icon/korea.png";
import singapore from "../icon/Singapore.png";

export const MainPage = () => {
  return (
    <div className="main-page">

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay" />

        <div className="hero-content">

          <nav className="navbar">
            <div className="logo">e-Tourism</div>

            <div className="nav-links">
              <a>Helping centre</a>
              <a>My booking</a>
              <a>Logout</a>
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

                  <button className="map-link" type="button">
                    Search by map
                  </button>
                </div>

              <div className="search-box">
                <input
                  type="text"
                  placeholder="Today I wanna go..."
                  className="textbox-word"
                />
              </div>
            </div>


            <div className="search-pair date-group">
              <div className="search-title">
                <img src={dateIcon} className="date-icon"/>
                <span>Date</span>
              </div>

              <div className="search-box">
                <input type="date" className="date-input"/>
              </div>
            </div>


            <button className="search-btn">
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
          <span className="icon-circle">
            <img src={refundIcon} className="filter-icon"/>
          </span>
          <h4>Free refund</h4>
          <p>24 hours before stream start</p>
        </div>

        <div className="feature">
          <span className="icon-circle">
            <img src={customerSrevice} className="filter-icon"/>
          </span>
          <h4>Customer service</h4>
          <p>We got 24/7 online service</p>
        </div>

        <div className="feature">
          <span className="icon-circle">
            <img src={customerReview} className="filter-icon"/>
          </span>
          <h4>Worldwide</h4>
          <p>Over 1000 service</p>
        </div>

        <div className="feature">
          <span className="icon-circle">
            <img src={LiveIcon} className="filter-icon"/>
          </span>
          <h4>Support Multi-platform</h4>
          <p>Friendly to every customer</p>
        </div>

        <div className="feature">
          <span className="icon-circle">
            <img src={translate} className="filter-icon"/>
          </span>
          <h4>Different Language</h4>
          <p>Friendly to customer</p>
        </div>

      </section>
        <section className="where-wrapper">
          <div className="destination-section">
            <div className="where-header">
              <div>
                <h2 className="section-title">Where next?</h2>
                <p className="section-subtitle">Here are some popular choice</p>
              </div>

              <button className="more-btn">Explore more </button>
            </div>
            <div className="destination-grid">
              <div className="destination-card big-card">
                <div className="card-text">
                  <h3>Asia</h3>
                  <p>Check our new tourism spot</p>
                </div>
              </div>

              <div className="right-column">
                <div className="destination-card tall-card">
                  <div className="small-card-text">
                    <h3>Europe</h3>
                    <p>Discover classic beauty</p>
                  </div>
                </div>

                <div className="destination-card tall-card">
                  <div className="small-card-text">
                    <h3>Africa</h3>
                    <p>Explore natural wonders</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


      {/* Popular */}
      <section className="popular">
        <div className="destination-section">

          <div className="where-header">
              <div>
            <h2 className="section-title">Almost sold out!</h2>
            <p className="section-subtitle">Grab your last chance to explore the world with us.</p>
            </div>
            <button className="more-btn">Click here to check more </button>
          </div>

          <div className="card-list">

            <div className="tour-card">

            <div className="tour-image">
              <img src={london} alt="London" />

              <div className="image-overlay">
                <h3>London Historical Tourism</h3>
              </div>
            </div>

            <div className="tour-info">
              <p>20 / 2 / 2025 14:00</p>
              <p>40£ / per ticket</p>

              <button className="book-btn">Click to book &gt;&gt;</button>
            </div>

          </div>

            <div className="tour-card">

            <div className="tour-image">
              <img src={iceland} alt="London" />

              <div className="image-overlay">
                <h3>Iceland Plane Tourism</h3>
              </div>
            </div>

            <div className="tour-info">
              <p>20 / 3 / 2025 14:00</p>
              <p>30£ / per ticket</p>

              <button className="book-btn">Click to book &gt;&gt;</button>
            </div>

          </div>


            <div className="tour-card">

            <div className="tour-image">
              <img src={paris} alt="London" />

              <div className="image-overlay">
                <h3>Paris Art Tourism </h3>
              </div>
            </div>

            <div className="tour-info">
              <p>20 / 2 / 2025 14:00</p>
              <p>40£ / per ticket</p>

              <button className="book-btn">Click to book &gt;&gt;</button>
            </div>

          </div>
           <div className="tour-card">

            <div className="tour-image">
              <img src={japan} alt="London" />

              <div className="image-overlay">
                <h3>Japan Art Tourism  </h3>
              </div>
            </div>

            <div className="tour-info">
              <p>20 / 2 / 2025 14:00</p>
              <p>40£ / per ticket</p>

              <button className="book-btn">Click to book &gt;&gt;</button>
            </div>

          </div>
          
          </div>

        </div>
      </section>


  {/* month */}
      <section className="popular">
        <div className="destination-section">

          <div className="where-header">
              <div>
            <h2 className="section-title">Top choice this month!</h2>
            <p className="section-subtitle">Don't know what to choose? Check our monthly recommendation</p>
            </div>
            <button className="more-btn">Click here to check more </button>
          </div>

          <div className="card-list">

            <div className="tour-card">

            <div className="tour-image">
              <img src={china} alt="London" />

              <div className="image-overlay">
                <h3>China Historical Tourism </h3>
              </div>
            </div>

            <div className="tour-info">
              <p>20 / 2 / 2025 14:00</p>
              <p>40£ / per ticket</p>

              <button className="book-btn">Click to book &gt;&gt;</button>
            </div>

          </div>

            <div className="tour-card">

            <div className="tour-image">
              <img src={Philippine} alt="London" />

              <div className="image-overlay">
                <h3>Philippine Natural Tourism </h3>
              </div>
            </div>

            <div className="tour-info">
              <p>20 / 3 / 2025 14:00</p>
              <p>30£ / per ticket</p>

              <button className="book-btn">Click to book &gt;&gt;</button>
            </div>

          </div>


            <div className="tour-card">

            <div className="tour-image">
              <img src={korea} alt="London" />

              <div className="image-overlay">
                <h3>Korea Urban Tourism  </h3>
              </div>
            </div>

            <div className="tour-info">
              <p>20 / 2 / 2025 14:00</p>
              <p>40£ / per ticket</p>

              <button className="book-btn">Click to book &gt;&gt;</button>
            </div>

          </div>
           <div className="tour-card">

            <div className="tour-image">
              <img src={singapore} alt="London" />

              <div className="image-overlay">
                <h3>Singapore City Tourism   </h3>
              </div>
            </div>

            <div className="tour-info">
              <p>20 / 2 / 2025 14:00</p>
              <p>40£ / per ticket</p>

              <button className="book-btn">Click to book &gt;&gt;</button>
            </div>

          </div>
          
          </div>

        </div>
      </section>
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
import "./Mainstyle.css";

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
          <div className="search-box">

            <input
              type="text" 
              placeholder="Today I wanna go..." 
              className="textbox-word"
            />

            <input
              type="date"
            />

            <button className="search-btn">
            </button>

          </div>

          <div className="filters">

            <button>Filter</button>
            <button>Cheap</button>
            <button>Tour type</button>
            <button>Tour Language</button>
            <button>More filter</button>

          </div>  
          </div>
        </div>
      </section>


      {/* Features */}
      <section className="features">

        <div className="feature">
          <h4>Free refund</h4>
          <p>24 hours before stream start</p>
        </div>

        <div className="feature">
          <h4>Customer service</h4>
          <p>We got 24/7 online service</p>
        </div>

        <div className="feature">
          <h4>Worldwide</h4>
          <p>Over 1000 service</p>
        </div>

        <div className="feature">
          <h4>Support Multi-platform</h4>
          <p>Friendly to every customer</p>
        </div>

        <div className="feature">
          <h4>Different Language</h4>
          <p>Friendly to customer</p>
        </div>

      </section>


      {/* Category */}
      <section className="categories">

        <h2>Where to next?</h2>

        <div className="category-list">

          <div className="category-card">Experience Asia</div>
          <div className="category-card">Experience Wild</div>
          <div className="category-card">Experience History</div>
          <div className="category-card">Experience Art</div>

        </div>

      </section>


      {/* Popular */}
      <section className="popular">

        <div className="section-header">
          <h2>Popular choice</h2>
          <span>Check more &gt;</span>
        </div>

        <div className="card-list">

          <div className="tour-card">
            <img src="/images/london.jpg" />
            <div className="card-info">
              <h3>London Historical Tourism</h3>
              <p>20/2/2025 14:00</p>
              <p>40£ / per ticket</p>
            </div>
          </div>

          <div className="tour-card">
            <img src="/images/paris.jpg" />
            <div className="card-info">
              <h3>Paris Art Tourism</h3>
              <p>20/2/2025 14:00</p>
              <p>30£ / per ticket</p>
            </div>
          </div>

          <div className="tour-card">
            <img src="/images/thailand.jpg" />
            <div className="card-info">
              <h3>Thailand Religious Tourism</h3>
              <p>20/2/2025 14:00</p>
              <p>25£ / per ticket</p>
            </div>
          </div>

        </div>

      </section>



      {/* Almost Sold Out */}
      <section className="popular">

        <div className="section-header">
          <h2>Almost sold out!</h2>
          <span>Check more &gt;</span>
        </div>

        <div className="card-list">

          <div className="tour-card">
            <img src="/images/museum.jpg" />
            <div className="card-info">
              <h3>British Museum Tourism</h3>
              <p>25£ / per ticket</p>
            </div>
          </div>

          <div className="tour-card">
            <img src="/images/iceland.jpg" />
            <div className="card-info">
              <h3>Iceland Plane Tourism</h3>
              <p>40£ / per ticket</p>
            </div>
          </div>

          <div className="tour-card">
            <img src="/images/africa.jpg" />
            <div className="card-info">
              <h3>Africa Zoo Tourism</h3>
              <p>35£ / per ticket</p>
            </div>
          </div>

        </div>

      </section>

    </div>
  );
};
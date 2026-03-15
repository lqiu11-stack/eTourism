import "./DetailPage.css";

import heroImg from "../icon/London.png";
import videoImg from "../icon/livecover.png";
import head from "../icon/head.png";
import photo1 from "../icon/London.png";
import photo2 from "../icon/london1.jpg";
import photo3 from "../icon/london2.jpg";
import photo4 from "../icon/london3.jpg";
import { useNavigate } from "react-router-dom";
import backIcon from "../icon/back.png";
import blog from "../icon/blogger.png";

export const DetailPage = () => {
     const navigate = useNavigate();
  return (
    <div className="tour-page">

      {/* HERO */}
      <section
        className="detail-hero"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        <div className="detail-hero-overlay"/>

        <nav className="navbar">
            <button
                    type="button"
                    className="detail-back-btn"
                    onClick={() => navigate("/MainPage")}
                    aria-label="Back"
                  >
                    <img src={backIcon} alt="Back" className="back-icon" />
                  </button>

          <div className="nav-links">
            <a>Helping centre</a>
            <a>My booking</a>
            <a>Logout</a>
          </div>
        </nav>

        <div className="detail-hero-content">

          <div className="detail-hero-left">
            <h1>London Tourism</h1>

            <p>
              Explore the timeless beauty of London, a city where history and modern life meet.
Visit world-famous landmarks like Big Ben, the London Eye, and the River Thames.
Experience the culture, stories, and atmosphere of London through our immersive live tour.
            </p>

            <div className="detail-tags">
              <span>UK</span>
              <span>City view</span>
              <span>English</span>
            </div>
          </div>

          <div className="detail-hero-right">
            <h3>Live Start</h3>
            <p>20/4/2025 14:00</p>
            <p>25£ / per ticket</p>

            <button className="detail-book-btn">
              Book it now!
            </button>
          </div>

        </div>
      </section>


      {/* PAST VIDEO */}
      <section className="detail-video-section">

        <div className="detail-video-left">
          <h3>Are you still hesitating?</h3>
          <p>Check our past video</p>

          <img src={videoImg} alt="detail-live video"/>
        </div>

        <div className="detail-video-right">
          <p>
            This live stream takes viewers on an immersive evening tour of
            Wat Arun (Temple of Dawn) in Bangkok, capturing the breathtaking
            moment when the temple’s golden lights illuminate against the
            Chao Phraya River.
          </p>

          <p>
            Led by a professional local guide, the stream offers real-time
            storytelling, cultural insights, and interactive Q&A.
          </p>

          <ul>
            <li>Wat Arun’s main prang and porcelain details</li>
            <li>Evening lights along the Chao Phraya River</li>
            <li>Nearby highlights such as Wat Pho</li>
          </ul>
        </div>

      </section>


      {/* GUIDE */}
      <section className="detail-guide-section">

        <div className="detail-guide-card">

          <img
            src={head}
            className="detail-guide-avatar"
            alt="detail-guide"
          />

          <div>
            <h4>Daniel</h4>

            <p>
              Hi, I'm Daniel, a licensed Bangkok tour guide specializing
              in cultural and religious heritage tours. My guiding style is
              interactive and story-driven.
            </p>
          </div>

        </div>

      </section>


      {/* REVIEWS */}
      <section className="detail-blog-section">

        <div className="blog-card">

        <div className="blog-top">
            <span className="quote">❝</span>

            <div className="stars">
            ★ ★ ★ ★ ★
            </div>
        </div>

        <h3 className="blog-name">Miky</h3>

        <p className="blog-text">
            As a travel blogger who has explored many cities around the world, I was truly impressed by this live tour experience. Watching London come alive at sunset while learning about its history and culture from a local guide was both relaxing and fascinating. The views of Big Ben and the River Thames were absolutely breathtaking. I would highly recommend this experience to anyone who wants to discover London in a unique and immersive way.
        </p>

        </div>
        <div className="detail-video-left">
          <h3>Recommended by Travel Bloggers</h3>
          <p>Book the ticket and join us!</p>

          <img src={blog} alt="detail-live video"/>
        </div>

      </section>

      <section className="detail-review-section">

        <h3>Customer’s review is important for us</h3>

        <div className="detail-reviews">

          <div className="detail-review">
            <h4>Alex from US</h4>
            <p>Wow, this view is absolutely stunning!</p>
          </div>

          <div className="detail-review">
            <h4>Amy from UK</h4>
            <p>The sunset colors and the temple lights are incredible.</p>
          </div>

          <div className="detail-review">
            <h4>John from UK</h4>
            <p>The guide explains the history very clearly.</p>
          </div>

        </div>

      </section>


      {/* REFUND */}
      <section className="detail-refund-section">

        <h3>Refund policy</h3>

        <div className="detail-refund-card">
          Free cancellation up to 24 hours before live start. If you miss the
          session, a replay will be available for 24 hours.
        </div>

      </section>


      {/* PHOTOS */}
      <section className="detail-photo-section">

        <h3>More photo</h3>

        <div className="detail-photo-grid">

          <img src={photo1}/>
          <img src={photo2}/>
          <img src={photo3}/>
          <img src={photo4}/>

        </div>

      </section>


      <section className="detail-newsletter">

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

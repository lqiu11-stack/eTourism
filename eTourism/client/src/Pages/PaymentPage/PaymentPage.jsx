import "./PaymentPage.css";
import paypalIcon from "../icon/paypal.png";
import masterIcon from "../icon/card.png";
import backIcon from "../icon/back.png";
import close from"../icon/close.png";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState } from "react";


export const PaymentPage = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const isLoggedIn = !!token;

    const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    };
    /* count for the ticket */
    const [count, setCount] = useState(0);
    const [count2, setCount2] = useState(0);
    const total = count * 25 + count2 * 15;

    /*user terms window */
    const [showTerms, setShowTerms] = useState(false);
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [termsError, setTermsError] = useState("");

    /* email and name */
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const [error, setError] = useState("");
    const checkInformation = () => {
        if (!name || !email) {
            setError("Please fill in your name and email.");
            return false;
        }

        if (!email.includes("@")) {
            setError("Please enter a valid email.");
            return false;
        }

        setError("");
        return true;
        };
    /*check out */
    const handleCheckout = () => {
    if (!checkInformation()) return;
    if (!agreedTerms) {
        setTermsError("Please agree to the Terms before checkout.");
        alert("Please agree to the Terms before checkout.");
        return;
    }

    setTermsError("");

    alert("Proceeding to checkout...");
    };

  return (
    <div className="payment-page">

      <div className="payment-card">
        <nav className="navbar">
                    <button
                            type="button"
                            className="detail-back-btn"
                            onClick={() => navigate("/DetailPage")}
                            aria-label="Back"
                          >
                            <img src={backIcon} alt="Back" className="detail-back-icon" />
                          </button>
        
                  <div className="nav-links">
                      <Link to="/help" className="nav-link">Helping centre</Link>
                      <Link to="/booking" className="nav-link">My booking</Link>
                       {isLoggedIn ? (
                          <button className="nav-link nav-btn-link" onClick={handleLogout}>
                            Logout
                          </button>
                        ) : (
                          <Link to="/login" className="nav-link">Login</Link>
                        )}
                    </div>
                </nav>

        {/* LEFT */}
        <div className="payment-left">
          <h2>Payment</h2>

          <p className="tour-title">Thailand Religious Tourism</p>

          <p className="live-time">
            <strong>Live Start</strong><br />
            20/4/2025 14:00
          </p>

          {/* Ticket 1 */}
          <div className="ticket">
            <div>
              <p className="ticket-title">
                Normal ticket <span>25£ / per ticket</span>
              </p>
              <span className="small-text">(include Q&A)</span>
            </div>

            <div className="counter">
              <button onClick={() => setCount(Math.max(0, count - 1))}>-</button>
              <span>{count}</span>
              <button onClick={() => setCount(count + 1)}>+</button>
            </div>

            <p className="ticket-text">Ticket(s)</p>
          </div>

          {/* Ticket 2 */}
          <div className="ticket">
            <div>
              <p className="ticket-title">
                Economic ticket <span>15£ / per ticket</span>
              </p>
              <Link className="ticket-link">click to see the detail</Link>
            </div>

            <div className="counter">
             <button onClick={() => setCount2(Math.max(0, count2 - 1))}>-</button>
              <span>{count2}</span>
              <button onClick={() => setCount2(count2 + 1)}>+</button>
            </div>

            <p className="ticket-text">Ticket(s)</p>
          </div>

          {/* Terms */}
          <div className="terms">
            <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => {
                setAgreedTerms(e.target.checked);
                if (e.target.checked) {
                    setTermsError("");
                }
                }}
            />
            <label>
                I agree to{" "}
                <Link className="terms-link" onClick={() => setShowTerms(true)}>
                the Terms
                </Link>{" "}
                and confirm I am 18+.
            </label>
            </div>

            {termsError && <p className="input-error">{termsError}</p>}

          {/* Total */}
          <div className="total">
            <h3>Total</h3>
            <p>25£ x 1 ticket</p>
            <p>promote code AISA20 -5£</p>

            <div className="price">{total}£</div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="payment-right">
          <h2>Booking Detail</h2>

          <label>Please tell us your name*</label>
          <input type="text" 
           value={name}
           onChange={(e) => setName(e.target.value)}/>

          <label>
            Please tell us your email*
            <span>(stream link will send through email)</span>
          </label>
          <input type="email" 
           value={email}
           onChange={(e) => setEmail(e.target.value)}/>
           {error && <p className="input-error">{error}</p>}

          <label>Promote code</label>
          <input type="text" />

          {/* Payment buttons */}
          <div className="pay-btn">
            <img src={paypalIcon} alt="paypal" />
            <button onClick={handleCheckout}>Use Paypal to pay</button>
          </div>

          <div className="pay-btn">
            <img src={masterIcon} alt="card" />
            <button onClick={handleCheckout}>Use Paypal to pay</button>
          </div>
        </div>

      </div>
      {showTerms && (
        <div className="modal-overlay" onClick={() => setShowTerms(false)}>
            <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="modal-close"
                    onClick={() => setShowTerms(false)}
                    aria-label="Close"
                >
                <img src={close} className="close-icon"></img>
                </button>
            <h2>Terms & Conditions</h2>
            <div className="modal-content">
            <p>1. ACCEPTANCE OF TERMS<br />
               By registering for or using the eTourism platform ("Platform"), you agree to be bound by this User Agreement and Terms of Service ("Agreement"). If you do not agree to these terms, you may not use the Platform or create an account.<br />

               <br />
                2. ELIGIBILITY<br />
                You must be at least 18 years of age to create an account and to book or host experiences. By registering, you represent that you meet this age requirement and have the legal capacity to enter into this Agreement. The Platform may be used in different roles: as a Visitor (booking experiences) or as an E-host (creating and hosting experiences). Your use must comply with applicable local laws.<br />
                <br />
                3. ACCOUNT REGISTRATION AND SECURITY<br />
                You must provide accurate, current, and complete information when registering. You are responsible for maintaining the confidentiality of your password and for all activity under your account. You must notify us promptly of any unauthorized use. One person or legal entity may maintain only one account unless we expressly permit otherwise.<br />
                <br />
                4. USE AS A VISITOR (BOOKING EXPERIENCES)<br />
                When you book an experience as a Visitor:<br />
                - You agree to pay the price and any applicable fees displayed at the time of booking. Payment methods (e.g. card, supported payment providers) must be valid and you authorize us to charge them in accordance with your booking.<br />
                - Booking confirmations, meeting links, and experience details will be provided as described on the Platform. You are responsible for attending at the scheduled time or for following the cancellation/reschedule and refund policies stated at the time of booking.<br />
                - Refund and cancellation rules (including any percentage or amount refundable based on days before the event) are as stated at the time of booking and in the experience listing. We do not guarantee refunds beyond what is explicitly stated in those policies.<br />
                <br />
                5. USE AS AN E-HOST (HOSTING EXPERIENCES)<br />
                If you use the Platform as an E-host to create and host experiences:<br />
                - You are responsible for the accuracy of your listings, for providing the experience as described, and for complying with all applicable laws and regulations. The Platform may require separate E-host terms or verification.<br />
                - You agree to conduct yourself professionally and to treat Visitors fairly. You must not discriminate unlawfully or violate any participant's rights.<br />
                <br />
                6. CONDUCT DURING LIVE EXPERIENCES<br />
                - You agree to behave appropriately during live experiences and to comply with the E-host's reasonable instructions. Harassment, abuse, hate speech, illegal activity, or any conduct that endangers or offends others is prohibited.<br />
                - Experiences may be recorded for quality assurance, safety, and dispute resolution. By joining an experience, you consent to such recording and to the use of such recordings as described in our Privacy Policy and as permitted by law.<br />
                - The Platform and E-hosts may suspend or terminate your access to an experience or to the Platform if you violate these conduct standards.<br />
                <br />
                7. PAYMENTS AND FEES<br />
                - You must have a valid payment method on file where required for bookings. All amounts are in the currency shown at the time of booking. We may use third-party payment processors (e.g. Stripe); their terms may also apply to your payments.<br />
                - Fees, taxes, and pricing are as displayed. We reserve the right to correct pricing errors and to modify fees with notice where permitted by law.<br />
                <br />
                8. PRIVACY AND PERSONAL DATA<br />
                - We collect and process personal data (e.g. name, email, date of birth, payment information) as described in our Privacy Policy. By using the Platform, you consent to such processing.<br />
                - Recordings of experiences may contain your image or voice; consent is given as set out in section 6 above. We and E-hosts may use recordings for the purposes stated in this Agreement and in our Privacy Policy.<br />
                <br />
                9. PROHIBITED CONDUCT<br />
                You may not: (a) use the Platform for any illegal purpose or in violation of any laws; (b) impersonate others or provide false information; (c) interfere with the Platform's operation or security; (d) scrape, copy, or misuse content or data without permission; (e) circumvent payment or booking systems; or (f) use the Platform to harm, harass, or defraud others. We may suspend or terminate accounts that violate these terms.<br />
                <br />
                10. INTELLECTUAL PROPERTY<br />
                The Platform's name, logo, design, and content (other than user-generated content) are owned by us or our licensors. You may not use them without our prior written permission. You retain ownership of content you submit; you grant us a license to use it as needed to operate the Platform and as set out in our policies.<br />
                <br />
                11. DISCLAIMER AND LIMITATION OF LIABILITY<br />
                The Platform and experiences are provided "as is." We do not guarantee uninterrupted or error-free service. To the fullest extent permitted by law, we are not liable for indirect, incidental, special, or consequential damages, or for any loss of data, revenue, or profits arising from your use of the Platform or experiences. Our total liability shall not exceed the amount you paid to us in the twelve months preceding the claim. Some jurisdictions do not allow certain limitations; in such cases our liability is limited to the maximum permitted by law.<br />
                <br />
                12. DISPUTES AND GOVERNING LAW<br />
                Disputes between you and us shall be resolved in accordance with the dispute resolution process stated in our policies and, where applicable, the laws of the jurisdiction designated by us. Disputes between you and an E-host or another user may be subject to separate resolution procedures.<br />
                <br />
                13. CHANGES TO THIS AGREEMENT<br />
                We may update this Agreement from time to time. We will notify you of material changes (e.g. by email or notice on the Platform). Continued use of the Platform after the effective date of changes constitutes acceptance of the updated Agreement. If you do not agree, you must stop using the Platform and may close your account.<br />
                <br />
                14. GENERAL<br />
                If any part of this Agreement is held invalid or unenforceable, the remaining parts remain in effect. Our failure to enforce a right does not waive that right. This Agreement (together with our Privacy Policy and any other referenced policies) constitutes the entire agreement between you and us regarding the Platform.<br />

            </p>
            </div>
            </div>
        </div>
        )}
    </div>

  );
};

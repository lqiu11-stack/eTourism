import "./style.css";
import backIcon from "../icon/back.png";
import { useNavigate } from "react-router-dom";

export const PasswordReset = () => {
  const navigate = useNavigate();

  return (
    <div className="password-reset">
      
      {/* Back Button */}
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate("/")}
      >
        <img src={backIcon} alt="Back" className="back-icon" />
      </button>

      <div className="reset-box">

        <h1 className="reset-title">Password reset</h1>

        <p className="reset-subtitle">
          Please verify your email. The verification code has been sent to your registration email.
        </p>


        
        <label className="reset-label">Verify code</label>
        <div className="verify-row">
          <input type="text" className="verify-input" />
          <button className="verify-btn">Verify</button>
        </div>

        <h3 className="reset-section-title">
          Please reset your password
        </h3>

        <label className="reset-label">New password</label>
        <input type="password" placeholder="New password" className="reset-input" />

        <label className="reset-label">Please type it again</label>
        <input type="password" placeholder="Enter new password again" className="reset-input" />

        <button className="reset-btn">Reset</button>

      </div>
    </div>
  );
};
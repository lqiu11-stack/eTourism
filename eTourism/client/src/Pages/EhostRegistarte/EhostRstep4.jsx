import { useState } from "react";
import arrowRight from "../icon/arrow-right.png";
import backIcon from "../icon/back.png";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { StepProgress } from "./Step.jsx";

export const Eregistrate4 = () => {
  const navigate = useNavigate();

  const options = [
    "Cultural Tourism",
    "Historical Tourism",
    "Art Tourism",
    "Eco Tourism",
    "Luxury Tourism",
    "Culinary Tourism",
    "Wellness Tourism",
    "Religious Tourism"
  ];

  const [selectedTags, setSelectedTags] = useState([]);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((item) => item !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="join-e-host-page">
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate("/Eregistrate3")}
        aria-label="Back"
      >
        <img src={backIcon} alt="Back" className="back-icon" />
      </button>

      <div className="join-e-host-step">
        <form className="join-box">
          <h1 className="text-wrapper">Ready to become &nbsp;e-host?</h1>

          <StepProgress step={4} />

          <label className="text-wrapper-3">
            Privacy Contract 
          </label>
          <div className="contract-box">
            <p>
              By registering as an e-host on this platform, you agree to provide accurate
              and truthful information during the registration process. The personal
              information you provide, including but not limited to your name, contact
              details, nationality, work experience, and other relevant information, may
              be collected and processed for the purpose of verifying your identity,
              assessing your eligibility as an e-host, and managing your account on the
              platform.

              <br /><br />

              Your information may be used by the platform administrators to review your
              qualifications, confirm the authenticity of the information provided, and
              ensure compliance with our community guidelines and service policies. In
              certain cases, your information may also be used to conduct background
              checks or verification procedures to maintain the safety and reliability of
              the platform.

              <br /><br />

              The platform will take reasonable measures to protect your personal data and
              will only use your information for legitimate operational purposes,
              including service improvement, platform security, and user support. Your
              information will not be sold to third parties. However, it may be shared
              with trusted service providers or regulatory authorities when required for
              verification, legal compliance, or fraud prevention.

              <br /><br />

              By continuing with the registration process, you acknowledge that the
              information you provide may be reviewed and verified by the platform. You
              also agree that incomplete, false, or misleading information may result in
              the rejection of your application or the suspension of your account.

              <br /><br />

              If you have questions regarding the collection or use of your personal
              data, please contact the platform support team.
            </p>
          </div>
          <label className="checkbox-item">
                <input
                type="radio"
                name="experience"
                value="yes"
                />
                I have read and agree to the Privacy and Data Use Agreement.
            </label>
          <div className="email-wrapper">
            <text className= "space">After submit the application form, your information will be checked by our admin, the confirm email will be sent into your email, in 2-3 working day.</text>
            <button type="submit" className="next-btn">
              <img src={arrowRight} alt="Next" className="next-icon" onClick={() => navigate("/")}/>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};